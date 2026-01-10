import React from 'react';
import { Image } from 'react-native';

// Icon components for different categories
const PlumberIcon = () => (
  <Image 
    source={require('../assets/images/plumbericon2.png')} 
    style={{ width: 40, height: 40 }}
    resizeMode="contain"
  />
);

const ElectricianIcon = () => (
  <Image 
    source={require('../assets/images/electricianicon2.png')} 
    style={{ width: 40, height: 40 }}
    resizeMode="contain"
  />
);

const CarpenterIcon = () => (
  <Image 
    source={require('../assets/images/carpentericon3.png')} 
    style={{ width: 40, height: 40 }}
    resizeMode="contain"
  />
);

const CleaningIcon = () => (
  <Image 
    source={require('../assets/images/cleanericon2.png')} 
    style={{ width: 40, height: 40}}
    resizeMode="contain"
  />
);

const MechanicIcon = () => (
  <Image 
    source={require('../assets/images/mechanicicon2.png')} 
    style={{ width: 40, height: 40 }}
    resizeMode="contain"
  />
);

const PainterIcon = () => (
  <Image 
    source={require('../assets/images/paintericon2.png')} 
    style={{ width: 40, height: 40 }}
    resizeMode="contain"
  />
);

const GardenerIcon = () => (
  <Image 
    source={require('../assets/images/gardenericon2.png')} 
    style={{ width: 40, height: 40 }}
    resizeMode="contain"
  />
);

const TailorIcon = () => (
  <Image 
    source={require('../assets/images/tailoricon.png')} 
    style={{ width: 40, height: 40 }}
    resizeMode="contain"
  />
);

// Default icon (can be a generic service icon)
const DefaultIcon = () => (
  <Image 
    source={require('../assets/images/plumbericon2.png')} 
    style={{ width: 40, height: 40 }}
    resizeMode="contain"
  />
);

/**
 * Maps category name or displayName to appropriate icon component
 * Uses case-insensitive matching on name, displayName, and description
 */
export const getCategoryIcon = (
  name?: string,
  displayName?: string,
  description?: string
): React.ComponentType => {
  // Normalize strings for matching
  const normalize = (str: string) => str.toLowerCase().trim();
  
  const searchText = [
    name,
    displayName,
    description,
  ]
    .filter(Boolean)
    .map(normalize)
    .join(' ');

  // Match based on keywords in name, displayName, or description
  if (searchText.includes('plumb') || searchText.includes('pipe') || searchText.includes('water')) {
    return PlumberIcon;
  }
  
  if (searchText.includes('electric') || searchText.includes('wiring') || searchText.includes('power')) {
    return ElectricianIcon;
  }
  
  if (searchText.includes('carpent') || searchText.includes('wood') || searchText.includes('furniture')) {
    return CarpenterIcon;
  }
  
  if (searchText.includes('clean') || searchText.includes('housekeep') || searchText.includes('maid')) {
    return CleaningIcon;
  }
  
  if (searchText.includes('mechanic') || searchText.includes('auto') || searchText.includes('car') || searchText.includes('vehicle')) {
    return MechanicIcon;
  }
  
  if (searchText.includes('paint') || searchText.includes('painting')) {
    return PainterIcon;
  }
  
  if (searchText.includes('garden') || searchText.includes('landscap') || searchText.includes('lawn')) {
    return GardenerIcon;
  }
  
  if (searchText.includes('tailor') || searchText.includes('sew') || searchText.includes('cloth') || searchText.includes('alter')) {
    return TailorIcon;
  }
  
  // Default icon if no match
  return DefaultIcon;
};
