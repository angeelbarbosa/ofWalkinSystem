import React from 'react';

interface WalkingLegsIconProps {
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Outlined Full Walking Body Person Icon
 * Matches Lucide / Feather icon design language (crisp vector lines, round caps, 24x24 grid)
 */
export const WalkingLegsIcon: React.FC<WalkingLegsIconProps> = ({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
  style = {}
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      {/* Head */}
      <circle cx="13.5" cy="4" r="1.8" />
      {/* Torso & Leading Forward Leg */}
      <path d="M13 6L12 11.5L8.5 16.5L6 21" />
      {/* Trailing Back Leg */}
      <path d="M12 11.5L14.8 16.2L18.5 21" />
      {/* Swinging Arms */}
      <path d="M12.5 8.2L9.5 10.8L7 9.8" />
      <path d="M12.5 8.2L15.5 10.5L18 9.5" />
    </svg>
  );
};
