export const LANGUAGES = [
  'plaintext',
  'javascript',
  'typescript',
  'python',
  'ruby',
  'rust',
  'go',
  'java',
  'kotlin',
  'c',
  'cpp',
  'csharp',
  'swift',
  'objectivec',
  'bash',
  'sql',
  'php',
  'r',
  'lua',
  'perl',
  'elixir',
  'erlang',
  'haskell',
  'ocaml',
  'scala',
  'clojure',
  'dart',
  'zig',
  'nim',
  'css',
  'scss',
  'less',
  'xml',
  'json',
  'yaml',
  'markdown',
  'ini',
  'diff',
  'dockerfile',
  'makefile',
  'cmake',
  'protobuf',
  'graphql',
  'x86asm',
  'wasm'
];

export function detectLanguage(filename) {
  if (!filename) return 'plaintext';
  const ext = filename.split('.').pop().toLowerCase();
  const map = {
    js: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    jsx: 'javascript',
    py: 'python',
    pyw: 'python',
    rb: 'ruby',
    rs: 'rust',
    go: 'go',
    java: 'java',
    kt: 'kotlin',
    kts: 'kotlin',
    c: 'c',
    h: 'c',
    cpp: 'cpp',
    cxx: 'cpp',
    cc: 'cpp',
    hpp: 'cpp',
    cs: 'csharp',
    swift: 'swift',
    m: 'objectivec',
    mm: 'objectivec',
    html: 'xml',
    htm: 'xml',
    xhtml: 'xml',
    xml: 'xml',
    svg: 'xml',
    css: 'css',
    scss: 'scss',
    sass: 'scss',
    less: 'less',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'ini',
    md: 'markdown',
    mdx: 'markdown',
    sh: 'bash',
    zsh: 'bash',
    bash: 'bash',
    fish: 'bash',
    sql: 'sql',
    php: 'php',
    r: 'r',
    lua: 'lua',
    pl: 'perl',
    pm: 'perl',
    ex: 'elixir',
    exs: 'elixir',
    erl: 'erlang',
    hs: 'haskell',
    ml: 'ocaml',
    mli: 'ocaml',
    scala: 'scala',
    clj: 'clojure',
    cljs: 'clojure',
    dart: 'dart',
    zig: 'zig',
    nim: 'nim',
    v: 'verilog',
    sv: 'verilog',
    dockerfile: 'dockerfile',
    makefile: 'makefile',
    cmake: 'cmake',
    tf: 'hcl',
    proto: 'protobuf',
    graphql: 'graphql',
    gql: 'graphql',
    vue: 'xml',
    svelte: 'xml',
    wasm: 'wasm',
    asm: 'x86asm',
    s: 'x86asm',
    ini: 'ini',
    cfg: 'ini',
    conf: 'ini',
    diff: 'diff',
    patch: 'diff'
  };
  return map[ext] || 'plaintext';
}

export function autoCorrectCode(content, language) {
  if (!content) return content;
  let corrected = content;
  if (language === 'json') {
    try {
      corrected = JSON.stringify(JSON.parse(content), null, 2);
    } catch (e) {
      corrected = content
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":')
        .replace(/:\s*'([^']*)'/g, ':"$1"');
      try {
        corrected = JSON.stringify(JSON.parse(corrected), null, 2);
      } catch (err) {}
    }
  } else if (language === 'javascript' || language === 'typescript') {
    const lines = content.split('\n');
    let indent = 0;
    corrected = lines
      .map((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('}') || trimmed.startsWith(']')) {
          indent = Math.max(0, indent - 1);
        }
        const formatted = '  '.repeat(indent) + trimmed;
        if (trimmed.endsWith('{') || trimmed.endsWith('[')) {
          indent += 1;
        }
        return formatted;
      })
      .join('\n');
  } else if (language === 'css') {
    const lines = content.split('\n');
    let indent = 0;
    corrected = lines
      .map((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('}')) {
          indent = Math.max(0, indent - 1);
        }
        const formatted = '  '.repeat(indent) + trimmed;
        if (trimmed.endsWith('{')) {
          indent += 1;
        }
        return formatted;
      })
      .join('\n');
  } else if (language === 'html' || language === 'xml') {
    const lines = content.split('\n');
    let indent = 0;
    corrected = lines
      .map((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('</')) {
          indent = Math.max(0, indent - 1);
        }
        const formatted = '  '.repeat(indent) + trimmed;
        if (
          trimmed.startsWith('<') &&
          !trimmed.startsWith('</') &&
          !trimmed.endsWith('/>') &&
          !trimmed.includes('</')
        ) {
          indent += 1;
        }
        return formatted;
      })
      .join('\n');
  } else {
    corrected = content
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n');
  }
  return corrected;
}
