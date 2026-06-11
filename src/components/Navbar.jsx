import React, { useState, useEffect, useRef } from 'react';
import { FileCode2, ChevronRight, Download } from 'lucide-react';

export default function Navbar({
  fileName,
  recentFiles,
  onNew,
  onOpenLocal,
  onSaveLocal,
  onOpenRecent,
  onDeleteRecent,
  onToggleSearch,
  onAutoCorrect,
  theme,
  onSetTheme,
  fontFamilyLabel,
  onSetFont,
  fontSize,
  onSetFontSize,
  showMinimap,
  onToggleMinimap,
  showLineNumbers,
  onToggleLineNumbers,
  onShowWelcome,
  onShowAbout
}) {
  const [activeMenu, setActiveMenu] = useState(null);
  const navbarRef = useRef(null);

  const menus = ['File', 'Edit', 'View', 'Help'];
  const fonts = [
    { label: 'System Mono', family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace' },
    { label: 'Fira Code', family: '"Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace' },
    { label: 'JetBrains Mono', family: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace' },
    { label: 'IBM Plex Mono', family: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace' },
    { label: 'Cascadia Code', family: '"Cascadia Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace' }
  ];
  const fontSizes = [10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24];

  useEffect(() => {
    function handleClickOutside(event) {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleMenuClick(menu) {
    if (activeMenu === menu) {
      setActiveMenu(null);
    } else {
      setActiveMenu(menu);
    }
  }

  function handleMenuMouseEnter(menu) {
    if (activeMenu !== null) {
      setActiveMenu(menu);
    }
  }

  return (
    <div className="ms-navbar" ref={navbarRef}>
      <div className="ms-menus">
        <div className="ms-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '16px', fontWeight: 600 }}>
          <FileCode2 size={16} style={{ color: 'var(--accent)' }} />
          <span>MinEdit</span>
        </div>

        {menus.map((menu) => (
          <div key={menu} className="ms-menu-container">
            <button
              className={`ms-menu-trigger ${activeMenu === menu ? 'active' : ''}`}
              onClick={() => handleMenuClick(menu)}
              onMouseEnter={() => handleMenuMouseEnter(menu)}
            >
              {menu}
            </button>

            {activeMenu === menu && (
              <div className="ms-dropdown">
                {menu === 'File' && (
                  <>
                    <div className="ms-dropdown-item" onClick={() => { onNew(); setActiveMenu(null); }}>
                      <span>New File</span>
                      <span className="shortcut">Ctrl+N</span>
                    </div>
                    <div className="ms-dropdown-item" onClick={() => { onOpenLocal(); setActiveMenu(null); }}>
                      <span>Open File...</span>
                      <span className="shortcut">Ctrl+O</span>
                    </div>
                    <div className="ms-dropdown-item" onClick={() => { onSaveLocal(); setActiveMenu(null); }}>
                      <span>Save Copy</span>
                      <span className="shortcut">Ctrl+S</span>
                    </div>
                    <div className="ms-dropdown-divider" />
                    <div className="ms-dropdown-submenu">
                      <div className="ms-dropdown-item">
                        <span>Open Recent</span>
                        <ChevronRight size={12} />
                      </div>
                      <div className="ms-sub-dropdown">
                        {recentFiles.length === 0 ? (
                          <div className="ms-dropdown-item" style={{ opacity: 0.5, pointerEvents: 'none' }}>
                            No recent files
                          </div>
                        ) : (
                          recentFiles.map((file) => (
                            <div key={file.id} className="ms-dropdown-item" onClick={() => { onOpenRecent(file); setActiveMenu(null); }}>
                              <span>{file.name}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="ms-dropdown-submenu">
                      <div className="ms-dropdown-item">
                        <span>Delete Recent File</span>
                        <ChevronRight size={12} />
                      </div>
                      <div className="ms-sub-dropdown">
                        {recentFiles.length === 0 ? (
                          <div className="ms-dropdown-item" style={{ opacity: 0.5, pointerEvents: 'none' }}>
                            No recent files
                          </div>
                        ) : (
                          recentFiles.map((file) => (
                            <div
                              key={file.id}
                              className="ms-dropdown-item"
                              style={{ color: '#ef4444' }}
                              onClick={() => { onDeleteRecent(file.id); setActiveMenu(null); }}
                            >
                              <span>{file.name}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}

                {menu === 'Edit' && (
                  <>
                    <div className="ms-dropdown-item" onClick={() => { onToggleSearch(); setActiveMenu(null); }}>
                      <span>Search</span>
                      <span className="shortcut">Ctrl+F</span>
                    </div>
                    <div className="ms-dropdown-item" onClick={() => { onAutoCorrect(); setActiveMenu(null); }}>
                      <span>Auto Correct Code</span>
                    </div>
                  </>
                )}

                {menu === 'View' && (
                  <>
                    <div className="ms-dropdown-submenu">
                      <div className="ms-dropdown-item">
                        <span>Theme ({theme})</span>
                        <ChevronRight size={12} />
                      </div>
                      <div className="ms-sub-dropdown">
                        {['dark', 'light', 'ocean', 'sepia'].map((t) => (
                          <div
                            key={t}
                            className="ms-dropdown-item"
                            onClick={() => { onSetTheme(t); setActiveMenu(null); }}
                            style={{ fontWeight: theme === t ? 'bold' : 'normal' }}
                          >
                            <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="ms-dropdown-submenu">
                      <div className="ms-dropdown-item">
                        <span>Font ({fontFamilyLabel})</span>
                        <ChevronRight size={12} />
                      </div>
                      <div className="ms-sub-dropdown">
                        {fonts.map((f) => (
                          <div
                            key={f.label}
                            className="ms-dropdown-item"
                            onClick={() => { onSetFont(f.family, f.label); setActiveMenu(null); }}
                            style={{ fontWeight: fontFamilyLabel === f.label ? 'bold' : 'normal' }}
                          >
                            <span>{f.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="ms-dropdown-submenu">
                      <div className="ms-dropdown-item">
                        <span>Font Size ({fontSize}px)</span>
                        <ChevronRight size={12} />
                      </div>
                      <div className="ms-sub-dropdown">
                        {fontSizes.map((sz) => (
                          <div
                            key={sz}
                            className="ms-dropdown-item"
                            onClick={() => { onSetFontSize(sz); setActiveMenu(null); }}
                            style={{ fontWeight: fontSize === sz ? 'bold' : 'normal' }}
                          >
                            <span>{sz}px</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="ms-dropdown-divider" />
                    <div className="ms-dropdown-item" onClick={() => { onToggleMinimap(); setActiveMenu(null); }}>
                      <span>Minimap</span>
                      <span className="shortcut">{showMinimap ? 'Hide' : 'Show'}</span>
                    </div>
                    <div className="ms-dropdown-item" onClick={() => { onToggleLineNumbers(); setActiveMenu(null); }}>
                      <span>Line Numbers</span>
                      <span className="shortcut">{showLineNumbers ? 'Hide' : 'Show'}</span>
                    </div>
                  </>
                )}

                {menu === 'Help' && (
                  <>
                    <div className="ms-dropdown-item" onClick={() => { onShowWelcome(); setActiveMenu(null); }}>
                      <span>Welcome Guide</span>
                    </div>
                    <div className="ms-dropdown-item" onClick={() => { onShowAbout(); setActiveMenu(null); }}>
                      <span>About MinEdit</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="ms-title" style={{ opacity: 0.8, fontSize: '13px', fontWeight: 500 }}>
          {fileName || 'Untitled'}
        </div>
        <button
          onClick={onSaveLocal}
          title="Download File"
          style={{
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '12.5px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'background 0.2s'
          }}
          className="ms-download-btn"
        >
          <Download size={14} />
          <span className="download-text">Download</span>
        </button>
      </div>
    </div>
  );
}
