import { ServiceCategory } from '../data/serviceCategories';

export interface Provider {
  id: string;
  name: string;
  profession: string;
  rating: number;
  reviews: number;
  distance: string;
  phone: string;
  icon: any; 
  tags: string[];
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  phone: string;
  profileImageUri?: string;
}

/** Client profile tab — optional stats from `/api/user/profile`. */
export interface ClientProfileView extends UserProfile {
  referralCode?: string;
  rating?: number;
  reviewCount?: number;
}

export interface UpdateProfilePayload {
  name: string;
  email: string;
  phone: string;
  profileImageUri?: string;
}

export interface TodoList {
  name: string,
  icons: any,
}

export { ServiceCategory };

