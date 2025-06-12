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
  ToastAndroid,
  Switch,
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
import { API_URL } from '@/config';
import axios from 'axios';
const windowWidth = Dimensions.get('window').width;



export default function ProfileScreen() {
  const { darkMode, toggleDarkMode } = useThemeMode();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUserData(userData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);
  const theme = {
    bg: darkMode ? '#121212' : '#FFF',
    text: darkMode ? '#FFF' : '#000',
    subText: darkMode ? '#CCC' : '#666',
    card: darkMode ? '#1E1E1E' : '#F5F5F5',
    border: darkMode ? '#333' : '#DDD',
  };

  const [modalVisible, setModalVisible] = useState(false);
  const [currentEditKey, setCurrentEditKey] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [dateValue, setDateValue] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { profile, updateProfile, notifications } = useUserProfile();


  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'online' | 'offline'>('offline');



  // فتح المودال مع تهيئة البيانات حسب نوع الحقل
  const openEditModal = (key: string, currentValue: string) => {
    setCurrentEditKey(key);
    if (key === 'status') {
      setSelectedStatus(currentValue === 'online' ? 'online' : 'offline');
      setStatusModalVisible(true); // نفتح مودال الحالة فقط
      return;
    }
    if (key === 'birthday') {
      const dateParts = currentValue.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const day = parseInt(dateParts[2], 10);
        setDateValue(new Date(year, month, day));
      } else {
        setDateValue(new Date());
      }
      setShowDatePicker(true);
    } else if (key === 'gender') {
      setInputValue(currentValue);
    } else {
      setInputValue(currentValue);
      setShowDatePicker(false);
    }

    setModalVisible(true);
  };
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        if (storedToken) {
          setToken(storedToken);
        }
      } catch (error) {
        console.error('فشل في جلب التوكن:', error);
      }
    };

    fetchToken();
  }, []);


  const { status, error, loading, updateStatus } = useUserStatus('offline');




  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateValue(selectedDate);
    }
  };

  const handleCopy = (value: string) => {
    Clipboard.setStringAsync(value);
    Alert.alert('Copied', 'تم نسخ القيمة إلى الحافظة');
  };

  const pickImage = async (type: 'avatarUrl' | 'coverUrl') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'avatarUrl' ? [1, 1] : [16, 9],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (!uri) return;

        if (type === 'avatarUrl') {
          setUserData((prev: any) => ({
            ...prev,
            avatar: uri,
          }));
        } else if (type === 'coverUrl') {
          setUserData((prev: any) => ({
            ...prev,
            coverUrl: uri,
          }));
        }
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء اختيار الصورة');
    }
  };

  // const editAvatar = () => {
  //   pickImage('avatarUrl');
  // };

  // const editCover = () => {
  //   pickImage('coverUrl');
  // };

  const {
    blockUser,
    unblockUser,
    fetchBlockedUsers,
    isUserBlocked,
    blockedUsers,
  } = useBlockUser();
  useEffect(() => {
    fetchBlockedUsers(); // سيتم تحميل قائمة المحظورين عند فتح شاشة المحادثة
  }, []);
  const [blockedList, setBlockedList] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (blockedUsers && Array.isArray(blockedUsers)) {
      const transformed = blockedUsers.map((user) => ({
        id: user.id,
        name: user.name,
      }));
      setBlockedList(transformed);
    }
  }, [blockedUsers]);
  const [modalVisibleBlock, setModalVisibleBlock] = useState(false);


  const handleUnblock = (userId: string) => {
    setBlockedList((prev) => prev.filter((user) => user.id !== userId));
    unblockUser(userId); // استدعاء دالة رفع الحظر
  };

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState('');

  const {
    updateSensitiveInfo,
    successMessage,
    errorMessage,
  } = useSensitiveInfoUpdater();

  useEffect(() => {
    if (successMessage) {
      Alert.alert('✅ نجاح', successMessage);
    } else if (errorMessage) {
      Alert.alert('❌ خطأ', errorMessage);
    }
  }, [successMessage, errorMessage]);

  const handleEdit = (key: string) => {
    setCurrentEditKey(key);
    if (key === 'birthday') {
      setDateValue(userData.birthday ? new Date(userData.birthday) : new Date());
    } else {
      setInputValue(userData[key] || '');
    }
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!currentEditKey) return;

    if (currentEditKey === 'birthday') {
      setPasswordModalVisible(true); // نطلب كلمة المرور قبل التعديل
    } else {
      if (inputValue.trim() === '') {
        Alert.alert('خطأ', 'القيمة لا يمكن أن تكون فارغة');
        return;
      }
      setPasswordModalVisible(true); // نطلب كلمة المرور قبل التعديل
    }
  };
  const [rememberPassword, setRememberPassword] = useState(false);
  const [savedPassword, setSavedPassword] = useState<string | null>(null);

  // const handleConfirmPasswordAndSave = () => {
  //   if (!enteredPassword) {
  //     Alert.alert('خطأ', 'يرجى إدخال كلمة المرور');
  //     return;
  //   }

  //   if (!currentEditKey) return;

  //   if (currentEditKey === 'birthday') {
  //     const y = dateValue.getFullYear();
  //     const m = (dateValue.getMonth() + 1).toString().padStart(2, '0');
  //     const d = dateValue.getDate().toString().padStart(2, '0');
  //     const formattedDate = `${y}-${m}-${d}`;

  //     setUserData((prev: any) => {
  //       const updated = { ...prev, birthday: formattedDate };
  //       updateSensitiveInfo(enteredPassword, { birthday: formattedDate });
  //       return updated;
  //     });
  //   } else {
  //     setUserData((prev: any) => {
  //       const updated = { ...prev, [currentEditKey]: inputValue };

  //       const sensitiveKeys = ['email', 'phone', 'password', 'gender', 'country', 'avatarUrl', 'coverUrl'];
  //       if (sensitiveKeys.includes(currentEditKey)) {
  //         updateSensitiveInfo(enteredPassword, { [currentEditKey]: inputValue });
  //       }

  //       return updated;
  //     });
  //   }

  //   setPasswordModalVisible(false);
  //   setModalVisible(false);
  //   setEnteredPassword('');
  // };

  const handleConfirmPasswordAndSave = () => {
    const passwordToUse = enteredPassword || savedPassword;

    if (!passwordToUse) {
      Alert.alert('خطأ', 'يرجى إدخال كلمة المرور');
      return;
    }

    if (!currentEditKey) return;

    if (currentEditKey === 'birthday') {
      const y = dateValue.getFullYear();
      const m = (dateValue.getMonth() + 1).toString().padStart(2, '0');
      const d = dateValue.getDate().toString().padStart(2, '0');
      const formattedDate = `${y}-${m}-${d}`;

      setUserData((prev: any) => {
        const updated = { ...prev, birthday: formattedDate };
        updateSensitiveInfo(passwordToUse, { birthday: formattedDate });
        return updated;
      });
    } else {
      setUserData((prev: any) => {
        const updated = { ...prev, [currentEditKey]: inputValue };

        const sensitiveKeys = ['email', 'phone', 'password', 'gender', 'country', 'avatarUrl', 'coverUrl'];
        if (sensitiveKeys.includes(currentEditKey)) {
          updateSensitiveInfo(passwordToUse, { [currentEditKey]: inputValue });
        }

        return updated;
      });
    }

    if (rememberPassword && enteredPassword) {
      setSavedPassword(enteredPassword); // احفظ الكلمة
    }

    setPasswordModalVisible(false);
    setModalVisible(false);
    setEnteredPassword('');
  };

  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<'avatarUrl' | 'coverUrl' | null>(null);


  const uploadFile = async (uri: string, type: 'image' | 'sound'): Promise<string | null> => {
    if (!uri || typeof uri !== 'string') {
      console.error('URI غير صالح أو غير موجود:', uri);
      return null;
    }

    try {
      const fileExt = uri.split('.').pop() || (type === 'sound' ? 'm4a' : 'jpg');
      const mimeType = type === 'image' ? `image/${fileExt}` : `audio/${fileExt}`;

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: `upload.${fileExt}`,
        type: mimeType,
      } as any);

      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 200 && response.data?.url) {
        return response.data.url;
      } else {
        console.error('فشل رفع الملف:', response.data);
        return null;
      }
    } catch (error) {
      console.error('خطأ أثناء رفع الملف:', error);
      return null;
    }
  };

  const handleEditAvatarPress = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        ToastAndroid.show('يجب منح صلاحية الوصول للصور', ToastAndroid.SHORT);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (typeof uri === 'string') {
          await editAvatar(uri);
        } else {
          console.warn('URI الناتج ليس نصاً:', uri);
          ToastAndroid.show('فشل في اختيار الصورة', ToastAndroid.SHORT);
        }
      }
    } catch (error) {
      console.error('خطأ أثناء اختيار الصورة:', error);
      ToastAndroid.show('حدث خطأ أثناء اختيار الصورة', ToastAndroid.SHORT);
    }
  };



  const handleEditCoverPress = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        ToastAndroid.show('يجب منح صلاحية الوصول للصور', ToastAndroid.SHORT);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (typeof uri === 'string') {
          await editCover(uri);
        } else {
          console.warn('URI الناتج ليس نصاً:', uri);
          ToastAndroid.show('فشل في اختيار الصورة', ToastAndroid.SHORT);
        }
      }
    } catch (error) {
      console.error('خطأ أثناء اختيار صورة الغلاف:', error);
      ToastAndroid.show('حدث خطأ أثناء اختيار صورة الغلاف', ToastAndroid.SHORT);
    }
  };


  const editCover = async (uri: string) => {
    if (!enteredPassword) {
      setPendingImageUri(uri);
      setPendingKey('coverUrl');
      setPasswordModalVisible(true);
      return;
    }

    try {
      ToastAndroid.show('📤 جاري رفع صورة الغلاف...', ToastAndroid.SHORT);
      const uploadedUrl = await uploadFile(uri, 'image');
      if (!uploadedUrl) throw new Error('فشل رفع صورة الغلاف');

      updateSensitiveInfo(enteredPassword, { coverUrl: uploadedUrl });
      pickImage('coverUrl');

      ToastAndroid.show('✅ تم تحديث صورة الغلاف بنجاح', ToastAndroid.SHORT);
    } catch (error) {
      console.error('❌ خطأ في تعديل صورة الغلاف:', error);
      ToastAndroid.show('فشل في تحديث صورة الغلاف', ToastAndroid.SHORT);
    }
  };


  const editAvatar = async (uri: string) => {
    if (!enteredPassword) {
      setPendingImageUri(uri);
      setPendingKey('avatarUrl');
      setPasswordModalVisible(true);
      return;
    }

    try {
      ToastAndroid.show('📤 جاري رفع الصورة الشخصية...', ToastAndroid.SHORT);
      const uploadedUrl = await uploadFile(uri, 'image');
      if (!uploadedUrl) throw new Error('فشل رفع الصورة');

      updateSensitiveInfo(enteredPassword, { avatarUrl: uploadedUrl });
      pickImage('avatarUrl');

      ToastAndroid.show('✅ تم تحديث الصورة الشخصية بنجاح', ToastAndroid.SHORT);
    } catch (error) {
      console.error('❌ خطأ في تعديل الصورة الشخصية:', error);
      ToastAndroid.show('فشل في تحديث الصورة الشخصية', ToastAndroid.SHORT);
    }
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
          {/* زر تعديل صورة الكوفر */}
          <TouchableOpacity
            style={styles.editCoverButton}
            onPress={handleEditCoverPress}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={24} color="#FFF" />
          </TouchableOpacity>
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
            {/* زر تعديل صورة الأفاتار */}
            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={handleEditAvatarPress}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }} onPress={() => openEditModal('username', userData.username)}>
            <Text style={[styles.name, { color: theme.text }]}>
              {userData.username}{' '}
              {userData.verified && (
                <Ionicons name="checkmark-circle" size={18} color="#007bff" />
              )}
              <Ionicons name="create-outline" size={16} color={theme.text} />
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => openEditModal('status', userData.status || '')}
            style={{ marginTop: 5, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
          >
            <Text style={[{ color: theme.subText, fontStyle: 'italic' }]}>
              {userData.status || 'لا توجد حالة حالية'}
              <Ionicons name="create-outline" size={14} color={theme.subText} />
            </Text>
          </TouchableOpacity>


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
            <TouchableOpacity onPress={() => setModalVisibleBlock(true)}
              style={[styles.messageButton, { backgroundColor: theme.card }]}>
              <Text style={{ color: theme.text }}>Blocked</Text>
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
            onEdit={() => openEditModal('country', userData.country)}
          />


          <InfoItem
            icon="mail-outline"
            label="Email"
            value={userData.email}
            theme={theme}
            onCopy={handleCopy}
            onEdit={() => openEditModal('email', userData.email)}
          />
          <InfoItem
            icon="call-outline"
            label="Phone"
            value={userData.phone}
            theme={theme}
            onCopy={handleCopy}
            onEdit={() => openEditModal('phone', userData.phone)}
          />
          <InfoItem
            icon="male-female-outline"
            label="Gender"
            value={userData.gender}
            theme={theme}
            onCopy={handleCopy}
            onEdit={() => openEditModal('gender', userData.gender)}
          />
          <InfoItem
            icon="calendar-outline"
            label="Birthday"
            value={userData.birthday}
            theme={theme}
            onCopy={handleCopy}
            onEdit={() => openEditModal('birthday', userData.birthday)}
          />
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

        {/* مودال التعديل */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalBackground}>
            <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                تعديل {currentEditKey}
              </Text>

              {currentEditKey === 'birthday' && showDatePicker ? (
                <DateTimePicker
                  value={dateValue}
                  mode="date"
                  display="spinner"
                  onChange={onChangeDate}
                  style={{ width: '100%' }}
                />
              ) : currentEditKey === 'gender' ? (
                <Picker
                  selectedValue={inputValue}
                  onValueChange={(v) => setInputValue(v)}
                  style={{ width: '100%', height: 50, color: theme.text }}
                >
                  <Picker.Item label="Male" value="Male" />
                  <Picker.Item label="Female" value="Female" />
                  <Picker.Item label="Other" value="Other" />
                </Picker>
              ) : (
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                  value={inputValue}
                  onChangeText={setInputValue}
                  autoFocus
                />
              )}

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={[styles.modalButton, { backgroundColor: '#ccc' }]}
                >
                  <Text>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  style={[styles.modalButton, { backgroundColor: '#4CAF50' }]}
                >
                  <Text style={{ color: '#fff' }}>حفظ</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <Modal visible={statusModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.bg }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>اختر حالتك</Text>
              <Picker
                selectedValue={selectedStatus}
                onValueChange={(itemValue) => setSelectedStatus(itemValue)}
                style={{ color: theme.text }}
              >
                <Picker.Item label="متصل (online)" value="online" />
                <Picker.Item label="غير متصل (offline)" value="offline" />
              </Picker>

              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                  <Text style={[styles.cancelButton, { color: 'red' }]}>إلغاء</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setUserData((prev: any) => {
                      const updated = { ...prev, status: selectedStatus };
                      if (!token) {
                        Alert.alert('خطأ', 'التوكن غير موجود');
                        return prev;
                      }
                      updateStatus(selectedStatus, token);
                      return updated;
                    });
                    setStatusModalVisible(false);
                  }}
                >
                  <Text style={[styles.saveButton, { color: theme.text }]}>حفظ</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <BlockedUsersModal
          visible={modalVisibleBlock}
          onClose={() => setModalVisibleBlock(false)}
          blockedUsers={blockedList}
          onUnblock={handleUnblock}
          theme={theme} />

      </ScrollView>
      <Modal visible={passwordModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>تأكيد كلمة المرور</Text>

            <TextInput
              placeholder="أدخل كلمة المرور"
              secureTextEntry
              placeholderTextColor={theme.subText}
              value={enteredPassword}
              onChangeText={setEnteredPassword}
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            />

            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
              <Switch
                value={rememberPassword}
                onValueChange={setRememberPassword}
                thumbColor={rememberPassword ? '#2196F3' : '#ccc'}
              />
              <Text style={{ marginLeft: 8, color: theme.text }}>تذكرني</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)} style={styles.modalButton}>
                <Text style={{ color: 'red' }}>إلغاء</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setPasswordModalVisible(false);

                  if (pendingImageUri && pendingKey === 'avatarUrl') {
                    editAvatar(pendingImageUri);
                  } else if (pendingImageUri && pendingKey === 'coverUrl') {
                    editCover(pendingImageUri);
                  }

                  handleConfirmPasswordAndSave();
                }}
                style={styles.modalButton}
              >
                <Text style={{ color: 'green' }}>تأكيد</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


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

    <TouchableOpacity onPress={onEdit} style={styles.iconButton}>
      <Ionicons name="create-outline" size={20} color={theme.text} />
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

