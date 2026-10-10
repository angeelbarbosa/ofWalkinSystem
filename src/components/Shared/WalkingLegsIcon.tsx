import React from 'react';

interface WalkingLegsIconProps {
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Modern Minimalist Walk-In Stride Icon
 * Matches the shop brand's bold geometric stride identity (crisp vector lines, round caps, 24x24 grid)
 */
export const WalkingLegsIcon: React.FC<WalkingLegsIconProps> = ({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2.4,
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
      {/* Front Striding Leg & Foot */}
      <path d="M7.8 3.8L14.6 19.5L21.5 19.5" />
      {/* Back Trailing Leg & Foot */}
      <path d="M7 11.5L3.5 19.5L10 19.5" />
    </svg>
  );
};
