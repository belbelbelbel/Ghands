import { ServiceCategory } from '../data/serviceCategories';

export interface Provider {
  id: string;
  name: string;
  profession: string;
  rating: number;
  reviews: number;
  distance: string;
  phone: string;
  icon: any; // ImageSourcePropType from react-native
  tags: string[];
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  phone: string;
  profileImageUri?: string;
}

export interface UpdateProfilePayload {
  name: string;
  email: string;
  phone: string;
  profileImageUri?: string;
}

export { ServiceCategory };

