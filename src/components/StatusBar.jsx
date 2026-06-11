import React, { useState, useRef, useEffect } from 'react';
import { LANGUAGES } from '../utils/languages';
import { isRunnable } from '../utils/codeRunner';
import { Terminal, ChevronUp, ChevronDown, Search, FileCode } from 'lucide-react';

export default function StatusBar({
  line,
  col,
  charCount,
  lineCount,
  content,
  language,
  onLanguageChange,
  isDirty
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const sizeInBytes = content ? new Blob([content]).size : 0;

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }


  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);


  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredLanguages = LANGUAGES.filter(lang =>
    lang.toLowerCase().includes(search.toLowerCase())
  );


  useEffect(() => {
    setHighlightedIndex(0);
  }, [search]);

  function handleKeyDown(e) {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % filteredLanguages.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + filteredLanguages.length) % filteredLanguages.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredLanguages[highlightedIndex]) {
        onLanguageChange(filteredLanguages[highlightedIndex]);
        setIsOpen(false);
        setSearch('');
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
    }
  }

  const currentDisplayName = language.charAt(0).toUpperCase() + language.slice(1);
  const currentRunnable = isRunnable(language);

  return (
    <div className="ms-statusbar">
      <div className="ms-status-left">
        <div className="ms-status-item">
          Ln {line}, Col {col}
        </div>
        <div className="ms-status-item" style={{ opacity: 0.4 }}>|</div>
        <div className="ms-status-item">
          Chars: {charCount}
        </div>
        <div className="ms-status-item" style={{ opacity: 0.4 }}>|</div>
        <div className="ms-status-item">
          Lines: {lineCount}
        </div>
        <div className="ms-status-item" style={{ opacity: 0.4 }}>|</div>
        <div className="ms-status-item">
          Size: {formatBytes(sizeInBytes)}
        </div>
        <div className="ms-status-item" style={{ opacity: 0.4 }}>|</div>
        <div className="ms-status-item" style={{ color: isDirty ? 'var(--syn-keyword)' : 'var(--syn-string)', fontWeight: 500 }}>
          {isDirty ? 'Unsaved Changes' : 'Saved to browser'}
        </div>
      </div>

      <div className="ms-status-right">
        <div className="ms-status-item status-select-container" ref={dropdownRef} onKeyDown={handleKeyDown}>
          <button
            className={`lang-dropdown-btn ${isOpen ? 'active' : ''}`}
            onClick={() => setIsOpen(!isOpen)}
            title="Select Language"
          >
            {currentRunnable ? <Terminal style={{ color: 'var(--syn-string)' }} /> : <FileCode />}
            <span>{currentDisplayName}</span>
            {isOpen ? <ChevronUp /> : <ChevronDown />}
          </button>

          {isOpen && (
            <div className="lang-dropdown-menu">
              <div className="lang-dropdown-search-container">
                <Search />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="lang-dropdown-search-input"
                  placeholder="Search languages..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="lang-dropdown-list">
                {filteredLanguages.length === 0 ? (
                  <div style={{ padding: '8px 12px', opacity: 0.5, fontSize: '11px' }}>No matches</div>
                ) : (
                  filteredLanguages.map((lang, index) => {
                    const runnable = isRunnable(lang);
                    const displayName = lang.charAt(0).toUpperCase() + lang.slice(1);
                    const isSelected = lang === language;
                    const isHighlighted = index === highlightedIndex;

                    return (
                      <button
                        key={lang}
                        className={`lang-dropdown-list-item ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                        onClick={() => {
                          onLanguageChange(lang);
                          setIsOpen(false);
                          setSearch('');
                        }}
                      >
                        <div className="lang-dropdown-item-left">
                          {runnable ? <Terminal style={{ color: 'var(--syn-string)' }} /> : <FileCode />}
                          <span>{displayName}</span>
                        </div>
                        {runnable && (
                          <div className="lang-dropdown-item-runnable" title="Runnable fully in-browser">
                            <Terminal />
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
        <div className="ms-status-item" style={{ opacity: 0.4 }}>|</div>
        <div className="ms-status-item" style={{ fontWeight: 500 }}>
          dnezero & mineogo
        </div>
      </div>
    </div>
  );
}

