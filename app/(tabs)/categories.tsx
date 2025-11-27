import { CategorySkeleton } from '@/components/LoadingSkeleton';
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Search, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { serviceCategories } from '../../data/serviceCategories';

interface CategoryData {
  id: string;
  name: string;
  description: string;
  providerNum: string;
  IconComponent: React.ComponentType;
}

export default function CategoryPage() {
  const routes = useRouter();
  const params = useLocalSearchParams<{ selectedCategoryId?: string, searchQuery?: string }>();
  const { toast, showError, hideToast } = useToast();
  const [isToggle, setIsToggle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasNavigatedFromHome, setHasNavigatedFromHome] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const searchInputRef = useRef<TextInput>(null);
  const categoryRefs = useRef<{ [key: string]: number }>({});
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
  const handleToggle = (id: string) => {
    setIsToggle((prev) => (prev === id ? "" : id));
  };

  const handleSearchQueryChange = (text: string) => {
    setSearchQuery(text);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsToggle('');
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return categoryArrays;
    }
    const query = searchQuery.toLowerCase().trim();
    return categoryArrays.filter(
      (category) =>
        category.name.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query)
    );
  }, [searchQuery, categoryArrays]);

  // Track if we're coming from navigation vs tab
  useFocusEffect(
    React.useCallback(() => {
      // When screen comes into focus, check if we have searchQuery param
      // If not, we're coming from tab navigation, so clear the flag
      if (!params.searchQuery && !params.selectedCategoryId) {
        setHasNavigatedFromHome(false);
        setSearchQuery('');
      }
    }, [params.searchQuery, params.selectedCategoryId])
  );

  useEffect(() => {
    if (params.searchQuery) {
      const searchQueryValue = params.searchQuery;
      setSearchQuery(searchQueryValue);
      setHasNavigatedFromHome(true);
      const scrollTimer = setTimeout(() => {
        searchInputRef.current?.focus();
        const query = searchQueryValue.toLowerCase().trim();
        const firstMatch = categoryArrays.find(
          (category) =>
            category.name.toLowerCase().includes(query) ||
            category.description.toLowerCase().includes(query)
        );
        if (firstMatch && scrollViewRef.current) {
          setIsToggle(firstMatch.id);
          const categoryIndex = categoryArrays.findIndex(
            (cat) => cat.id === firstMatch.id
          );
          if (categoryIndex !== -1) {
            const scrollPosition = categoryIndex * 110;
            scrollViewRef.current.scrollTo({
              y: scrollPosition,
              animated: true,
            });
          }
        }
      }, 400);

      return () => clearTimeout(scrollTimer);
    }
  }, [params.searchQuery]);

  useEffect(() => {
    if (params.selectedCategoryId) {
      setIsToggle(params.selectedCategoryId);
      const scrollTimer = setTimeout(() => {
        const categoryIndex = categoryArrays.findIndex(
          (cat) => cat.id === params.selectedCategoryId
        );
        if (categoryIndex !== -1 && scrollViewRef.current) {
          const scrollPosition = categoryIndex * 110;
          scrollViewRef.current.scrollTo({
            y: scrollPosition,
            animated: true,
          });
        }
      }, 300);
      return () => clearTimeout(scrollTimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.selectedCategoryId]);

  const searchBarStyle = useMemo(() => ({ height: 50 }), []);
  const handleNextJobsScreen = () => {
    if (isToggle !== "") {
      routes.push('/JobDetailsScreen' as any)
    }
    else {
      showError('Please choose a category')
    }
  }

  const isFromNavigation = !!params.selectedCategoryId || hasNavigatedFromHome;

  return (
    <SafeAreaWrapper>
      <View style={{ flex: 1, paddingHorizontal: 10, paddingTop: 20 }}>
          {isFromNavigation ? (
            <View className=' flex flex-row px-3 items-center mb-6 gap-20'>
              <TouchableOpacity
                onPress={() => routes.back()}
                className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-gray-100"
              >
                <ArrowLeft size={20} color="#111827" />
              </TouchableOpacity>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#000000',
                textAlign: 'center',
              }}>Request Service</Text>
            </View>
          ) : (
            <View className='px-3 mb-6'>
              <Text style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: '#000000',
                fontFamily: 'Poppins-Bold',
              }}>Request Service</Text>
            </View>
          )}
          <View className='pb-6 px-0'>

            <View
              className="bg-gray-100 rounded-xl px-6 py-0 flex-row items-center"
              style={searchBarStyle}
            >
              <TextInput
                ref={searchInputRef}
                placeholder="Search for services"
                value={searchQuery}
                onChangeText={handleSearchQueryChange}
                className="flex-1 text-black text-base"
                placeholderTextColor="#666"
                style={{ fontFamily: 'Poppins-Medium' }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={handleClearSearch}
                  className="w-8 h-8 items-center justify-center mr-2"
                  activeOpacity={0.7}
                >
                  <X size={18} color="#666" />
                </TouchableOpacity>
              )}
              <TouchableOpacity className="w-10 h-10 bg-[#000] rounded-lg items-center justify-center ml-2">
                <Search size={18} color="#9bd719ff" />
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <Text className='text-xl pb-2' style={{
              fontFamily: 'Poppins-Bold'
            }}>All Categories</Text>
            <View style={{
              flexDirection: 'column',
              alignItems: 'center',
              position: "relative"
            }}>
              {isLoading ? (
                <>
                  <CategorySkeleton />
                  <CategorySkeleton />
                  <CategorySkeleton />
                  <CategorySkeleton />
                </>
              ) : filteredCategories.length === 0 ? (
                <View className="py-12 items-center px-4">
                  <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                    <Search size={32} color="#9CA3AF" />
                  </View>
                  <Text className="text-gray-700 text-lg mb-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
                    No results found
                  </Text>
                  <Text className="text-gray-500 text-sm text-center" style={{ fontFamily: 'Poppins-Regular' }}>
                    We couldn't find any categories matching "{searchQuery}"
                  </Text>
                  <Text className="text-gray-400 text-xs text-center mt-2" style={{ fontFamily: 'Poppins-Regular' }}>
                    Try searching with different keywords
                  </Text>
                </View>
              ) : (
                filteredCategories.map((category, index) => (
                  <TouchableOpacity
                    onPress={() => handleToggle(category.id)}
                    key={category.id}
                    onLayout={(event) => {
                      categoryRefs.current[category.id] = event.nativeEvent.layout.y;
                    }}
                    style={{
                      width: '100%',
                      backgroundColor: isToggle === category.id ? '#F0FDF4' : '#ffffff',
                      borderRadius: 16,
                      padding: 12,
                      marginBottom: 16,
                      borderWidth: isToggle === category.id ? 2 : 1,
                      borderColor: isToggle === category.id ? '#6A9B00' : '#e5e5e5',
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={{
                      backgroundColor: '#000',
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
                        marginBottom: 4
                      }}>
                        {category.description}
                      </Text>
                      <View style={{
                        backgroundColor: 'transparent',
                        borderRadius: 12,
                        alignSelf: 'flex-start'
                      }}>
                        <Text style={{
                          fontSize: 11,
                          fontWeight: '500',
                        }}>
                          {category.providerNum}
                        </Text>
                      </View>
                      <TouchableOpacity className='absolute right-2' onPress={() => handleToggle(category.id)}
                      >
                        <View className={`h-6 w-6 border-0 rounded-full ${isToggle === category.id ? "bg-black" : "bg-transparent"
                          }`} >
                        </View>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))
              )}

            </View>

          </ScrollView>
          <TouchableOpacity
            disabled={!isToggle}
            className={`bg-black mt-10 mb-16 flex items-center justify-center mx-auto w-[90%] h-14 rounded-xl ${!isToggle ? 'bg-gray-400' : 'bg-black'}`}
            onPress={handleNextJobsScreen}
            activeOpacity={!isToggle ? 0.5 : 0.85}
          >
            <View className='flex flex-row items-center gap-3'>
              <Text className='text-[#D7FF6B]' style={{
                fontFamily: 'Poppins-Bold'
              }}>Add Details</Text>
              <Text>
                <Ionicons name='arrow-forward' size={18} color={'#D7FF6B'} />
              </Text>
            </View>
          </TouchableOpacity>
        <Toast
          message={toast.message}
          type={toast.type}
          visible={toast.visible}
          onClose={hideToast}
        />
      </View>
    </SafeAreaWrapper>
  )
}