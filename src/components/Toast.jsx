import React, { useEffect } from 'react';

export default function Toast({
  visible,
  title,
  message,
  actions = [],
  onClose,
  duration = 0
}) {
  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  if (!visible) return null;

  return (
    <div className="toast-message">
      <div className="toast-head">{title}</div>
      <div className="toast-body">{message}</div>
      {actions.length > 0 && (
        <div className="toast-btns">
          {actions.map((act) => (
            <button
              key={act.label}
              className={`toast-action-btn ${act.secondary ? 'sec' : ''}`}
              onClick={act.onClick}
            >
              {act.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
