import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

export default function LiveSupportScreen() {
    return (
        <View className="w-[94%] mx-auto rounded-xl p-10 bg-green-100">
            <View className=" flex  gap-6">
                <View className="flex  gap-3 flex-row items-center">
                    <Text>
                        <Ionicons name="chatbubble" color={'#16A34A'} size={25} />
                    </Text>
                    <Text className="text-2xl text-[#14532D]">Live chat Support</Text>
                </View>
                <Text className="text-[#166534] ">
                    Get instant answers to your questions from our friendly support team.
                </Text>
                <TouchableOpacity className="p-3  flex items-center justify-center rounded-xl bg-[#16A34A]">
                    <Text className="text-white text-xl font-semibold">Start chat</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}