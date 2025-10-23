import React from 'react';
import {
    CarpenterIcon,
    CleaningIcon,
    ElectricianIcon,
    GardenerIcon,
    MechanicIcon,
    PainterIcon,
    PlumberIcon,
    TechnicianIcon
} from '../components/ServiceIcons';

export interface ServiceCategory {
  id: string;
  title: string;
  icon: React.ComponentType;
}

// Static service categories data - prevents recreation on every render
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
    id: 'technician',
    title: 'Technician',
    icon: TechnicianIcon
  }
];

// Pre-sliced categories for the home screen grid (prevents slicing on every render)
export const homeScreenCategories = serviceCategories.slice(0, 8);