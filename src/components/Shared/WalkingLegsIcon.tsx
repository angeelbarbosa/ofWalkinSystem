import React from 'react';

interface WalkingLegsIconProps {
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Outlined Walking Legs & Feet Icon (From knee down walking)
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
      {/* Front Leg (stepping forward with shoe planted) */}
      <path d="M11 3L8.5 12L6 18.5L2 20.5H7.5L9.5 18L12 12L14 3" />
      
      {/* Back Leg (knee angled back, heel lifted, pushing off toe) */}
      <path d="M14.5 3L16.5 10.5L18.5 16L22 19L19.5 20.5L17 17L15 11L13 3" />
    </svg>
  );
};
