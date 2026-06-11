
export const RUNNABLE_LANGUAGES = [
  'javascript', 'typescript', 'python', 'lua', 'c', 'cpp'
];

export function isRunnable(language) {
  return RUNNABLE_LANGUAGES.includes(language);
}


export function parseErrorLine(errMessage, language) {
  if (!errMessage) return null;
  const str = String(errMessage);
  
  if (language === 'python') {

    const match = str.match(/File\s+"<exec>"\s*,\s*line\s+(\d+)/i);
    if (match) return parseInt(match[1], 10);
    const matchStr = str.match(/line\s+(\d+)/i);
    if (matchStr) return parseInt(matchStr[1], 10);
  }
  
  if (language === 'javascript' || language === 'typescript') {

    const match = str.match(/<anonymous>:(\d+):/i);
    if (match) return parseInt(match[1], 10);
    const matchLine = str.match(/line\s+(\d+)/i);
    if (matchLine) return parseInt(matchLine[1], 10);
  }
  
  if (language === 'lua') {

    const match = str.match(/\]:(\d+):/);
    if (match) return parseInt(match[1], 10);
  }
  
  if (language === 'c' || language === 'cpp') {

    const match = str.match(/line\s+(\d+)/i);
    if (match) return parseInt(match[1], 10);
  }
  
  return null;
}


function runJavaScript(code, onLog) {
  return new Promise((resolve) => {
    const logs = [];
    const fakeConsole = {};
    ['log', 'warn', 'error', 'info', 'debug', 'clear'].forEach((method) => {
      fakeConsole[method] = (...args) => {
        const text = args.map(a => {
          if (a === null) return 'null';
          if (a === undefined) return 'undefined';
          if (typeof a === 'object') {
            try { return JSON.stringify(a, null, 2); } catch { return String(a); }
          }
          return String(a);
        }).join(' ');
        const type = method === 'warn' ? 'warn' : method === 'error' ? 'error' : method === 'info' ? 'info' : 'log';
        logs.push({ type, text });
        onLog({ type, text });
      };
    });

    try {

      const wrapped = `
        "use strict";
        const console = __console__;
        const setTimeout = undefined;
        const setInterval = undefined;
        const fetch = undefined;
        const XMLHttpRequest = undefined;
        ${code}
      `;
      const fn = new Function('__console__', wrapped);
      const result = fn(fakeConsole);
      if (result !== undefined) {
        onLog({ type: 'log', text: `← ${typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}` });
      }
      resolve({ success: true, logs });
    } catch (err) {
      const errMsg = `${err.name}: ${err.message}`;
      const line = parseErrorLine(err.stack || err.message, 'javascript');
      onLog({ type: 'error', text: errMsg, line });
      resolve({ success: false, logs, error: errMsg, line });
    }
  });
}


function stripTypeAnnotations(code) {

  return code
    .replace(/:\s*[A-Za-z_$][\w$<>\[\]|&,\s]*(?=[,\)\=\{;\n])/g, '')
    .replace(/^(export\s+)?(interface|type)\s+[\s\S]*?(\{[\s\S]*?\}|;)/gm, '')
    .replace(/<[A-Za-z_$][\w$,\s]*>/g, '')
    .replace(/as\s+\w+/g, '');
}


let pyodideInstance = null;
let pyodideLoading = false;
let pyodideQueue = [];

async function loadPyodide(onLog) {
  if (pyodideInstance) return pyodideInstance;

  if (pyodideLoading) {
    return new Promise((resolve) => {
      pyodideQueue.push(resolve);
    });
  }

  pyodideLoading = true;
  onLog({ type: 'system', text: '[wasm] Fetching Python runtime (Pyodide)...' });


  if (!window.loadPyodide) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load Pyodide'));
      document.head.appendChild(script);
    });
    onLog({ type: 'system', text: '[wasm] Pyodide script loaded' });
  }

  onLog({ type: 'system', text: '[wasm] Initializing Python interpreter...' });
  pyodideInstance = await window.loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/',
  });

  onLog({ type: 'system', text: '[wasm] Python WASM module compiled' });
  onLog({ type: 'system', text: '[wasm] Standard library loaded' });

  pyodideLoading = false;
  pyodideQueue.forEach((cb) => cb(pyodideInstance));
  pyodideQueue = [];

  return pyodideInstance;
}

async function runPython(code, onLog) {
  try {
    const pyodide = await loadPyodide(onLog);


    const packagesToInstall = [];
    const standardLibs = ['sys', 'os', 'math', 'json', 'datetime', 're', 'io', 'time', 'random', 'urllib', 'hashlib', 'collections', 'itertools', 'functools'];
    const lines = code.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
        const parts = trimmed.split(/\s+/);
        if (parts[0] === 'import') {
          const pkgs = parts.slice(1).join('').split(',');
          pkgs.forEach(p => {
            const clean = p.split('as')[0].trim().split('.')[0];
            if (clean && !standardLibs.includes(clean) && !packagesToInstall.includes(clean)) {
              packagesToInstall.push(clean);
            }
          });
        } else if (parts[0] === 'from') {
          const clean = parts[1].trim().split('.')[0];
          if (clean && !standardLibs.includes(clean) && !packagesToInstall.includes(clean)) {
            packagesToInstall.push(clean);
          }
        }
      }
    });

    if (packagesToInstall.length > 0) {
      onLog({ type: 'system', text: `[pip] Checking packages: ${packagesToInstall.join(', ')}` });
      onLog({ type: 'system', text: '[pip] Setting up micropip installer...' });
      await pyodide.loadPackage('micropip');
      const micropip = pyodide.pyimport('micropip');
      for (const pkg of packagesToInstall) {
        onLog({ type: 'system', text: `[pip] Installing package "${pkg}" in-browser...` });
        try {
          await micropip.install(pkg);
          onLog({ type: 'system', text: `[pip] Package "${pkg}" successfully installed.` });
        } catch (pipErr) {
          onLog({ type: 'warn', text: `[pip] Failed to install "${pkg}": ${pipErr.message || String(pipErr)}` });
        }
      }
    }


    pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
`);

    onLog({ type: 'system', text: '[runtime] Executing Python code...' });

    try {
      pyodide.runPython(code);
    } catch (pyErr) {

      const partialOut = pyodide.runPython('sys.stdout.getvalue()');
      if (partialOut) {
        partialOut.split('\n').filter(Boolean).forEach(line => {
          onLog({ type: 'log', text: line });
        });
      }
      const errMsg = String(pyErr.message || pyErr);
      const line = parseErrorLine(errMsg, 'python');
      onLog({ type: 'error', text: errMsg, line });
      return { success: false, error: errMsg, line };
    }

    const stdout = pyodide.runPython('sys.stdout.getvalue()');
    const stderr = pyodide.runPython('sys.stderr.getvalue()');

    if (stdout) {
      stdout.split('\n').filter(Boolean).forEach(line => {
        onLog({ type: 'log', text: line });
      });
    }
    if (stderr) {
      stderr.split('\n').filter(Boolean).forEach(line => {
        onLog({ type: 'warn', text: line });
      });
    }

    return { success: true };
  } catch (err) {
    const errMsg = err.message || String(err);
    const line = parseErrorLine(errMsg, 'python');
    onLog({ type: 'error', text: `Python Runtime Error: ${errMsg}`, line });
    return { success: false, error: errMsg, line };
  }
}


let fengariLoaded = false;

async function loadFengari(onLog) {
  if (fengariLoaded && window.fengari) return;
  onLog({ type: 'system', text: '[wasm] Fetching Lua runtime (Fengari)...' });
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/fengari-web@0.1.4/dist/fengari-web.js';
    script.onload = () => { fengariLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load Fengari'));
    document.head.appendChild(script);
  });
  onLog({ type: 'system', text: '[wasm] Fengari Lua engine loaded' });
}

async function runLua(code, onLog) {
  try {
    await loadFengari(onLog);
    onLog({ type: 'system', text: '[runtime] Executing Lua code...' });

    const { lua, lauxlib, lualib, to_luastring } = window.fengari;
    const L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(L);


    const captured = [];
    const printFn = function(L) {
      const n = lua.lua_gettop(L);
      const parts = [];
      for (let i = 1; i <= n; i++) {
        parts.push(lauxlib.luaL_tolstring(L, i));
        lua.lua_pop(L, 1);
      }
      const text = parts.join('\t');
      captured.push(text);
      onLog({ type: 'log', text });
      return 0;
    };
    lua.lua_pushcfunction(L, printFn);
    lua.lua_setglobal(L, to_luastring("print"));

    const status = lauxlib.luaL_dostring(L, to_luastring(code));
    if (status !== 0) {
      const errMsg = lua.lua_tojsstring(L, -1);
      const line = parseErrorLine(errMsg, 'lua');
      onLog({ type: 'error', text: errMsg, line });
      return { success: false, error: errMsg, line };
    }
    return { success: true };
  } catch (err) {
    const errMsg = err.message || String(err);
    const line = parseErrorLine(errMsg, 'lua');
    onLog({ type: 'error', text: `Lua Runtime Error: ${errMsg}`, line });
    return { success: false, error: errMsg, line };
  }
}


let jscppLoaded = false;
async function loadJSCPP(onLog) {
  if (jscppLoaded && window.JSCPP) return;
  onLog({ type: 'system', text: '[wasm] Loading C/C++ compiler engine (JSCPP)...' });
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/JSCPP@0.4.1/dist/JSCPP.es5.min.js';
    script.onload = () => { jscppLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load JSCPP'));
    document.head.appendChild(script);
  });
  onLog({ type: 'system', text: '[wasm] C++ environment loaded successfully' });
}

async function runCPP(code, onLog) {
  try {
    await loadJSCPP(onLog);
    onLog({ type: 'system', text: '[runtime] Running C/C++ program...' });
    

    const config = {
      stdio: {
        write: (str) => {
          onLog({ type: 'log', text: str.replace(/\n$/, '') });
        }
      }
    };
    
    window.JSCPP.run(code, '', config);
    return { success: true };
  } catch (err) {
    const errMsg = err.message || String(err);
    const line = parseErrorLine(errMsg, 'cpp');
    onLog({ type: 'error', text: `C/C++ Execution Error: ${errMsg}`, line });
    return { success: false, error: errMsg, line };
  }
}


export async function executeCode(code, language, onLog) {
  switch (language) {
    case 'javascript':
      return runJavaScript(code, onLog);
    case 'typescript':
      return runJavaScript(stripTypeAnnotations(code), onLog);
    case 'python':
      return runPython(code, onLog);
    case 'lua':
      return runLua(code, onLog);
    case 'c':
    case 'cpp':
      return runCPP(code, onLog);
    default:
      onLog({ type: 'error', text: `Language "${language}" is not supported for in-browser execution.` });
      return { success: false };
  }
}
