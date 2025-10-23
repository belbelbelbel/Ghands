import { useRouter } from 'expo-router';
import { ArrowLeft, Plus } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Modal, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, {
    Circle,
    Defs,
    LinearGradient,
    Path,
    Rect,
    Stop
} from 'react-native-svg';

interface ServiceCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  providers: number;
  isCustom?: boolean;
}

// Custom SVG Icons for Service Categories
const PlumberIcon = () => (
  <Svg width={32} height={32} viewBox="0 0 32 32">
    <Defs>
      <LinearGradient id="plumberGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#4A90E2" />
        <Stop offset="100%" stopColor="#357ABD" />
      </LinearGradient>
    </Defs>
    <Circle cx="16" cy="16" r="14" fill="url(#plumberGrad)" stroke="#ddd" strokeWidth="1"/>
    <Path d="M12 10 L20 10 L20 14 L16 14 L16 18 L20 18 L20 22 L12 22 Z" fill="white"/>
    <Circle cx="14" cy="12" r="1" fill="#4A90E2"/>
    <Circle cx="18" cy="12" r="1" fill="#4A90E2"/>
  </Svg>
);

const ElectricianIcon = () => (
  <Svg width={32} height={32} viewBox="0 0 32 32">
    <Defs>
      <LinearGradient id="electricianGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFD700" />
        <Stop offset="100%" stopColor="#FFA500" />
      </LinearGradient>
    </Defs>
    <Circle cx="16" cy="16" r="14" fill="url(#electricianGrad)" stroke="#ddd" strokeWidth="1"/>
    <Path d="M16 6 L20 14 L14 14 L16 22 L12 14 L18 14 Z" fill="white"/>
  </Svg>
);

const MechanicIcon = () => (
  <Svg width={32} height={32} viewBox="0 0 32 32">
    <Defs>
      <LinearGradient id="mechanicGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FF6B6B" />
        <Stop offset="100%" stopColor="#E74C3C" />
      </LinearGradient>
    </Defs>
    <Circle cx="16" cy="16" r="14" fill="url(#mechanicGrad)" stroke="#ddd" strokeWidth="1"/>
    <Rect x="8" y="14" width="16" height="8" rx="2" fill="white"/>
    <Circle cx="12" cy="18" r="2" fill="#FF6B6B"/>
    <Circle cx="20" cy="18" r="2" fill="#FF6B6B"/>
    <Rect x="14" y="12" width="4" height="2" rx="1" fill="white"/>
  </Svg>
);

const CleanerIcon = () => (
  <Svg width={32} height={32} viewBox="0 0 32 32">
    <Defs>
      <LinearGradient id="cleanerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#4ECDC4" />
        <Stop offset="100%" stopColor="#44A08D" />
      </LinearGradient>
    </Defs>
    <Circle cx="16" cy="16" r="14" fill="url(#cleanerGrad)" stroke="#ddd" strokeWidth="1"/>
    <Path d="M10 12 L22 12 L22 20 L10 20 Z" fill="white"/>
    <Rect x="12" y="14" width="8" height="4" fill="#4ECDC4"/>
    <Path d="M14 18 L18 18" stroke="white" strokeWidth="2"/>
  </Svg>
);

const CarpenterIcon = () => (
  <Svg width={32} height={32} viewBox="0 0 32 32">
    <Defs>
      <LinearGradient id="carpenterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#8B4513" />
        <Stop offset="100%" stopColor="#654321" />
      </LinearGradient>
    </Defs>
    <Circle cx="16" cy="16" r="14" fill="url(#carpenterGrad)" stroke="#ddd" strokeWidth="1"/>
    <Path d="M8 8 L24 24 M24 8 L8 24" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    <Circle cx="16" cy="16" r="2" fill="white"/>
  </Svg>
);

const PainterIcon = () => (
  <Svg width={32} height={32} viewBox="0 0 32 32">
    <Defs>
      <LinearGradient id="painterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FF69B4" />
        <Stop offset="100%" stopColor="#FF1493" />
      </LinearGradient>
    </Defs>
    <Circle cx="16" cy="16" r="14" fill="url(#painterGrad)" stroke="#ddd" strokeWidth="1"/>
    <Path d="M12 10 L20 10 L18 20 L14 20 Z" fill="white"/>
    <Path d="M16 6 L16 10" stroke="white" strokeWidth="2"/>
    <Circle cx="16" cy="22" r="3" fill="white"/>
  </Svg>
);

const GardenerIcon = () => (
  <Svg width={32} height={32} viewBox="0 0 32 32">
    <Defs>
      <LinearGradient id="gardenerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#32CD32" />
        <Stop offset="100%" stopColor="#228B22" />
      </LinearGradient>
    </Defs>
    <Circle cx="16" cy="16" r="14" fill="url(#gardenerGrad)" stroke="#ddd" strokeWidth="1"/>
    <Path d="M16 8 L20 16 L16 24 L12 16 Z" fill="white"/>
    <Path d="M8 16 L24 16" stroke="white" strokeWidth="2"/>
  </Svg>
);

const TechnicianIcon = () => (
  <Svg width={32} height={32} viewBox="0 0 32 32">
    <Defs>
      <LinearGradient id="techGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#9370DB" />
        <Stop offset="100%" stopColor="#8A2BE2" />
      </LinearGradient>
    </Defs>
    <Circle cx="16" cy="16" r="14" fill="url(#techGrad)" stroke="#ddd" strokeWidth="1"/>
    <Rect x="10" y="12" width="12" height="8" rx="2" fill="white"/>
    <Circle cx="14" cy="16" r="1" fill="#9370DB"/>
    <Circle cx="18" cy="16" r="1" fill="#9370DB"/>
    <Path d="M16 8 L16 12" stroke="white" strokeWidth="2"/>
  </Svg>
);

const CustomIcon = () => (
  <Svg width={32} height={32} viewBox="0 0 32 32">
    <Defs>
      <LinearGradient id="customGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#ADF802" />
        <Stop offset="100%" stopColor="#8BC34A" />
      </LinearGradient>
    </Defs>
    <Circle cx="16" cy="16" r="14" fill="url(#customGrad)" stroke="#ddd" strokeWidth="1"/>
    <Path d="M16 8 L16 24 M8 16 L24 16" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    <Circle cx="16" cy="16" r="4" fill="white"/>
  </Svg>
);

const defaultCategories: ServiceCategory[] = [
  {
    id: 'plumber',
    title: 'Home Repair',
    icon: <PlumberIcon />,
    providers: 245
  },
  {
    id: 'electrician',
    title: 'Electrical',
    icon: <ElectricianIcon />,
    providers: 189
  },
  {
    id: 'cleaner',
    title: 'Cleaning',
    icon: <CleanerIcon />,
    providers: 298
  },
  {
    id: 'mechanic',
    title: 'Automotive',
    icon: <MechanicIcon />,
    providers: 156
  },
  {
    id: 'technician',
    title: 'Tech support',
    icon: <TechnicianIcon />,
    providers: 223
  },
  {
    id: 'painter',
    title: 'Plumbing',
    icon: <PainterIcon />,
    providers: 167
  }
];

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<ServiceCategory[]>(defaultCategories);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<'custom' | 'default'>('custom');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleCategoryPress = (category: ServiceCategory) => {
    console.log('Category selected:', category.title);
    // Navigate to providers for this category
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    const newCategory: ServiceCategory = {
      id: `custom_${Date.now()}`,
      title: newCategoryName.trim(),
      icon: selectedIcon === 'custom' ? <CustomIcon /> : <CustomIcon />,
      providers: 0,
      isCustom: true
    };

    setCategories(prev => [...prev, newCategory]);
    setNewCategoryName('');
    setShowCreateModal(false);
    Alert.alert('Success', 'Category created successfully!');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Animated.View 
        style={{ 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="black" />
          </TouchableOpacity>
          <Text 
            className="text-xl font-bold text-black"
            style={{ fontFamily: 'Poppins-ExtraBold' }}
          >
            All categories
          </Text>
          <TouchableOpacity 
            onPress={() => setShowCreateModal(true)}
            className="w-8 h-8 bg-[#ADF802] rounded-full items-center justify-center"
          >
            <Plus size={16} color="black" />
          </TouchableOpacity>
        </View>

        {/* Categories Grid */}
        <ScrollView className="flex-1 px-4">
          <View className="flex-row flex-wrap justify-between">
            {categories.map((category, index) => (
              <Animated.View
                key={category.id}
                style={{
                  width: '48%',
                  marginBottom: 16,
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }}
              >
                <TouchableOpacity
                  onPress={() => handleCategoryPress(category)}
                  className="bg-gray-800 rounded-2xl p-6 items-center"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: {
                      width: 0,
                      height: 2,
                    },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                  activeOpacity={0.8}
                >
                  {/* Icon Container */}
                  <View className="w-12 h-12 items-center justify-center mb-3">
                    {category.icon}
                  </View>
                  
                  {/* Category Title */}
                  <Text 
                    className="text-base font-bold text-white text-center mb-1"
                    style={{ fontFamily: 'Poppins-Bold' }}
                  >
                    {category.title}
                  </Text>
                  
                  {/* Provider Count */}
                  <Text 
                    className="text-sm text-gray-400 text-center"
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    {category.providers} providers
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </ScrollView>

        {/* Create Category Modal */}
        <Modal
          visible={showCreateModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View className="flex-1 bg-black bg-opacity-50 justify-center items-center px-4">
            <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <Text 
                className="text-xl font-bold text-black mb-4 text-center"
                style={{ fontFamily: 'Poppins-ExtraBold' }}
              >
                Create New Category
              </Text>
              
              <TextInput
                placeholder="Enter category name"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                className="bg-gray-100 rounded-xl px-4 py-3 mb-4 text-black"
                placeholderTextColor="#666"
                style={{ fontFamily: 'Poppins-Medium' }}
              />
              
              <Text 
                className="text-base font-semibold text-black mb-3"
                style={{ fontFamily: 'Poppins-SemiBold' }}
              >
                Choose Icon Type:
              </Text>
              
              <View className="flex-row space-x-4 mb-6">
                <TouchableOpacity
                  onPress={() => setSelectedIcon('custom')}
                  className={`flex-1 border-2 rounded-xl py-3 items-center ${
                    selectedIcon === 'custom' ? 'border-[#ADF802] bg-[#ADF802]' : 'border-gray-300'
                  }`}
                >
                  <CustomIcon />
                  <Text 
                    className={`text-sm mt-2 ${
                      selectedIcon === 'custom' ? 'text-black' : 'text-gray-600'
                    }`}
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    Custom
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View className="flex-row space-x-3">
                <TouchableOpacity
                  onPress={() => setShowCreateModal(false)}
                  className="flex-1 border-2 border-gray-300 rounded-xl py-3 items-center"
                >
                  <Text 
                    className="text-gray-600 font-semibold"
                    style={{ fontFamily: 'Poppins-SemiBold' }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleCreateCategory}
                  className="flex-1 bg-[#ADF802] rounded-xl py-3 items-center"
                >
                  <Text 
                    className="text-black font-semibold"
                    style={{ fontFamily: 'Poppins-SemiBold' }}
                  >
                    Create
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Bottom Spacer for Tab Navigation */}
        <View style={{ height: 100 }} />
      </Animated.View>
    </SafeAreaView>
  );
}
