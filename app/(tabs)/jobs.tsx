import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function JobScreen() {
    const TabStatus = ['Ongoing', 'Completed', 'Cancelled']
    const [activeBar, setActivebar] = useState('Ongoing')
    const routes = useRouter()

    const handleActiveBar = (id: string) => {
        setActivebar(id)
    }

    const OngoingJobDetailsArrays = [
        {
            id: 1,
            title: "Plumbing Repair",
            subtitle: "Kitchen pipe leak repair",
            status: 'In Progress',
            name: 'Mike Johnson',
            time: "Oct 20, 2024 - 2:00 PM",
            location: "123 Main St, Downtown"
        },
        {
            id: 2,
            title: "Plumbing Repair",
            subtitle: "Kitchen pipe leak repair",
            status: 'In Progress',
            name: 'Mike Johnson',
            time: "Oct 20, 2024 - 2:00 PM",
            location: "123 Main St, Downtown"
        },

    ]

    const CompletedJobDetailsArrays = [
        {
            id: 1,
            title: "Plumbing Repair",
            subtitle: "Kitchen pipe leak repair",
            status: 'Completed',
            name: 'Mike Johnson',
            time: "Oct 20, 2024 - 2:00 PM",
            location: "123 Main St, Downtown"
        },
        {
            id: 2,
            title: "Plumbing Repair",
            subtitle: "Kitchen pipe leak repair",
            status: 'Complete',
            name: 'Mike Johnson',
            time: "Oct 20, 2024 - 2:00 PM",
            location: "123 Main St, Downtown"
        },
        {
            id: 3,
            title: "Plumbing Repair",
            subtitle: "Kitchen pipe leak repair",
            status: 'Complete',
            name: 'Mike Johnson',
            time: "Oct 20, 2024 - 2:00 PM",
            location: "123 Main St, Downtown"
        },
    ]

    const CancelledJobDdetails = [
        {

            id: 1,
            title: "Plumbing Repair",
            subtitle: "Kitchen pipe leak repair",
            status: 'Cancelled',
            name: 'Mike Johnson',
            time: "Oct 20, 2024 - 2:00 PM",
            location: "123 Main St, Downtown"
        },
        {
            id: 2,
            title: "Plumbing Repair",
            subtitle: "Kitchen pipe leak repair",
            status: 'Cancelled',
            name: 'Mike Johnson',
            time: "Oct 20, 2024 - 2:00 PM",
            location: "123 Main St, Downtown"
        },
    ]


    return (
        <SafeAreaProvider >
            <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
                <View style={{ flex: 1, paddingHorizontal: 10, paddingTop: 20 }}>
                    <View className="justify-center items-center  pb-10">
                        <Text style={{
                            fontFamily: 'Poppins-Bold',
                            fontSize: 22
                        }}>Jobs</Text>
                    </View>
                    <View className="flex flex-row justify-around">
                        {
                            TabStatus.map((status) => (
                                <View className="" key={status}>
                                    <Text className="" onPress={() => handleActiveBar(status)} style={{
                                        fontFamily: 'Poppins-Medium'
                                    }}>{status}</Text>
                                    {
                                        activeBar === status ? (
                                            <View className="bg-[#6A9B00] h-0.5 w-20 mt-2  rounded-full" />
                                        ) : (
                                            <View className="bg-transparent h-0.5 w-20 mt-2  rounded-full" />
                                        )
                                    }
                                </View>
                            ))
                        }
                    </View>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View>
                            <View className="mt-5 ">
                                {
                                    activeBar === "Ongoing" && OngoingJobDetailsArrays.map((items) => (
                                        <View key={items.id} className="flex border border-gray-200 mb-7 px-7 py-6 rounded-xl">
                                            <View className="flex flex-row w-[90%] justify-between">
                                                <Text style={{
                                                    fontFamily: 'Poppins-Bold'
                                                }} className=" text-xl mb-2">{items.title}</Text>
                                                <View className="py-0 justify-center items-center flex px-4 bg-yellow-100 rounded-xl">
                                                    <Text className="text-sm">{items.status}</Text>
                                                </View>
                                            </View>
                                            <Text className=" text-gray-700 text-sm" style={{
                                                fontFamily: 'Poppins-Regular'
                                            }}>{items.subtitle}</Text>
                                            <View className="flex items-center flex-row gap-3 mt-2">
                                                <View><Ionicons name="person" size={16} /></View>
                                                <Text className="text-sm text-gray-600" style={{
                                                    fontFamily: 'Poppins-Regular'
                                                }}>{items.name}</Text>
                                            </View>
                                            <View className="flex items-center flex-row gap-3 mt-2">
                                                <View><Ionicons name="calendar" size={16} /></View>
                                                <Text className="text-sm  text-gray-600" style={{
                                                    fontFamily: 'Poppins-Regular'
                                                }}>{items.time}</Text>
                                            </View>
                                            <View className="flex items-center flex-row gap-3 mt-2">
                                                <View><Ionicons name="location" size={16} color={'gray'} /></View>
                                                <Text className="text-sm text-gray-600" style={{
                                                    fontFamily: 'Poppins-Regular'
                                                }}>{items.location}</Text>
                                            </View>
                                            <View className="flex flex-row pt-4 justify-between">
                                                <TouchableOpacity className="bg-red-100 border border-red-600 py-2 px-7 rounded-md">
                                                    <Text className="text-[#FF2C2C]" style={{
                                                        fontFamily: 'Poppins-Medium'
                                                    }}>Cancel Request</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity className="bg-gray-100 py-2 px-7  rounded-md" onPress={() => routes.push('/OngoingJobDetails')}>
                                                    <Text className="text-black" style={{
                                                        fontFamily: 'Poppins-Medium'
                                                    }}>Check Updates</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))
                                }

                                {
                                    activeBar === "Completed" && CompletedJobDetailsArrays.map((items) => (
                                        // <ScrollView>
                                        <View key={items.id} className="flex border border-gray-200 mb-7 px-7 py-6 rounded-xl">
                                            <View className="flex flex-row w-[90%] justify-between">
                                                <Text style={{
                                                    fontFamily: 'Poppins-Bold'
                                                }} className=" text-xl mb-2">{items.title}</Text>
                                                <View className="py-0 justify-center items-center flex px-4 bg-gray-100 rounded-xl">
                                                    <Text className="text-sm">{items.status}</Text>
                                                </View>
                                            </View>
                                            <Text className=" text-gray-700 text-sm" style={{
                                                fontFamily: 'Poppins-Regular'
                                            }}>{items.subtitle}</Text>
                                            <View className="flex items-center flex-row gap-3 mt-2">
                                                <View><Ionicons name="person" size={16} /></View>
                                                <Text className="text-sm text-gray-600" style={{
                                                    fontFamily: 'Poppins-Regular'
                                                }}>{items.name}</Text>
                                            </View>
                                            <View className="flex items-center flex-row gap-3 mt-2">
                                                <View><Ionicons name="calendar" size={16} /></View>
                                                <Text className="text-sm  text-gray-600" style={{
                                                    fontFamily: 'Poppins-Regular'
                                                }}>{items.time}</Text>
                                            </View>
                                            <View className="flex items-center flex-row gap-3 mt-2">
                                                <View><Ionicons name="location" size={16} color={'gray'} /></View>
                                                <Text className="text-sm text-gray-600" style={{
                                                    fontFamily: 'Poppins-Regular'
                                                }}>{items.location}</Text>
                                            </View>
                                            <View className="flex flex-row pt-4 justify-center items-center">
                                                <TouchableOpacity className="bg-[#6A9B00] py-2 px-7 w-full rounded-md" onPress={() => routes.push('/CompletedJobDetail')}>
                                                    <Text className="text-white text-center" style={{
                                                        fontFamily: 'Poppins-Medium'
                                                    }} >View Details</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                    ))
                                }
                                {
                                    activeBar === 'Cancelled' && CancelledJobDdetails.map((items) => (
                                        <View key={items.id} className="flex border border-gray-200 mb-7 px-7 py-6 rounded-xl">
                                            <View className="flex flex-row w-[90%] justify-between">
                                                <Text style={{
                                                    fontFamily: 'Poppins-Bold'
                                                }} className=" text-xl mb-2">{items.title}</Text>
                                                <View className="py-0 justify-center items-center flex px-4 bg-gray-100 rounded-xl">
                                                    <Text className="text-sm -red-400">{items.status}</Text>
                                                </View>
                                            </View>
                                            <Text className=" text-gray-700 text-sm" style={{
                                                fontFamily: 'Poppins-Regular'
                                            }}>{items.subtitle}</Text>
                                            <View className="flex items-center flex-row gap-3 mt-2">
                                                <View><Ionicons name="person" size={16} /></View>
                                                <Text className="text-sm text-gray-600" style={{
                                                    fontFamily: 'Poppins-Regular'
                                                }}>{items.name}</Text>
                                            </View>
                                            <View className="flex items-center flex-row gap-3 mt-2">
                                                <View><Ionicons name="calendar" size={16} /></View>
                                                <Text className="text-sm  text-gray-600" style={{
                                                    fontFamily: 'Poppins-Regular'
                                                }}>{items.time}</Text>
                                            </View>
                                            <View className="flex items-center flex-row gap-3 mt-2">
                                                <View><Ionicons name="location" size={16} color={'gray'} /></View>
                                                <Text className="text-sm text-gray-600" style={{
                                                    fontFamily: 'Poppins-Regular'
                                                }}>{items.location}</Text>
                                            </View>
                                            <View className="flex flex-row pt-4 justify-center items-center">
                                                <TouchableOpacity className="bg-[#6A9B00] py-2 px-7 w-full rounded-md">
                                                    <Text className="text-white text-center" style={{
                                                        fontFamily: 'Poppins-Medium'
                                                    }}>View Details</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))
                                }
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </SafeAreaView>
        </SafeAreaProvider>
    )
}