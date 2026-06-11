import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { LANGUAGES } from '../utils/languages';

export default function CommandPalette({
  isOpen,
  onClose,
  onNew,
  onOpenLocal,
  onSaveLocal,
  onAutoCorrect,
  onToggleMinimap,
  onToggleLineNumbers,
  onSetTheme,
  onSetFont,
  onSetFontSize,
  onShowWelcome,
  onShowAbout
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentMenu, setCurrentMenu] = useState('root');
  const inputRef = useRef(null);

  const fonts = [
    { label: 'System Mono', family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace' },
    { label: 'Fira Code', family: '"Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace' },
    { label: 'JetBrains Mono', family: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace' },
    { label: 'IBM Plex Mono', family: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace' },
    { label: 'Cascadia Code', family: '"Cascadia Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace' }
  ];
  const fontSizes = [10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24];

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setCurrentMenu('root');
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getMenuItems = () => {
    switch (currentMenu) {
      case 'root':
        return [
          { label: 'New File', key: 'Ctrl+N', action: () => { onNew(); onClose(); } },
          { label: 'Open File...', key: 'Ctrl+O', action: () => { onOpenLocal(); onClose(); } },
          { label: 'Save Copy', key: 'Ctrl+S', action: () => { onSaveLocal(); onClose(); } },
          { label: 'Auto Correct Code', action: () => { onAutoCorrect(); onClose(); } },
          { label: 'Toggle Minimap', action: () => { onToggleMinimap(); onClose(); } },
          { label: 'Toggle Line Numbers', action: () => { onToggleLineNumbers(); onClose(); } },
          { label: 'Set Theme...', action: () => { setCurrentMenu('theme'); setQuery(''); setSelectedIndex(0); } },
          { label: 'Set Font...', action: () => { setCurrentMenu('font'); setQuery(''); setSelectedIndex(0); } },
          { label: 'Font Size...', action: () => { setCurrentMenu('fontsize'); setQuery(''); setSelectedIndex(0); } },
          { label: 'Set Language...', action: () => { setCurrentMenu('language'); setQuery(''); setSelectedIndex(0); } },
          { label: 'Welcome Guide', action: () => { onShowWelcome(); onClose(); } },
          { label: 'About MinEdit', action: () => { onShowAbout(); onClose(); } }
        ];
      case 'theme':
        return ['dark', 'light', 'ocean', 'sepia'].map(t => ({
          label: t.charAt(0).toUpperCase() + t.slice(1),
          action: () => { onSetTheme(t); onClose(); }
        }));
      case 'font':
        return fonts.map(f => ({
          label: f.label,
          action: () => { onSetFont(f.family, f.label); onClose(); }
        }));
      case 'fontsize':
        return fontSizes.map(sz => ({
          label: `${sz}px`,
          action: () => { onSetFontSize(sz); onClose(); }
        }));
      case 'language':
        return LANGUAGES.map(l => ({
          label: l.charAt(0).toUpperCase() + l.slice(1),
          action: () => { onSetTheme(l); onClose(); }
        }));
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();
  const filteredItems = menuItems.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (currentMenu !== 'root') {
        setCurrentMenu('root');
        setQuery('');
        setSelectedIndex(0);
      } else {
        onClose();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (filteredItems.length ? (prev + 1) % filteredItems.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (filteredItems.length ? (prev - 1 + filteredItems.length) % filteredItems.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems.length && filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    }
  };

  return (
    <div className="overlay-modal">
      <div className="overlay-backdrop" onClick={onClose} />
      <div className="palette-box" onKeyDown={handleKeyDown}>
        <div className="palette-input-wrap">
          <Search size={16} className="palette-icon" />
          <input
            ref={inputRef}
            type="text"
            className="palette-input"
            placeholder={
              currentMenu === 'root'
                ? "Type a command..."
                : `Select ${currentMenu}... (Esc to go back)`
            }
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
          />
        </div>

        <div className="palette-items">
          {currentMenu !== 'root' && (
            <div
              className="palette-item"
              onClick={() => { setCurrentMenu('root'); setQuery(''); setSelectedIndex(0); }}
            >
              <div className="palette-item-text">
                <span className="palette-item-title" style={{ opacity: 0.5 }}>← Back to main menu</span>
              </div>
            </div>
          )}

          {filteredItems.map((item, i) => (
            <div
              key={item.label}
              className={`palette-item ${selectedIndex === i ? 'selected' : ''}`}
              onClick={item.action}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <div className="palette-item-text">
                <span className="palette-item-title">{item.label}</span>
                {item.desc && <span className="palette-item-desc">{item.desc}</span>}
              </div>
              {item.key && <span className="palette-item-key">{item.key}</span>}
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="palette-empty">No commands found</div>
          )}
        </div>
      </div>
    </div>
  );
}
