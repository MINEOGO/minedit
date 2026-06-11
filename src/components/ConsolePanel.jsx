import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Play, X, Trash2, ChevronUp, ChevronDown, Terminal, Square, GripHorizontal } from 'lucide-react';
import { isRunnable, executeCode } from '../utils/codeRunner';

const ConsolePanel = forwardRef(function ConsolePanel({
  language,
  content,
  isOpen,
  onToggle,
  onClose,
}, ref) {
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [panelHeight, setPanelHeight] = useState(220);
  const [isBooting, setIsBooting] = useState(false);
  const [exitCode, setExitCode] = useState(null);
  const [runTime, setRunTime] = useState(null);

  const scrollRef = useRef(null);
  const dragRef = useRef(null);
  const startYRef = useRef(0);
  const startHRef = useRef(0);

  const canRun = isRunnable(language);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = useCallback((entry) => {
    setLogs((prev) => [...prev, { ...entry, ts: Date.now() }]);
  }, []);

  const handleClear = () => {
    setLogs([]);
    setExitCode(null);
    setRunTime(null);
  };

  const handleRun = async () => {
    if (isRunning || !canRun) return;
    setIsRunning(true);
    setIsBooting(true);
    setExitCode(null);
    setRunTime(null);
    setLogs([]);

    if (!isOpen) onToggle();


    const bootMsgs = [
      { text: 'Setting up IDE...', delay: 300 },
      { text: 'Connecting to runtime...', delay: 600 },
      { text: 'Connected.', delay: 400 },
      { text: `Initializing ${language} environment...`, delay: 500 },
    ];

    for (const msg of bootMsgs) {
      addLog({ type: 'system', text: msg.text });
      await new Promise((r) => setTimeout(r, msg.delay));
    }


    const startTime = performance.now();
    const result = await executeCode(content, language, (entry) => {

      if (entry.type === 'system') {
        addLog(entry);
      }
    });


    setIsBooting(false);
    setLogs([]);
    await new Promise((r) => setTimeout(r, 150));

    addLog({ type: 'system', text: `▶ Running ${language} code...` });
    addLog({ type: 'system', text: '─'.repeat(40) });


    const execStart = performance.now();
    const finalResult = await executeCode(content, language, addLog);
    const elapsed = performance.now() - startTime;

    addLog({ type: 'system', text: '─'.repeat(40) });
    if (finalResult.success) {
      addLog({ type: 'success', text: `✓ Process exited with code 0 (${(elapsed).toFixed(0)}ms)` });
      setExitCode(0);
    } else {
      addLog({ type: 'error-summary', text: `✗ Process exited with code 1 (${(elapsed).toFixed(0)}ms)`, line: finalResult.line });
      setExitCode(1);
    }
    setRunTime(elapsed);
    setIsRunning(false);
  };

  useImperativeHandle(ref, () => ({
    runCode: handleRun
  }));


  const handleDragStart = (e) => {
    e.preventDefault();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startYRef.current = clientY;
    startHRef.current = panelHeight;

    const handleDragMove = (ev) => {
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const diff = startYRef.current - cy;
      const newH = Math.max(100, Math.min(window.innerHeight * 0.7, startHRef.current + diff));
      setPanelHeight(newH);
    };

    const handleDragEnd = () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove, { passive: false });
    window.addEventListener('touchend', handleDragEnd);
  };

  if (!canRun) return null;

  return (
    <>
      {}
      {!isOpen && (
        <button
          className="run-code-btn"
          onClick={handleRun}
          disabled={isRunning}
          title="Run Code (in-browser)"
        >
          <Play size={13} />
          <span>Run</span>
        </button>
      )}

      {}
      {isOpen && (
        <div className="console-panel" style={{ height: panelHeight }}>
          {}
          <div
            className="console-drag-handle"
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            <div className="console-drag-grip" />
          </div>

          {}
          <div className="console-header">
            <div className="console-tabs">
              <div className="console-tab active">
                <Terminal size={13} />
                <span>Console</span>
                {exitCode !== null && (
                  <span className={`console-exit-badge ${exitCode === 0 ? 'success' : 'fail'}`}>
                    {exitCode}
                  </span>
                )}
              </div>
            </div>
            <div className="console-actions">
              <button
                className="console-action-btn run-action"
                onClick={handleRun}
                disabled={isRunning}
                title="Run"
              >
                {isRunning ? <Square size={13} /> : <Play size={13} />}
              </button>
              <button className="console-action-btn" onClick={handleClear} title="Clear Console">
                <Trash2 size={13} />
              </button>
              <button className="console-action-btn" onClick={onClose} title="Close Panel">
                <X size={13} />
              </button>
            </div>
          </div>

          {}
          <div className="console-output" ref={scrollRef}>
            {logs.length === 0 && !isRunning && (
              <div className="console-placeholder">
                <Terminal size={20} style={{ opacity: 0.3 }} />
                <span>Press ▶ Run to execute your {language} code</span>
              </div>
            )}
            {logs.map((log, i) => (
              <div key={i} className={`console-log-line ${log.type}`}>
                <span className="console-log-prefix">
                  {log.type === 'error' || log.type === 'error-summary' ? '✗' :
                   log.type === 'warn' ? '⚠' :
                   log.type === 'system' ? '›' :
                   log.type === 'success' ? '✓' :
                   log.type === 'info' ? 'ℹ' : '›'}
                </span>
                <span className="console-log-text">
                  {log.text}
                  {log.line && (
                    <button
                      className="console-error-line-link"
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('minedit-jump-to-line', { detail: { line: log.line } }));
                      }}
                      title={`Jump to line ${log.line} in code`}
                    >
                      Line {log.line}
                    </button>
                  )}
                </span>
              </div>
            ))}
            {isRunning && (
              <div className="console-log-line system">
                <span className="console-log-prefix">›</span>
                <span className="console-cursor-blink">█</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
});

export default ConsolePanel;
