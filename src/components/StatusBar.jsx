import React from 'react';
import { LANGUAGES } from '../utils/languages';

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
  const sizeInBytes = content ? new Blob([content]).size : 0;

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

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
        <div className="ms-status-item status-select-container">
          <select
            className="status-select"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="ms-status-item" style={{ opacity: 0.4 }}>|</div>
        <div className="ms-status-item" style={{ fontWeight: 500 }}>
          dnezero & mineogo
        </div>
      </div>
    </div>
  );
}
