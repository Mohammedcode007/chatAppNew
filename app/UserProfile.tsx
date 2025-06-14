import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    useColorScheme,
    Dimensions,
    SafeAreaView,
    StatusBar,
    ScrollView,
    Modal,
    TextInput,
    Platform,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

// **استيراد مكتبة اختيار الصور**
import * as ImagePicker from 'expo-image-picker';
import { useThemeMode } from '@/context/ThemeContext';
import { useUserProfile } from '@/Hooks/useUserProfile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStatus } from '@/Hooks/useUserStatus';
import BlockedUsersModal from '@/components/BlockedUsersModal';
import { useBlockUser } from '@/Hooks/useBlockUser';
import { useSensitiveInfoUpdater } from '@/Hooks/useSensitiveInfoUpdater';
import { useUserFetcherById } from '@/Hooks/useUserFetcherById';
import { useLocalSearchParams } from 'expo-router';
const windowWidth = Dimensions.get('window').width;



export default function UserProfileScreen() {
    const params = useLocalSearchParams();
    const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId;

    const { darkMode, toggleDarkMode } = useThemeMode();
    const { userData } = useUserFetcherById(userId);

    const theme = {
        bg: darkMode ? '#121212' : '#FFF',
        text: darkMode ? '#FFF' : '#000',
        subText: darkMode ? '#CCC' : '#666',
        card: darkMode ? '#1E1E1E' : '#F5F5F5',
        border: darkMode ? '#333' : '#DDD',
    };


    const handleCopy = (value: string) => {
        Clipboard.setStringAsync(value);
    };



    if (!userData) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
                <Text style={{ color: theme.text, textAlign: 'center', marginTop: 50 }}>جاري تحميل البيانات...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ position: 'relative' }}>
                    <Image source={{ uri: userData.coverUrl || "https://i.pinimg.com/736x/17/1a/6c/171a6c7b6bce25e1664c0d7315251e46.jpg" }} style={styles.coverImage} />

                </View>

                <View style={styles.header}>
                    <TouchableOpacity>
                        <Ionicons name="chevron-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Ionicons name="ellipsis-vertical" size={20} color={theme.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.profileSection}>
                    <View style={{ position: 'relative' }}>
                        <Image source={{ uri: userData.avatarUrl || "https://i.pravatar.cc/150?img=12" }} style={styles.avatar} />

                    </View>
                    <Text style={[styles.name, { color: theme.text }]}>
                        {userData.username}{' '}
                        {userData.verified && (
                            <Ionicons name="checkmark-circle" size={18} color="#007bff" />
                        )}
                    </Text>

                    <Text style={[{ color: theme.subText, fontStyle: 'italic' }]}>
                        {userData.status || 'لا توجد حالة حالية'}
                    </Text>


                    <View style={styles.statsRow}>
                        <Stat label="Posts" value={userData.posts} theme={theme} />
                        <Stat label="Followers" value={userData.followers} theme={theme} />
                        <Stat label="Following" value={userData.following} theme={theme} />
                    </View>

                    <View style={styles.actionRow}>
                        <TouchableOpacity style={[styles.followButton, { backgroundColor: theme.card }]}>
                            <Text style={{ color: '#ee0979' }}>Following</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.messageButton, { backgroundColor: theme.card }]}>
                            <Text style={{ color: theme.text }}>Message</Text>
                        </TouchableOpacity>

                    </View>
                </View>

                <View style={styles.infoBox}>
                    {/* باقي العناصر */}
                    <InfoItem
                        icon="location-outline"
                        label="Country"
                        value={userData.country}
                        theme={theme}
                        onCopy={handleCopy}
                        onEdit={function (): void {
                            throw new Error('Function not implemented.');
                        }} />


                    <InfoItem
                        icon="mail-outline"
                        label="Email"
                        value={userData.email}
                        theme={theme}
                        onCopy={handleCopy}
                        onEdit={function (): void {
                            throw new Error('Function not implemented.');
                        }} />
                    <InfoItem
                        icon="call-outline"
                        label="Phone"
                        value={userData.phone}
                        theme={theme}
                        onCopy={handleCopy}
                        onEdit={function (): void {
                            throw new Error('Function not implemented.');
                        }} />
                    <InfoItem
                        icon="male-female-outline"
                        label="Gender"
                        value={userData.gender}
                        theme={theme}
                        onCopy={handleCopy}
                        onEdit={function (): void {
                            throw new Error('Function not implemented.');
                        }} />
                    <InfoItem
                        icon="calendar-outline"
                        label="Birthday"
                        value={new Date(userData.birthday).toLocaleDateString()}
                        theme={theme}
                        onCopy={handleCopy}
                        onEdit={function (): void {
                            throw new Error('Function not implemented.');
                        }} />
                </View>

                <View style={styles.imagesSection}>
                    <FlatList
                        data={userData.images}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(_, i) => i.toString()}
                        renderItem={({ item }) => (
                            <Image source={{ uri: item }} style={styles.galleryImage} />
                        )}
                    />
                </View>





            </ScrollView>


        </SafeAreaView>
    );
}

const Stat = ({
    label,
    value,
    theme,
}: {
    label: string;
    value: number;
    theme: any;
}) => (
    <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: theme.subText }]}>{label}</Text>
    </View>
);

const InfoItem = ({
    icon,
    label,
    value,
    theme,
    onCopy,
    onEdit,
}: {
    icon: string;
    label: string;
    value: string;
    theme: any;
    onCopy: (val: string) => void;
    onEdit: () => void;
}) => (
    <View style={styles.infoItem}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={22} color={theme.text} />
        <Text style={[styles.infoLabel, { color: theme.text }]}>{label}:</Text>
        <Text style={[styles.infoValue, { color: theme.subText }]}>{value}</Text>

        <TouchableOpacity onPress={() => onCopy(value)} style={styles.iconButton}>
            <Ionicons name="copy-outline" size={20} color={theme.text} />
        </TouchableOpacity>


    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    coverImage: { width: '100%', height: 180 },
    header: {
        marginTop: 10,
        marginHorizontal: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    profileSection: {
        alignItems: 'center',
        marginTop: -60,
        marginHorizontal: 12,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#fff',
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#ee0979',
        borderRadius: 16,
        padding: 4,
        borderWidth: 2,
        borderColor: '#fff',
    },
    editCoverButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(238,9,121,0.8)',
        borderRadius: 20,
        padding: 6,
    },
    name: { fontSize: 15, fontWeight: 'bold', marginTop: 8, alignItems: "center", justifyContent: "center" },
    statsRow: {
        flexDirection: 'row',
        marginTop: 12,

        justifyContent: 'space-between',
        width: '80%',
    },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: 'bold' },
    statLabel: { fontSize: 14 },
    actionRow: {
        marginTop: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    followButton: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        alignItems: 'center',
    },
    messageButton: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        alignItems: 'center',
    },
    infoBox: {
        marginHorizontal: 20,
        marginTop: 25,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },
    infoLabel: {
        fontWeight: 'bold',
        marginLeft: 8,
        width: 90,
    },
    infoValue: {
        flex: 1,
    },
    iconButton: {
        marginHorizontal: 6,
    },
    imagesSection: {
        marginTop: 20,
        marginLeft: 12,
    },
    galleryImage: {
        width: 140,
        height: 140,
        borderRadius: 8,
        marginRight: 12,
    },
    modalBackground: {
        flex: 1,
        backgroundColor: '#000000aa',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    modalContainer: {
        borderRadius: 10,
        padding: 15,
    },
    modalTitle: {
        fontSize: 18,
        marginBottom: 15,
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
    },
    modalButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 10,
        marginHorizontal: 5,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    modalContent: {
        width: '85%',
        borderRadius: 12,
        padding: 20,
    },



    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },

    cancelButton: {
        fontSize: 16,
    },

    saveButton: {
        fontSize: 16,
        fontWeight: 'bold',
    },



});

