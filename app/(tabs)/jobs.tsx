import { Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function JobScreen() {
    return(
        <SafeAreaProvider >
            <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
                <View style={{ flex: 1, paddingHorizontal: 10, paddingTop: 20 }}>
                    <Text>iubdkf</Text>
                </View>
            </SafeAreaView>
        </SafeAreaProvider>
    )
}