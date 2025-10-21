import * as NavigationBar from 'expo-navigation-bar';
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Image, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import useOnboarding from "../hooks/useOnboarding";

export default function SplashScreen() {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { isOnboardingComplete, isLoading } = useOnboarding();


useEffect(() => {
  const setupNavBar = async () => {
    await NavigationBar.setBackgroundColorAsync('black');
    await NavigationBar.setButtonStyleAsync('light');
    await NavigationBar.setBehaviorAsync('overlay-swipe'); // keeps gesture nav working
    await NavigationBar.setVisibilityAsync('visible');
  };

  setupNavBar();
}, []);

  useEffect(() => {
    // Start pulse animation using basic Animated API
    const pulseAnimation = () => {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.08,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start(() => pulseAnimation());
    };

    pulseAnimation();
  }, [scaleAnim]);

  useEffect(() => {
    if (!isLoading) {
      // Auto-navigate after 3 seconds
      const timer = setTimeout(() => {
        if (isOnboardingComplete) {
          router.replace("/main");
        } else {
          router.replace("/onboarding");
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isLoading, isOnboardingComplete, router]);

  const handlePress = () => {
    if (isOnboardingComplete) {
      router.replace("/main");
    } else {
      router.replace("/onboarding");
    }
  };

  // Show loading state while checking onboarding status
  if (isLoading) {
    return (
      <View
        // style={{
        //   flex: 1,
        //   justifyContent: "center",
        //   alignItems: "center",
        //   backgroundColor: "#ADF802",
          
        // }}
        style={[
   Platform.OS === 'android' && { paddingBottom: 0 },
styles.container
        ]}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Image
            source={require("../assets/images/icon.png")}
            style={{
              width: 120,
              height: 120,
            }}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ADF802",
      }}
    >
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <View
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: 20,
            padding: 30,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 4,
            },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 0,
          }}
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Image
              source={require("../assets/images/icon.png")}
              style={{
                width: 120,
                height: 120,
                marginBottom: 20,
              }}
              resizeMode="contain"
            />
          </Animated.View>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: "#333",
              textAlign: "center",
            }}
          >
            Your one-stop shop for help
          </Text>

        </View>
      </TouchableOpacity>
      <StatusBar barStyle={'default'} />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#ADF802",
  },
});