import React from 'react';
import { Delete, Check } from 'lucide-react';

interface OnScreenKeyboardProps {
  value: string;
  onChange: (val: string) => void;
  onDone?: () => void;
}

const ROW_1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
const ROW_2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
const ROW_3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];

export const OnScreenKeyboard: React.FC<OnScreenKeyboardProps> = ({ value, onChange, onDone }) => {
  const handleKeyPress = (char: string) => {
    onChange(value + char);
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const handleSpace = () => {
    onChange(value + ' ');
  };

  return (
    <div className="touch-keyboard-container slide-up">
      <div className="keyboard-row">
        {ROW_1.map((key) => (
          <button
            key={key}
            type="button"
            className="key-btn"
            onClick={() => handleKeyPress(key)}
          >
            {key}
          </button>
        ))}
      </div>

      <div className="keyboard-row">
        {ROW_2.map((key) => (
          <button
            key={key}
            type="button"
            className="key-btn"
            onClick={() => handleKeyPress(key)}
          >
            {key}
          </button>
        ))}
      </div>

      <div className="keyboard-row">
        {ROW_3.map((key) => (
          <button
            key={key}
            type="button"
            className="key-btn"
            onClick={() => handleKeyPress(key)}
          >
            {key}
          </button>
        ))}
        <button
          type="button"
          className="key-btn key-backspace"
          onClick={handleBackspace}
          aria-label="Backspace"
        >
          <Delete size={18} />
        </button>
      </div>

      <div className="keyboard-row" style={{ marginTop: '4px' }}>
        <button
          type="button"
          className="key-btn key-space"
          onClick={handleSpace}
        >
          SPACE
        </button>
        {onDone && (
          <button
            type="button"
            className="key-btn"
            style={{ minWidth: '70px', background: '#09090B', color: 'white' }}
            onClick={onDone}
          >
            <Check size={18} style={{ marginRight: '4px' }} /> Done
          </button>
        )}
      </div>
    </div>
  );
};
