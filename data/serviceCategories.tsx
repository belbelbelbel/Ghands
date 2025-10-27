import React from 'react';
import { Image } from 'react-native';

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

export interface ServiceCategory {
  id: string;
  title: string;
  icon: React.ComponentType;
}

export const serviceCategories: ServiceCategory[] = [
  {
    id: 'plumber',
    title: 'Plumber',
    icon: PlumberIcon
  },
  {
    id: 'electrician',
    title: 'Electrician',
    icon: ElectricianIcon
  },
  {
    id: 'carpenter',
    title: 'Carpenter',
    icon: CarpenterIcon
  },
  {
    id: 'cleaning',
    title: 'Cleaning',
    icon: CleaningIcon
  },
  {
    id: 'mechanic',
    title: 'Mechanic',
    icon: MechanicIcon
  },
  {
    id: 'painter',
    title: 'Painter',
    icon: PainterIcon
  },
  {
    id: 'gardener',
    title: 'Gardener',
    icon: GardenerIcon
  },
  {
    id: 'tailor',
    title: 'Tailor',
    icon: TailorIcon
  }
];


export const homeScreenCategories = serviceCategories.slice(0, 8);