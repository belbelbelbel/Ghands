import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 8;
const GRID_PADDING = 20;
const ITEM_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * 2) / 3;

export default function PhotosGalleryScreen() {
  const router = useRouter();

  // Mock images - replace with actual image data
  const photos = Array.from({ length: 9 }, (_, i) => ({
    id: `photo-${i + 1}`,
    uri: require('../assets/images/jobcardimg.png'), // Replace with actual image sources
  }));

  return (
    <SafeAreaWrapper backgroundColor={Colors.white}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 12,
            marginBottom: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 20,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              flex: 1,
            }}
          >
            Photos
          </Text>
        </View>

        {/* Grid of Images */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: GRID_PADDING,
            paddingBottom: 100,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              marginHorizontal: -GRID_GAP / 2,
            }}
          >
            {photos.map((photo, index) => (
              <TouchableOpacity
                key={photo.id}
                style={{
                  width: ITEM_SIZE,
                  height: ITEM_SIZE,
                  margin: GRID_GAP / 2,
                  borderRadius: BorderRadius.default,
                  overflow: 'hidden',
                  backgroundColor: Colors.backgroundGray,
                }}
                activeOpacity={0.8}
              >
                <Image
                  source={photo.uri}
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
}
