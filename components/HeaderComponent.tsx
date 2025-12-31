import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Text, View } from 'react-native'

export default function HeaderComponent({name,onPress}: {name:string,onPress: () => void}) {
    return(
        <View className='flex flex-row   gap-32 item-center '>
            <View>
                <Ionicons name='arrow-back' size={20} onPress={onPress}/>
            </View>
            <Text className='text-xl' style={{
                fontFamily: 'Poppins-Bold'
            }}>
                {name}
            </Text>
        </View>
    )
}
