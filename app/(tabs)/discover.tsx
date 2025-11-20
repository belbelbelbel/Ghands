import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import React from 'react';
import { Text } from 'react-native';

interface ServiceProvider {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  distance: string;
  price: string;
  image: string;
  tags: string[];
}

const mockProviders: ServiceProvider[] = [
  {
    id: '1',
    name: 'Mike\'s Plumbing',
    category: 'Plumbing',
    rating: 4.9,
    reviews: 127,
    distance: '0.8 miles',
    price: '$50/hr',
    image: '👨‍🔧',
    tags: ['Emergency', 'Licensed', '24/7']
  },
  {
    id: '2',
    name: 'Electric Solutions',
    category: 'Electrical',
    rating: 4.8,
    reviews: 89,
    distance: '1.2 miles',
    price: '$75/hr',
    image: '⚡',
    tags: ['Certified', 'Fast Response']
  },
  {
    id: '3',
    name: 'Clean & Shine',
    category: 'Cleaning',
    rating: 4.7,
    reviews: 203,
    distance: '0.5 miles',
    price: '$30/hr',
    image: '🧽',
    tags: ['Eco-Friendly', 'Insured']
  }
];

export default function DiscoverScreen() {
  return(
    <SafeAreaWrapper>
      <Text>DiscoverScreen</Text>
    </SafeAreaWrapper>
  )
}