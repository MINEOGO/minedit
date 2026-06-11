import React, { useState, useEffect, useRef } from 'react';
import hljs from 'highlight.js';
import { Search, ChevronDown, ChevronUp, X } from 'lucide-react';

export default function Editor({
  content,
  onChange,
  language,
  theme,
  fontSize,
  fontFamily,
  showMinimap,
  showLineNumbers,
  isSearchOpen,
  onCloseSearch,
  onCursorChange
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIndex, setSearchIndex] = useState(0);
  const [searchMatches, setSearchMatches] = useState([]);
  const [caretBlink, setCaretBlink] = useState(true);

  const textareaRef = useRef(null);
  const backdropRef = useRef(null);
  const caretMirrorRef = useRef(null);
  const customCaretRef = useRef(null);
  const minimapRef = useRef(null);
  const minimapViewportRef = useRef(null);

  const lines = content.split('\n');

  useEffect(() => {
    updateCaret();
    updateMinimapScroll();
  }, [content, fontSize, fontFamily]);

  useEffect(() => {
    if (isSearchOpen) {
      setSearchQuery('');
      setSearchMatches([]);
      setSearchIndex(0);
    }
  }, [isSearchOpen]);

  const updateCaret = () => {
    if (!textareaRef.current || !caretMirrorRef.current || !customCaretRef.current) return;
    const area = textareaRef.current;
    const pos = area.selectionEnd;
    const textBefore = area.value.substring(0, pos);

    caretMirrorRef.current.textContent = textBefore;
    const span = document.createElement('span');
    span.textContent = '\u200b';
    caretMirrorRef.current.appendChild(span);

    const top = span.offsetTop;
    const left = span.offsetLeft;
    const tx = left - area.scrollLeft;
    const ty = top - area.scrollTop;

    customCaretRef.current.style.transform = `translate(${tx}px, ${ty}px)`;
    customCaretRef.current.style.height = `${fontSize}px`;

    if (area.selectionStart !== area.selectionEnd || document.activeElement !== area) {
      customCaretRef.current.style.display = 'none';
    } else {
      customCaretRef.current.style.display = 'block';
    }

    setCaretBlink(false);
    const timer = setTimeout(() => setCaretBlink(true), 50);

    const cursorText = area.value.substring(0, area.selectionStart);
    const cursorLines = cursorText.split('\n');
    const curLine = cursorLines.length;
    const curCol = cursorLines[cursorLines.length - 1].length + 1;
    onCursorChange(curLine, curCol);

    return () => clearTimeout(timer);
  };

  const handleScroll = () => {
    if (!textareaRef.current || !backdropRef.current) return;
    backdropRef.current.scrollTop = textareaRef.current.scrollTop;
    backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    updateCaret();
    updateMinimapScroll();
  };

  const updateMinimapScroll = () => {
    if (!textareaRef.current || !minimapViewportRef.current || !minimapRef.current || !showMinimap) return;
    const area = textareaRef.current;
    const ratio = minimapRef.current.offsetHeight / area.scrollHeight;
    const viewportHeight = area.clientHeight * ratio;
    const viewportTop = area.scrollTop * ratio;
    minimapViewportRef.current.style.height = `${viewportHeight}px`;
    minimapViewportRef.current.style.transform = `translateY(${viewportTop}px)`;
  };

  const handleMinimapClick = (e) => {
    if (!textareaRef.current || !minimapRef.current) return;
    const rect = minimapRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const ratio = textareaRef.current.scrollHeight / minimapRef.current.offsetHeight;
    textareaRef.current.scrollTop = clickY * ratio - textareaRef.current.clientHeight / 2;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newContent = content.substring(0, start) + '    ' + content.substring(end);
      onChange(newContent);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
          updateCaret();
        }
      }, 0);
    }
  };

  const runHighlight = () => {
    let text = content;
    if (text.endsWith('\n')) text += ' ';
    try {
      return hljs.highlight(text || ' ', { language: language || 'plaintext', ignoreIllegals: true }).value;
    } catch (e) {
      return text;
    }
  };

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q) {
      setSearchMatches([]);
      setSearchIndex(0);
      return;
    }
    const list = [];
    let idx = content.indexOf(q, 0);
    while (idx !== -1) {
      list.push(idx);
      idx = content.indexOf(q, idx + q.length);
    }
    setSearchMatches(list);
    setSearchIndex(0);
    if (list.length > 0) {
      focusMatch(0, list, q);
    }
  };

  const focusMatch = (index, list, qText) => {
    if (!list.length || !textareaRef.current) return;
    const matchStart = list[index];
    const matchEnd = matchStart + qText.length;
    const area = textareaRef.current;
    area.focus();
    area.selectionStart = matchStart;
    area.selectionEnd = matchEnd;
    const ratio = matchStart / Math.max(area.value.length, 1);
    area.scrollTop = area.scrollHeight * ratio - area.clientHeight / 2;
    updateCaret();
  };

  const handleNextMatch = () => {
    if (!searchMatches.length) return;
    const nextIdx = (searchIndex + 1) % searchMatches.length;
    setSearchIndex(nextIdx);
    focusMatch(nextIdx, searchMatches, searchQuery);
  };

  const handlePrevMatch = () => {
    if (!searchMatches.length) return;
    const prevIdx = (searchIndex - 1 + searchMatches.length) % searchMatches.length;
    setSearchIndex(prevIdx);
    focusMatch(prevIdx, searchMatches, searchQuery);
  };

  const fontStyle = {
    fontSize: `${fontSize}px`,
    lineHeight: `${fontSize * 1.6}px`,
    fontFamily: fontFamily
  };

  return (
    <div className="editor-container">
      {showLineNumbers && (
        <div className="gutter-area" style={{ ...fontStyle }}>
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
      )}

      <div className="editor-wrap-area">
        <pre className="code-backdrop" ref={backdropRef} style={{ ...fontStyle }}>
          <code dangerouslySetInnerHTML={{ __html: runHighlight() }} />
        </pre>

        <div className="caret-calc-mirror" ref={caretMirrorRef} style={{ ...fontStyle }} />

        <div
          ref={customCaretRef}
          className={`smooth-caret ${caretBlink ? 'blink' : ''}`}
        />

        <textarea
          ref={textareaRef}
          className="code-textarea"
          value={content}
          onChange={(e) => { onChange(e.target.value); updateCaret(); }}
          onScroll={handleScroll}
          onSelect={updateCaret}
          onKeyDown={handleKeyDown}
          onKeyUp={updateCaret}
          onMouseDown={updateCaret}
          onMouseUp={updateCaret}
          spellCheck="false"
          autoComplete="off"
          autoFocus
          style={{ ...fontStyle }}
        />

        {isSearchOpen && (
          <div className="inline-search-bar">
            <Search size={14} style={{ opacity: 0.5, marginRight: '4px' }} />
            <input
              type="text"
              className="inline-search-input"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchChange}
              autoFocus
            />
            <span className="inline-search-count">
              {searchMatches.length > 0 ? `${searchIndex + 1}/${searchMatches.length}` : '0 results'}
            </span>
            <button className="inline-search-btn" onClick={handlePrevMatch}>
              <ChevronUp size={14} />
            </button>
            <button className="inline-search-btn" onClick={handleNextMatch}>
              <ChevronDown size={14} />
            </button>
            <button className="inline-search-btn" onClick={onCloseSearch}>
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {showMinimap && (
        <div ref={minimapRef} className="sidebar-minimap" onClick={handleMinimapClick}>
          <div className="minimap-pre">
            {content}
          </div>
          <div ref={minimapViewportRef} className="minimap-slider-viewport" />
        </div>
      )}
    </div>
  );
}
