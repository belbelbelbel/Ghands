import { Text, View } from "react-native";

export default function MainScreen() {
  return (
    <View 
      style={{ 
        flex: 1, 
        justifyContent: "center", 
        alignItems: "center", 
        backgroundColor: "#0b0b07" 
      }}
    >
      <Text style={{ color: "#D8FF2E", fontSize: 24, fontWeight: "bold" }}>
        Main App Screen
      </Text>
      <Text style={{ color: "#F5F0E8", fontSize: 16, marginTop: 10 }}>
        Welcome to GHands!
      </Text>
    </View>
  );
}