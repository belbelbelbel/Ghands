import Demcatorline from "@/components/Demacator";
import HeaderComponent from "@/components/HeaderComponent";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView, } from "react-native-safe-area-context";

export default function Jobdetails() {
  const iconStack = [
    {
      id: 1,
      icons: <Ionicons name="call" size={14} color={'white'} />
    },
    {
      id: 2,
      icons: <Ionicons name="chatbubble" size={14} color={'white'} />
    }
  ]

  const BookedDate = [
    {
      name: "Scheduled Date",
      subtitle: 'October 20, 2024 - 2:00 PM',
      icon: <Ionicons name="calendar"  color={'#9CA3AF'} size={18}/>
    },
    {
      name: "Location",
      subtitle: '123 Main St, Downtown',
      icon: <Ionicons name="location"  color={'#9CA3AF'} size={18}/>
    },
    {
      name: 'Total Cost',
      subtitle: '$150.00',
      icon: <Ionicons name="cash"  color={'#9CA3AF'} size={18}/>
    }
  ]

  const routes = useRouter()
  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1  pt-3 bg-white px-5">
        <View>
          <View className="pb-8 ">
            <HeaderComponent name="Job Details" onPress={routes.back} />
          </View>
          <View>
            <Text style={{
              fontFamily: 'Poppins-SemiBold'
            }} className="text-xl"> Service Provider</Text>
          </View>
          <View className="mt-4 flex flex-row items-center justify-between px-5 py-5 bg-gray-100 rounded-xl">
            <View className="flex flex-row items-center gap-5">
              <View className="w-10 h-10">
                <Image source={require('../assets/images/plumbericon.png')} className="w-full h-full object-contian" />
              </View>
              <View>
                <Text className="" style={{
                  fontFamily: 'Poppins-Bold'
                }}>Mike Johnson</Text>
                <View className="flex flex-row gap-3 items-center">
                  <Text>
                    {
                      Array.from({ length: 5 }).map(() => (
                        <Ionicons name="star" color={'#FACC15'} />
                      ))
                    }
                  </Text>
                  <Text className="text-sm text-gray-600" style={{
                    fontFamily: "Poppins-Regular"
                  }}>4.8 (127 reviews)</Text>
                </View>
              </View>
            </View>
            <View className="flex flex-row gap-2">
              {
                iconStack.map((icons) => (
                  <TouchableOpacity className=" p-2  rounded-xl bg-[#6A9B00]" key={icons.id}>
                    <View>
                      {icons.icons}
                    </View>
                  </TouchableOpacity>
                ))
              }
            </View>
          </View>
          <Demcatorline />
          <View className="mt-5">
            <View className="flex gap-3">
              <Text className="text-xl" style={{
                fontFamily: 'Poppins-SemiBold'
              }}>Job Description</Text>
              <Text className="text-sm mr-4 text-[#4B5563]" style={{
                fontFamily: 'Poppins-Regular'
              }}>
                Kitchen sink pipe has developed a leak underneath the cabinet. Water is dripping continuously andneeds immediate repair. The pipe appears to beloose at the joint connection.
              </Text>
            </View>
          </View>
          <Demcatorline />
          <View className="mt-5">
            {
              BookedDate.map((items) => (
                <View className="flex  mb-3 flex-row gap-4 items-center">
                  <View className="">
                    {items.icon}
                  </View>
                  <View className="flex gap-3">
                    <Text className="text-gray-500" style={{
                      fontFamily: 'Poppins-medium'
                    }}>{items.name}</Text>
                    <Text style={{
                      fontFamily: 'Poppins-SemiBold'
                    }}>{items.subtitle}</Text>
                  </View>
                </View>
              ))
            }
            <TouchableOpacity className="flex gap-5 flex-row mt-3 py-4 rounded-xl items-center justify-center bg-[#6A9B00]">
              <Text className="text-white text-md" style={{
                fontFamily: "Poppins-SemiBold"
              }}>View Receipt</Text>
              <Text>
                <Ionicons size={18} name="arrow-forward" color={'white'}/>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}