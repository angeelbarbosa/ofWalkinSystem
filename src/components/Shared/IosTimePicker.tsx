import React, { useRef, useEffect, useCallback } from 'react';

interface IosTimePickerProps {
  value: string; // e.g. "12:25 PM"
  onChange: (timeStr: string) => void;
}

const HOURS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
const PERIODS = ['AM', 'PM'];

const ITEM_HEIGHT = 44; // height in px of each row in the wheel
const VISIBLE_ROWS = 5;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS; // 220px

export function getCurrentFormattedTime(): string {
  const now = new Date();
  let h = now.getHours();
  const p = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const m = now.getMinutes().toString().padStart(2, '0');
  return `${h}:${m} ${p}`;
}

export const IosTimePicker: React.FC<IosTimePickerProps> = ({ value, onChange }) => {
  const parseTime = useCallback(() => {
    if (value) {
      const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (match) {
        return {
          hour: match[1],
          minute: match[2],
          period: match[3].toUpperCase()
        };
      }
    }
    const now = new Date();
    let h = now.getHours();
    const p = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const m = now.getMinutes().toString().padStart(2, '0');
    return { hour: h.toString(), minute: m, period: p };
  }, [value]);

  const parsed = parseTime();
  const currentHour = parsed.hour;
  const currentMinute = parsed.minute;
  const currentPeriod = parsed.period;

  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll wheels to current position
  const scrollToCurrent = useCallback((smooth = false) => {
    const behavior = smooth ? 'smooth' : 'auto';
    const hIndex = HOURS.indexOf(currentHour);
    const mIndex = MINUTES.indexOf(currentMinute);
    const pIndex = PERIODS.indexOf(currentPeriod);

    if (hIndex !== -1 && hourRef.current) {
      hourRef.current.scrollTo({ top: hIndex * ITEM_HEIGHT, behavior });
    }
    if (mIndex !== -1 && minuteRef.current) {
      minuteRef.current.scrollTo({ top: mIndex * ITEM_HEIGHT, behavior });
    }
    if (pIndex !== -1 && periodRef.current) {
      periodRef.current.scrollTo({ top: pIndex * ITEM_HEIGHT, behavior });
    }
  }, [currentHour, currentMinute, currentPeriod]);

  // Initial scroll into view on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToCurrent(false);
    }, 20);
    return () => clearTimeout(timer);
  }, []);

  const handleScrollWheel = (
    ref: React.RefObject<HTMLDivElement | null>,
    list: string[],
    type: 'hour' | 'minute' | 'period'
  ) => {
    if (!ref.current) return;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

    scrollTimeoutRef.current = setTimeout(() => {
      if (!ref.current) return;
      const scrollTop = ref.current.scrollTop;
      const index = Math.round(scrollTop / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, list.length - 1));
      const selectedVal = list[clampedIndex];

      let newH = currentHour;
      let newM = currentMinute;
      let newP = currentPeriod;

      if (type === 'hour') newH = selectedVal;
      if (type === 'minute') newM = selectedVal;
      if (type === 'period') newP = selectedVal;

      const newTimeStr = `${newH}:${newM} ${newP}`;
      if (newTimeStr !== value) {
        onChange(newTimeStr);
      }
    }, 60);
  };

  const handleSelectExact = (h: string, m: string, p: string) => {
    const newTimeStr = `${h}:${m} ${p}`;
    onChange(newTimeStr);

    const hIndex = HOURS.indexOf(h);
    const mIndex = MINUTES.indexOf(m);
    const pIndex = PERIODS.indexOf(p);

    if (hIndex !== -1 && hourRef.current) {
      hourRef.current.scrollTo({ top: hIndex * ITEM_HEIGHT, behavior: 'smooth' });
    }
    if (mIndex !== -1 && minuteRef.current) {
      minuteRef.current.scrollTo({ top: mIndex * ITEM_HEIGHT, behavior: 'smooth' });
    }
    if (pIndex !== -1 && periodRef.current) {
      periodRef.current.scrollTo({ top: pIndex * ITEM_HEIGHT, behavior: 'smooth' });
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* iOS Apple Cylinder Scroll Wheel Picker */}
      <div
        style={{
          position: 'relative',
          height: CONTAINER_HEIGHT,
          background: '#FAFAFA',
          borderRadius: 20,
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
          display: 'flex',
          userSelect: 'none'
        }}
      >
        {/* Centered Selection Lens / Glass Bar */}
        <div
          style={{
            position: 'absolute',
            top: ITEM_HEIGHT * 2,
            left: 10,
            right: 10,
            height: ITEM_HEIGHT,
            background: '#FFFFFF',
            borderRadius: 12,
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />

        {/* Top & Bottom iOS 3D Fading Masks */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: ITEM_HEIGHT * 2,
            background: 'linear-gradient(to bottom, rgba(250, 250, 250, 0.96) 20%, rgba(250, 250, 250, 0) 100%)',
            pointerEvents: 'none',
            zIndex: 2
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: ITEM_HEIGHT * 2,
            background: 'linear-gradient(to top, rgba(250, 250, 250, 0.96) 20%, rgba(250, 250, 250, 0) 100%)',
            pointerEvents: 'none',
            zIndex: 2
          }}
        />

        {/* Column 1: HOURS (1 to 12) */}
        <div
          ref={hourRef}
          onScroll={() => handleScrollWheel(hourRef, HOURS, 'hour')}
          style={{
            flex: 1,
            height: '100%',
            overflowY: 'auto',
            scrollSnapType: 'y mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            paddingTop: ITEM_HEIGHT * 2,
            paddingBottom: ITEM_HEIGHT * 2,
            zIndex: 3
          }}
        >
          {HOURS.map((h) => {
            const isSelected = h === currentHour;
            return (
              <div
                key={h}
                onClick={() => handleSelectExact(h, currentMinute, currentPeriod)}
                style={{
                  height: ITEM_HEIGHT,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  scrollSnapAlign: 'center',
                  fontSize: isSelected ? '1.5rem' : '1.2rem',
                  fontWeight: isSelected ? 850 : 500,
                  color: isSelected ? '#09090B' : '#A1A1AA',
                  transform: isSelected ? 'scale(1.08)' : 'scale(0.95)',
                  transition: 'color 0.15s, transform 0.15s',
                  cursor: 'pointer'
                }}
              >
                {h}
              </div>
            );
          })}
        </div>

        {/* Colon Separator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#09090B',
            zIndex: 3,
            width: 16
          }}
        >
          :
        </div>

        {/* Column 2: MINUTES (00 to 59) */}
        <div
          ref={minuteRef}
          onScroll={() => handleScrollWheel(minuteRef, MINUTES, 'minute')}
          style={{
            flex: 1,
            height: '100%',
            overflowY: 'auto',
            scrollSnapType: 'y mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            paddingTop: ITEM_HEIGHT * 2,
            paddingBottom: ITEM_HEIGHT * 2,
            zIndex: 3
          }}
        >
          {MINUTES.map((m) => {
            const isSelected = m === currentMinute;
            return (
              <div
                key={m}
                onClick={() => handleSelectExact(currentHour, m, currentPeriod)}
                style={{
                  height: ITEM_HEIGHT,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  scrollSnapAlign: 'center',
                  fontSize: isSelected ? '1.5rem' : '1.2rem',
                  fontWeight: isSelected ? 850 : 500,
                  color: isSelected ? '#09090B' : '#A1A1AA',
                  transform: isSelected ? 'scale(1.08)' : 'scale(0.95)',
                  transition: 'color 0.15s, transform 0.15s',
                  cursor: 'pointer'
                }}
              >
                {m}
              </div>
            );
          })}
        </div>

        {/* Column 3: AM / PM */}
        <div
          ref={periodRef}
          onScroll={() => handleScrollWheel(periodRef, PERIODS, 'period')}
          style={{
            flex: 1,
            height: '100%',
            overflowY: 'auto',
            scrollSnapType: 'y mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            paddingTop: ITEM_HEIGHT * 2,
            paddingBottom: ITEM_HEIGHT * 2,
            zIndex: 3
          }}
        >
          {PERIODS.map((p) => {
            const isSelected = p === currentPeriod;
            return (
              <div
                key={p}
                onClick={() => handleSelectExact(currentHour, currentMinute, p)}
                style={{
                  height: ITEM_HEIGHT,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  scrollSnapAlign: 'center',
                  fontSize: isSelected ? '1.3rem' : '1.1rem',
                  fontWeight: isSelected ? 850 : 500,
                  color: isSelected ? '#09090B' : '#A1A1AA',
                  transform: isSelected ? 'scale(1.08)' : 'scale(0.95)',
                  transition: 'color 0.15s, transform 0.15s',
                  cursor: 'pointer'
                }}
              >
                {p}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
