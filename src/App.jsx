import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Editor from './components/Editor';
import StatusBar from './components/StatusBar';
import CommandPalette from './components/CommandPalette';
import Toast from './components/Toast';
import { saveFileToDB, getAllFilesFromDB, deleteFileFromDB } from './utils/db';
import { detectLanguage, autoCorrectCode } from './utils/languages';

export default function App() {
  const [content, setContent] = useState('');
  const [fileId, setFileId] = useState(null);
  const [fileName, setFileName] = useState('');
  const [language, setLanguage] = useState('plaintext');
  const [isDirty, setIsDirty] = useState(false);
  const [recentFiles, setRecentFiles] = useState([]);

  const [theme, setTheme] = useState(() => localStorage.getItem('minedit_theme') || 'dark');
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('minedit_font') || 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace');
  const [fontFamilyLabel, setFontFamilyLabel] = useState(() => localStorage.getItem('minedit_font_label') || 'System Mono');
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('minedit_font_size'), 10) || 13);
  const [showMinimap, setShowMinimap] = useState(() => localStorage.getItem('minedit_minimap') === 'true');
  const [showLineNumbers, setShowLineNumbers] = useState(() => localStorage.getItem('minedit_show_line_numbers') !== 'false');

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);

  const [toast, setToast] = useState({ visible: false, title: '', message: '', actions: [] });

  const fileInputRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    loadRecentFiles();
    getAllFilesFromDB()
      .then((files) => {
        if (files && files.length > 0) {
          const lastFile = files[0];
          setContent(lastFile.content);
          setFileId(lastFile.id);
          setFileName(lastFile.name);
          setLanguage(lastFile.language);
          setIsDirty(false);
        }
      })
      .catch(() => {});
    const hideWelcome = localStorage.getItem('minedit_hide_welcome') === 'true';
    if (!hideWelcome) {
      setTimeout(() => {
        setToast({
          visible: true,
          title: 'Welcome to MinEdit',
          message: 'Made by dnezero & mineogo. Access the command menu by pressing Escape or using the navbar.',
          actions: [
            {
              label: 'OK',
              onClick: () => setToast({ visible: false })
            },
            {
              label: "Don't show again",
              secondary: true,
              onClick: () => {
                localStorage.setItem('minedit_hide_welcome', 'true');
                setToast({ visible: false });
              }
            }
          ]
        });
      }, 800);
    }
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewFile();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleTriggerOpenLocal();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveLocal();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [content, fileId, fileName, language, isDirty]);

  const loadRecentFiles = () => {
    getAllFilesFromDB()
      .then(files => setRecentFiles(files))
      .catch(() => {});
  };

  const handleNewFile = () => {
    if (isDirty && !window.confirm('Discard unsaved changes?')) return;
    setContent('');
    setFileId(null);
    setFileName('');
    setLanguage('plaintext');
    setIsDirty(false);
  };

  const handleTriggerOpenLocal = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleOpenLocal = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result || '';
      const lang = detectLanguage(file.name);
      const newId = Date.now().toString();
      setContent(text);
      setFileId(newId);
      setFileName(file.name);
      setLanguage(lang);
      setIsDirty(false);
      saveFileToDB(newId, file.name, text, lang).then(() => loadRecentFiles());
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveLocal = () => {
    let name = fileName || window.prompt('Save as:', 'file.txt');
    if (!name) return;
    setFileName(name);
    const lang = detectLanguage(name);
    setLanguage(lang);

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);

    let currentId = fileId || Date.now().toString();
    setFileId(currentId);
    saveFileToDB(currentId, name, content, lang).then(() => {
      setIsDirty(false);
      loadRecentFiles();
    });
  };

  const handleOpenRecent = (file) => {
    if (isDirty && !window.confirm('Discard unsaved changes?')) return;
    setContent(file.content);
    setFileId(file.id);
    setFileName(file.name);
    setLanguage(file.language);
    setIsDirty(false);
  };

  const handleDeleteRecent = (id) => {
    deleteFileFromDB(id).then(() => {
      loadRecentFiles();
      if (fileId === id) {
        setFileId(null);
        setIsDirty(true);
      }
    });
  };

  const handleContentChange = (newContent) => {
    setContent(newContent);
    setIsDirty(true);

    let currentId = fileId;
    let currentName = fileName;
    if (!currentId) {
      currentId = Date.now().toString();
      currentName = 'Untitled.txt';
      setFileId(currentId);
      setFileName(currentName);
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveFileToDB(currentId, currentName, newContent, language)
        .then(() => {
          setIsDirty(false);
          loadRecentFiles();
        });
    }, 300);
  };

  const handleAutoCorrect = () => {
    const corrected = autoCorrectCode(content, language);
    setContent(corrected);
    handleContentChange(corrected);
    setToast({
      visible: true,
      title: 'Auto Corrected',
      message: 'Basic code structure and trailing whitespaces corrected.',
      actions: [{ label: 'Dismiss', onClick: () => setToast({ visible: false }) }]
    });
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    if (fileId) {
      saveFileToDB(fileId, fileName || 'Untitled.txt', content, lang).then(() => loadRecentFiles());
    }
  };

  const handleSetTheme = (t) => {
    setTheme(t);
    localStorage.setItem('minedit_theme', t);
  };

  const handleSetFont = (family, label) => {
    setFontFamily(family);
    setFontFamilyLabel(label);
    localStorage.setItem('minedit_font', family);
    localStorage.setItem('minedit_font_label', label);
  };

  const handleSetFontSize = (sz) => {
    setFontSize(sz);
    localStorage.setItem('minedit_font_size', sz);
  };

  const handleToggleMinimap = () => {
    setShowMinimap(prev => {
      const next = !prev;
      localStorage.setItem('minedit_minimap', next);
      return next;
    });
  };

  const handleToggleLineNumbers = () => {
    setShowLineNumbers(prev => {
      const next = !prev;
      localStorage.setItem('minedit_show_line_numbers', next);
      return next;
    });
  };

  const handleShowWelcome = () => {
    setToast({
      visible: true,
      title: 'Welcome to MinEdit',
      message: 'Made by dnezero & mineogo. Access the command menu by pressing Escape or using the navbar.',
      actions: [{ label: 'Dismiss', onClick: () => setToast({ visible: false }) }]
    });
  };

  const handleShowAbout = () => {
    setToast({
      visible: true,
      title: 'About MinEdit',
      message: 'MinEdit is a minimalist text editor built for high focus. Credits: dnezero & mineogo.',
      actions: [{ label: 'Dismiss', onClick: () => setToast({ visible: false }) }]
    });
  };

  return (
    <>
      <Navbar
        fileName={fileName}
        recentFiles={recentFiles}
        onNew={handleNewFile}
        onOpenLocal={handleTriggerOpenLocal}
        onSaveLocal={handleSaveLocal}
        onOpenRecent={handleOpenRecent}
        onDeleteRecent={handleDeleteRecent}
        onToggleSearch={() => setIsSearchOpen(true)}
        onAutoCorrect={handleAutoCorrect}
        theme={theme}
        onSetTheme={handleSetTheme}
        fontFamilyLabel={fontFamilyLabel}
        onSetFont={handleSetFont}
        fontSize={fontSize}
        onSetFontSize={handleSetFontSize}
        showMinimap={showMinimap}
        onToggleMinimap={handleToggleMinimap}
        showLineNumbers={showLineNumbers}
        onToggleLineNumbers={handleToggleLineNumbers}
        onShowWelcome={handleShowWelcome}
        onShowAbout={handleShowAbout}
      />

      <Editor
        content={content}
        onChange={handleContentChange}
        language={language}
        theme={theme}
        fontSize={fontSize}
        fontFamily={fontFamily}
        showMinimap={showMinimap}
        showLineNumbers={showLineNumbers}
        isSearchOpen={isSearchOpen}
        onCloseSearch={() => setIsSearchOpen(false)}
        onCursorChange={(ln, col) => { setCursorLine(ln); setCursorCol(col); }}
      />

      <StatusBar
        line={cursorLine}
        col={cursorCol}
        charCount={content.length}
        lineCount={content.split('\n').length}
        content={content}
        language={language}
        onLanguageChange={handleLanguageChange}
        isDirty={isDirty}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNew={handleNewFile}
        onOpenLocal={handleTriggerOpenLocal}
        onSaveLocal={handleSaveLocal}
        onAutoCorrect={handleAutoCorrect}
        onToggleMinimap={handleToggleMinimap}
        onToggleLineNumbers={handleToggleLineNumbers}
        onSetTheme={handleSetTheme}
        onSetFont={handleSetFont}
        onSetFontSize={handleSetFontSize}
        onShowWelcome={handleShowWelcome}
        onShowAbout={handleShowAbout}
      />

      <Toast
        visible={toast.visible}
        title={toast.title}
        message={toast.message}
        actions={toast.actions}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))}
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleOpenLocal}
        style={{ display: 'none' }}
      />
    </>
  );
}
