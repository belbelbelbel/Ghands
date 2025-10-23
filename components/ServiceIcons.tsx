import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Memoized SVG icon components for better performance
export const PlumberIcon = React.memo(() => (
  <Svg width={64} height={64} viewBox="0 0 64 64">
    <Circle cx="32" cy="20" r="8" fill="#F4C2A1" />
    <Path d="M24 16 Q32 8 40 16" fill="#2C2C2C" />
    <Circle cx="29" cy="18" r="1" fill="#000" />
    <Circle cx="35" cy="18" r="1" fill="#000" />
    <Path d="M28 22 Q32 25 36 22" stroke="#000" strokeWidth="1" fill="none" />
    <Path d="M24 12 Q32 6 40 12 L40 16 Q32 10 24 16 Z" fill="#4A90E2" />
    <Rect x="24" y="28" width="16" height="20" fill="#4A90E2" />
    <Rect x="28" y="28" width="8" height="4" fill="#FFFFFF" />
    <Rect x="26" y="32" width="3" height="3" fill="#357ABD" />
    <Rect x="35" y="32" width="3" height="3" fill="#357ABD" />
    <Rect x="45" y="25" width="2" height="15" fill="#FF6B6B" />
    <Circle cx="46" cy="25" r="4" fill="#FF6B6B" />
  </Svg>
));

export const ElectricianIcon = React.memo(() => (
  <Svg width={64} height={64} viewBox="0 0 64 64">
    <Circle cx="32" cy="20" r="8" fill="#F4C2A1" />
    <Path d="M24 16 Q32 8 40 16" fill="#2C2C2C" />
    <Circle cx="29" cy="18" r="1" fill="#000" />
    <Circle cx="35" cy="18" r="1" fill="#000" />
    <Path d="M28 22 Q32 25 36 22" stroke="#000" strokeWidth="1" fill="none" />
    <Path d="M24 12 Q32 6 40 12 L40 16 Q32 10 24 16 Z" fill="#FFD700" />
    <Rect x="24" y="28" width="16" height="20" fill="#FFD700" />
    <Rect x="28" y="28" width="8" height="4" fill="#FFFFFF" />
    <Path d="M45 20 L50 30 L47 30 L49 40 L44 30 L47 30 Z" fill="#FFA500" />
  </Svg>
));

export const CarpenterIcon = React.memo(() => (
  <Svg width={64} height={64} viewBox="0 0 64 64">
    <Circle cx="32" cy="20" r="8" fill="#F4C2A1" />
    <Path d="M24 16 Q32 8 40 16" fill="#2C2C2C" />
    <Circle cx="29" cy="18" r="1" fill="#000" />
    <Circle cx="35" cy="18" r="1" fill="#000" />
    <Path d="M28 22 Q32 25 36 22" stroke="#000" strokeWidth="1" fill="none" />
    <Path d="M24 12 Q32 6 40 12 L40 16 Q32 10 24 16 Z" fill="#FF8C00" />
    <Rect x="24" y="28" width="16" height="20" fill="#FF8C00" />
    <Rect x="28" y="28" width="8" height="4" fill="#FFFFFF" />
    <Rect x="45" y="30" width="8" height="2" fill="#8B4513" />
    <Rect x="50" y="25" width="2" height="10" fill="#8B4513" />
  </Svg>
));

export const CleaningIcon = React.memo(() => (
  <Svg width={64} height={64} viewBox="0 0 64 64">
    <Circle cx="32" cy="20" r="8" fill="#F4C2A1" />
    <Path d="M24 16 Q32 8 40 16" fill="#2C2C2C" />
    <Circle cx="29" cy="18" r="1" fill="#000" />
    <Circle cx="35" cy="18" r="1" fill="#000" />
    <Path d="M28 22 Q32 25 36 22" stroke="#000" strokeWidth="1" fill="none" />
    <Path d="M24 12 Q32 6 40 12 L40 16 Q32 10 24 16 Z" fill="#87CEEB" />
    <Rect x="24" y="28" width="16" height="20" fill="#87CEEB" />
    <Rect x="28" y="28" width="8" height="4" fill="#FFFFFF" />
    <Rect x="45" y="25" width="2" height="15" fill="#8B4513" />
    <Path d="M44 25 Q46 20 48 25" stroke="#4ECDC4" strokeWidth="3" fill="none" />
  </Svg>
));

export const MechanicIcon = React.memo(() => (
  <Svg width={64} height={64} viewBox="0 0 64 64">
    <Circle cx="32" cy="20" r="8" fill="#F4C2A1" />
    <Path d="M24 16 Q32 8 40 16" fill="#2C2C2C" />
    <Circle cx="29" cy="18" r="1" fill="#000" />
    <Circle cx="35" cy="18" r="1" fill="#000" />
    <Path d="M28 22 Q32 25 36 22" stroke="#000" strokeWidth="1" fill="none" />
    <Path d="M24 12 Q32 6 40 12 L40 16 Q32 10 24 16 Z" fill="#FF6B6B" />
    <Rect x="24" y="28" width="16" height="20" fill="#FF6B6B" />
    <Rect x="28" y="28" width="8" height="4" fill="#FFFFFF" />
    <Path d="M45 25 L50 30 L48 32 L43 27 Z" fill="#C0C0C0" />
  </Svg>
));

export const PainterIcon = React.memo(() => (
  <Svg width={64} height={64} viewBox="0 0 64 64">
    <Circle cx="32" cy="20" r="8" fill="#F4C2A1" />
    <Path d="M24 16 Q32 8 40 16" fill="#2C2C2C" />
    <Circle cx="29" cy="18" r="1" fill="#000" />
    <Circle cx="35" cy="18" r="1" fill="#000" />
    <Path d="M28 22 Q32 25 36 22" stroke="#000" strokeWidth="1" fill="none" />
    <Path d="M24 12 Q32 6 40 12 L40 16 Q32 10 24 16 Z" fill="#9370DB" />
    <Rect x="24" y="28" width="16" height="20" fill="#9370DB" />
    <Rect x="28" y="28" width="8" height="4" fill="#FFFFFF" />
    <Rect x="45" y="25" width="2" height="10" fill="#8B4513" />
    <Path d="M44 25 Q46 20 48 25" stroke="#FF69B4" strokeWidth="3" fill="none" />
  </Svg>
));

export const GardenerIcon = React.memo(() => (
  <Svg width={64} height={64} viewBox="0 0 64 64">
    <Circle cx="32" cy="20" r="8" fill="#F4C2A1" />
    <Path d="M24 16 Q32 8 40 16" fill="#2C2C2C" />
    <Circle cx="29" cy="18" r="1" fill="#000" />
    <Circle cx="35" cy="18" r="1" fill="#000" />
    <Path d="M28 22 Q32 25 36 22" stroke="#000" strokeWidth="1" fill="none" />
    <Path d="M24 12 Q32 6 40 12 L40 16 Q32 10 24 16 Z" fill="#32CD32" />
    <Rect x="24" y="28" width="16" height="20" fill="#32CD32" />
    <Rect x="28" y="28" width="8" height="4" fill="#FFFFFF" />
    <Rect x="45" y="25" width="2" height="15" fill="#8B4513" />
    <Path d="M44 25 Q46 20 48 25" stroke="#228B22" strokeWidth="3" fill="none" />
  </Svg>
));

export const TechnicianIcon = React.memo(() => (
  <Svg width={72} height={64} viewBox="0 0 64 64">
    <Circle cx="32" cy="20" r="8" fill="#F4C2A1" />
    <Path d="M24 16 Q32 8 40 16" fill="#2C2C2C" />
    <Circle cx="29" cy="18" r="1" fill="#000" />
    <Circle cx="35" cy="18" r="1" fill="#000" />
    <Path d="M28 22 Q32 25 36 22" stroke="#000" strokeWidth="1" fill="none" />
    <Path d="M24 12 Q32 6 40 12 L40 16 Q32 10 24 16 Z" fill="#2C3E50" />
    <Rect x="24" y="28" width="16" height="20" fill="#2C3E50" />
    <Rect x="28" y="28" width="8" height="4" fill="#FFFFFF" />
    <Rect x="42" y="30" width="12" height="8" fill="#34495E" />
    <Rect x="44" y="32" width="8" height="4" fill="#2ECC71" />
  </Svg>
));

// Set display names for better debugging
PlumberIcon.displayName = 'PlumberIcon';
ElectricianIcon.displayName = 'ElectricianIcon';
CarpenterIcon.displayName = 'CarpenterIcon';
CleaningIcon.displayName = 'CleaningIcon';
MechanicIcon.displayName = 'MechanicIcon';
PainterIcon.displayName = 'PainterIcon';
GardenerIcon.displayName = 'GardenerIcon';
TechnicianIcon.displayName = 'TechnicianIcon';
