import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { serviceCategories } from '../../data/serviceCategories';

interface CategoryData {
  id: string;
  name: string;
  description: string;
  providerNum: string;
  IconComponent: React.ComponentType;
}

export default function CategoryPage() {
  const categoryArrays: CategoryData[] = [
    {
      id: 'plumber',
      name: 'Plumber',
      description: 'Professional plumbing services for all your water and pipe needs',
      providerNum: '245 providers',
      IconComponent: serviceCategories[0].icon
    },
    {
      id: 'electrician',
      name: 'Electrician',
      description: 'Expert electrical repairs, installations and maintenance services',
      providerNum: '189 providers',
      IconComponent: serviceCategories[1].icon
    },
    {
      id: 'carpenter',
      name: 'Carpenter',
      description: 'Custom woodwork, furniture repairs and carpentry solutions',
      providerNum: '156 providers',
      IconComponent: serviceCategories[2].icon
    },
    {
      id: 'cleaning',
      name: 'Cleaning',
      description: 'Professional house cleaning and maintenance services',
      providerNum: '298 providers',
      IconComponent: serviceCategories[3].icon
    },
    {
      id: 'mechanic',
      name: 'Mechanic',
      description: 'Auto repair and maintenance services for all vehicle types',
      providerNum: '134 providers',
      IconComponent: serviceCategories[4].icon
    },
    {
      id: 'painter',
      name: 'Painter',
      description: 'Interior and exterior painting services for homes and offices',
      providerNum: '201 providers',
      IconComponent: serviceCategories[5].icon
    },
    {
      id: 'gardener',
      name: 'Gardener',
      description: 'Landscaping, lawn care and garden maintenance services',
      providerNum: '167 providers',
      IconComponent: serviceCategories[6].icon
    },
    {
      id: 'tailor',
      name: 'Tailor',
      description: 'Custom clothing alterations and tailoring services',
      providerNum: '89 providers',
      IconComponent: serviceCategories[7].icon
    }
  ];

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <View style={{ flex: 1, paddingHorizontal: 10, paddingTop: 20 }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: '#000000',
            textAlign: 'center',
            marginBottom: 24
          }}>All Categories</Text>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <View style={{ 
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              {categoryArrays.map((category) => (
                <TouchableOpacity 
                  key={category.id}
                  style={{
                    width: '100%',
                    backgroundColor: '#ffffff',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                    shadowColor: '#000',
                    shadowOffset: {
                      width: 0,
                      height: 2,
                    },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                    borderWidth: 1,
                    borderColor: '#e5e5e5',
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}
                  activeOpacity={0.8}
                >
                  <View style={{
                    backgroundColor: '#eaeaedff',
                    borderRadius: 12,
                    padding: 16,
                    marginRight: 16,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <category.IconComponent />
                  </View>
                  <View style={{
                    flex: 1,
                    justifyContent: 'center'
                  }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#1a1a1a',
                      marginBottom: 6
                    }}>
                      {category.name}
                    </Text>
                    <Text style={{
                      fontSize: 12,
                      width: '80%',
                      color: '#666666',
                      lineHeight: 16,
                      marginBottom: 8
                    }}>
                      {category.description}
                    </Text>
                    <View style={{
                      backgroundColor: '#e3f2fd',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12,
                      alignSelf: 'flex-start'
                    }}>
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '500',
                        color: '#1976d2'
                      }}>
                        {category.providerNum}
                      </Text>
                    </View>
                    <TouchableOpacity className='absolute right-0'>
                      <Ionicons name='arrow-forward' className='' size={20} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}