
// import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TextInput,
//   TouchableOpacity,
//   FlatList,
//   Image,
//   Alert,
//   I18nManager,
//   ActivityIndicator,
//   Modal,
//   Platform,
//   ScrollView,
//   SafeAreaView,
// } from 'react-native';
// import { useNavigation } from 'expo-router';

// import { Ionicons } from '@expo/vector-icons';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as ImagePicker from 'expo-image-picker';
// import { useThemeMode } from '@/context/ThemeContext';
// import { useUpdateGroupRole } from '@/Hooks/useUpdateGroupRole';
// import { useGroupMembers } from '@/Hooks/useGroupMembers';

// interface Member {
//   id: string;
//   name: string;
//   avatar: string;
//   role: 'owner' | 'admin' | 'member' | 'none' | 'ban';
//   isAdmin?: boolean;  // لتبسيط حالة المسؤولية في الواجهة
// }

// interface Group {
//   id: string;
//   name: string;
//   description?: string;
//   avatar?: string;
//   members: Member[];
//   password?: string;   // كلمة السر، اختياري
//   isLocked?: boolean;  // هل المجموعة مقفلة
// }
// function getFirstParam(param: string | string[] | undefined): string {
//   if (!param) return '';        // إذا غير موجود
//   if (Array.isArray(param)) {
//     return param[0];            // إذا مصفوفة خذ أول عنصر فقط
//   }
//   return param;                 // إذا string
// }


// export default function GroupSettingsScreen() {
//   const router = useRouter();
//   const params = useLocalSearchParams();
// const { userId, groupId, settingId } = params;

// const userIdStr = getFirstParam(userId);
// const groupIdStr = getFirstParam(groupId);
// const settingIdStr = getFirstParam(settingId);
//   const navigation = useNavigation();
//   const { loading: updateRoleLoading, error, successMessage, updateGroupRole } = useUpdateGroupRole();


//   const [targetUserId, setTargetUserId] = useState('');
//   const [roleType, setRoleType] = useState<'admin' | 'owner' | 'block'>('admin');
//   const [roleAction, setRoleAction] = useState<'add' | 'remove'>('add');

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//  const success = await updateGroupRole({
//   groupId: groupIdStr,
//   actorUserId: userIdStr,
//   targetUserId,
//   roleType,
//   roleAction,
// });

//     if (success) {
//       // يمكنك تنفيذ إجراءات إضافية هنا بعد نجاح التحديث
//       alert('تم تحديث صلاحية العضو بنجاح');
//     }
//   };
//  const { members, loading: loadingMembers, error: membersError } = useGroupMembers(groupIdStr);
//   console.log(members, 'members23');
//   useLayoutEffect(() => {
//     navigation.setOptions({ headerShown: false });
//   }, []);
//   // حالة المجموعة
//   const [group, setGroup] = useState<Group>({
//     id: params.id,
//     name: params.name || '',
//     description: '',
//     avatar: '',
//     members: [
//       { id: 'u1', name: 'Mohamed', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', role: 'owner', isAdmin: true },
//       { id: 'u2', name: 'Aya', avatar: 'https://randomuser.me/api/portraits/women/45.jpg', role: 'admin', isAdmin: true },
//       { id: 'u3', name: 'Ali', avatar: 'https://randomuser.me/api/portraits/men/12.jpg', role: 'member', isAdmin: false },
//       { id: 'u4', name: 'Mohamed', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', role: 'owner', isAdmin: true },
//       { id: 'u5', name: 'Aya', avatar: 'https://randomuser.me/api/portraits/women/45.jpg', role: 'admin', isAdmin: true },
//       { id: 'u6', name: 'Ali', avatar: 'https://randomuser.me/api/portraits/men/12.jpg', role: 'member', isAdmin: false },
//     ],
//   });

//   const [password, setPassword] = useState<string>('');
//   const [isLocked, setIsLocked] = useState<boolean>(false);
//   const [language, setLanguage] = useState('en');
//   const [searchText, setSearchText] = useState('');
//   const [filteredMembers, setFilteredMembers] = useState<Member[]>(group.members);
//   const [loading, setLoading] = useState(false);
//   const [unsavedChanges, setUnsavedChanges] = useState(false);
//   const [inviteModalVisible, setInviteModalVisible] = useState(false);
//   const { darkMode } = useThemeMode();

//   const isRTL = language === 'ar';

//   const originalGroupRef = useRef(group);

//   useEffect(() => {
//     const getStoredLang = async () => {
//       const lang = await AsyncStorage.getItem('appLanguage');
//       if (lang) {
//         setLanguage(lang);
//         I18nManager.forceRTL(lang === 'ar');
//       }
//     };
//     getStoredLang();
//   }, []);

//   useEffect(() => {
//     if (!searchText.trim()) {
//       setFilteredMembers(group.members);
//     } else {
//       const filtered = group.members.filter((m) =>
//         m.name.toLowerCase().includes(searchText.toLowerCase())
//       );
//       setFilteredMembers(filtered);
//     }
//   }, [searchText, group.members]);

//   useEffect(() => {
//     const changed =
//       JSON.stringify(group) !== JSON.stringify(originalGroupRef.current);
//     setUnsavedChanges(changed);
//   }, [group]);

//   const pickImage = async (fromCamera: boolean) => {
//     try {
//       let permissionResult;
//       if (fromCamera) {
//         permissionResult = await ImagePicker.requestCameraPermissionsAsync();
//       } else {
//         permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
//       }

//       if (!permissionResult.granted) {
//         Alert.alert(isRTL ? 'الصلاحيات مرفوضة' : 'Permission denied');
//         return;
//       }

//       let result;
//       if (fromCamera) {
//         result = await ImagePicker.launchCameraAsync({
//           allowsEditing: true,
//           aspect: [1, 1],
//           quality: 0.7,
//         });
//       } else {
//         result = await ImagePicker.launchImageLibraryAsync({
//           mediaTypes: ImagePicker.MediaTypeOptions.Images,
//           allowsEditing: true,
//           aspect: [1, 1],
//           quality: 0.7,
//         });
//       }

//       if (!result.canceled && result.assets.length > 0) {
//         setGroup((prev) => ({ ...prev, avatar: result.assets[0].uri }));
//       }
//     } catch (error) {
//       Alert.alert(isRTL ? 'حدث خطأ' : 'An error occurred');
//     }
//   };

//   const confirmExit = () => {
//     if (unsavedChanges) {
//       Alert.alert(
//         isRTL ? 'تغييرات غير محفوظة' : 'Unsaved changes',
//         isRTL
//           ? 'هل ترغب في حفظ التغييرات قبل الخروج؟'
//           : 'Do you want to save changes before exiting?',
//         [
//           {
//             text: isRTL ? 'لا' : 'No',
//             style: 'destructive',
//             onPress: () => router.back(),
//           },
//           {
//             text: isRTL ? 'نعم' : 'Yes',
//             onPress: () => {
//               handleSave();
//             },
//           },
//           { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
//         ]
//       );
//     } else {
//       router.back();
//     }
//   };

//   const removeMember = (id: string) => {
//     Alert.alert(
//       isRTL ? 'تأكيد' : 'Confirm',
//       isRTL
//         ? 'هل أنت متأكد من إزالة هذا العضو؟'
//         : 'Are you sure you want to remove this member?',
//       [
//         { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
//         {
//           text: isRTL ? 'إزالة' : 'Remove',
//           style: 'destructive',
//           onPress: () => {
//             setGroup((prev) => ({
//               ...prev,
//               members: prev.members.filter((m) => m.id !== id),
//             }));
//           },
//         },
//       ]
//     );
//   };

//   const promoteToAdmin = (id: string) => {
//     setGroup((prev) => ({
//       ...prev,
//       members: prev.members.map((m) =>
//         m.id === id ? { ...m, isAdmin: !m.isAdmin } : m
//       ),
//     }));
//   };

//   const handleRefresh = () => {
//     setLoading(true);
//     setTimeout(() => {
//       setLoading(false);
//       Alert.alert(isRTL ? 'تم التحديث' : 'Refreshed');
//     }, 1000);
//   };

//   const openInviteModal = () => {
//     setInviteModalVisible(true);
//   };

//   const closeInviteModal = () => {
//     setInviteModalVisible(false);
//   };

//   const inviteLink = `https://app.example.com/join-group/${group.id}`;

//   const currentUserId = 'u1'; // المستخدم الحالي (مثال)
//   const currentUser = group.members.find((m) => m.id === currentUserId);
//   const isCurrentUserAdmin = currentUser?.isAdmin === true;

//   const handleSave = () => {
//     setLoading(true);
//     setTimeout(() => {
//       originalGroupRef.current = { ...group, password, isLocked };
//       setUnsavedChanges(false);
//       setLoading(false);
//       Alert.alert(isRTL ? 'تم الحفظ' : 'Saved');
//       router.back();
//     }, 1500);
//   };

//   return (
//     <SafeAreaView
//       style={[
//         styles.container,
//         darkMode ? styles.containerDark : styles.containerLight,
//         isRTL && { flexDirection: 'row-reverse' },
//       ]}
//     >
//       <Text style={[styles.header, darkMode ? styles.textLight : styles.textDark]}>
//         {isRTL ? 'إعدادات المجموعة' : 'Group Settings'}
//       </Text>

//       <TouchableOpacity
//         style={styles.avatarContainer}
//         onPress={() => {
//           Alert.alert(
//             isRTL ? 'اختر مصدر الصورة' : 'Select Image Source',
//             '',
//             [
//               { text: isRTL ? 'الكاميرا' : 'Camera', onPress: () => pickImage(true) },
//               { text: isRTL ? 'المعرض' : 'Gallery', onPress: () => pickImage(false) },
//               { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
//             ]
//           );
//         }}
//       >
//         {group.avatar ? (
//           <Image source={{ uri: group.avatar }} style={styles.avatar} />
//         ) : (
//           <View
//             style={[
//               styles.avatarPlaceholder,
//               darkMode ? styles.avatarPlaceholderDark : styles.avatarPlaceholderLight,
//             ]}
//           >
//             <Ionicons name="camera" size={40} color="#888" />
//             <Text style={darkMode ? styles.textLight : styles.textDark}>
//               {isRTL ? 'صورة المجموعة' : 'Group Image'}
//             </Text>
//           </View>
//         )}
//       </TouchableOpacity>

//       <TextInput
//         placeholder={isRTL ? 'اسم المجموعة' : 'Group Name'}
//         style={[
//           styles.input,
//           darkMode ? styles.inputDark : styles.inputLight,
//           isRTL && { textAlign: 'right' },
//         ]}
//         value={group.name}
//         onChangeText={(text) => setGroup((prev) => ({ ...prev, name: text }))}
//       />

//       <TextInput
//         placeholder={isRTL ? 'الوصف (اختياري)' : 'Description (Optional)'}
//         style={[
//           styles.input,
//           darkMode ? styles.inputDark : styles.inputLight,
//           isRTL && { textAlign: 'right' },
//           { height: 80, textAlignVertical: 'top' },
//         ]}
//         multiline
//         numberOfLines={4}
//         value={group.description}
//         onChangeText={(text) => setGroup((prev) => ({ ...prev, description: text }))}
//       />

//       {/* كلمة السر والقفل */}
//       <View style={styles.row}>
//         <Text style={[styles.label, darkMode ? styles.textLight : styles.textDark]}>
//           {isRTL ? 'قفل المجموعة' : 'Lock Group'}
//         </Text>
//         <TouchableOpacity
//           onPress={() => setIsLocked(!isLocked)}
//           style={[
//             styles.lockToggle,
//             isLocked ? styles.locked : styles.unlocked,
//           ]}
//         >
//           <Ionicons
//             name={isLocked ? 'lock-closed' : 'lock-open'}
//             size={24}
//             color="#fff"
//           />
//         </TouchableOpacity>
//       </View>

//       {isLocked && (
//         <TextInput
//           placeholder={isRTL ? 'كلمة السر' : 'Password'}
//           style={[
//             styles.input,
//             darkMode ? styles.inputDark : styles.inputLight,
//             isRTL && { textAlign: 'right' },
//           ]}
//           secureTextEntry
//           value={password}
//           onChangeText={setPassword}
//         />
//       )}

//       {/* البحث عن الأعضاء */}
//       <TextInput
//         placeholder={isRTL ? 'بحث في الأعضاء' : 'Search Members'}
//         style={[
//           styles.input,
//           darkMode ? styles.inputDark : styles.inputLight,
//           isRTL && { textAlign: 'right' },
//           { marginTop: 10 },
//         ]}
//         value={searchText}
//         onChangeText={setSearchText}
//       />
//       {/* قائمة الأعضاء */}
//       <FlatList
//         data={filteredMembers}
//         keyExtractor={(item) => item.id}
//         refreshing={loading}
//         onRefresh={handleRefresh}
//         style={{ flexGrow: 0, maxHeight: 250 }}
//         renderItem={({ item }) => (
//           <View
//             style={[
//               styles.memberRow,
//               darkMode ? styles.memberRowDark : styles.memberRowLight,
//               isRTL && { flexDirection: 'row-reverse' },
//             ]}
//           >
//             <Image source={{ uri: item.avatar }} style={styles.memberAvatar} />
//             <View style={{ flex: 1, marginHorizontal: 10 }}>
//               <Text
//                 style={[
//                   styles.memberName,
//                   darkMode ? styles.textLight : styles.textDark,
//                   isRTL && { textAlign: 'right' },
//                 ]}
//               >
//                 {item.name}
//               </Text>
//               <Text
//                 style={[
//                   styles.memberRole,
//                   darkMode ? styles.textLightSecondary : styles.textDarkSecondary,
//                   isRTL && { textAlign: 'right' },
//                 ]}
//               >
//                 {item.role === 'owner'
//                   ? isRTL ? 'مالك' : 'Owner'
//                   : item.role === 'admin'
//                     ? isRTL ? 'مسؤول' : 'Admin'
//                     : item.role === 'ban'
//                       ? isRTL ? 'محظور' : 'Banned'
//                       : isRTL ? 'عضو' : 'Member'}
//               </Text>
//             </View>

//             {/* أزرار التحكم */}
//             {isCurrentUserAdmin && item.id !== currentUserId && item.role !== 'owner' && (
//               <View style={styles.controls}>
//                 <TouchableOpacity
//                   onPress={() => promoteToAdmin(item.id)}
//                   style={[
//                     styles.controlButton,
//                     item.isAdmin ? styles.adminActive : styles.adminInactive,
//                   ]}
//                 >
//                   <Ionicons name="shield-checkmark" size={20} color="#fff" />
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                   onPress={() => removeMember(item.id)}
//                   style={[styles.controlButton, styles.removeButton]}
//                 >
//                   <Ionicons name="trash" size={20} color="#fff" />
//                 </TouchableOpacity>
//               </View>
//             )}
//           </View>
//         )}
//         ListEmptyComponent={() => (
//           <Text style={[styles.emptyText, darkMode ? styles.textLight : styles.textDark]}>
//             {isRTL ? 'لا يوجد أعضاء' : 'No members found'}
//           </Text>
//         )}
//       />

//       {/* دعوات */}
//       <TouchableOpacity style={styles.inviteButton} onPress={openInviteModal}>
//         <Ionicons name="person-add" size={24} color="#fff" />
//         <Text style={styles.inviteButtonText}>
//           {isRTL ? 'دعوة أعضاء' : 'Invite Members'}
//         </Text>
//       </TouchableOpacity>

//       {/* حفظ والتراجع */}
//       <View style={styles.buttonsRow}>
//         <TouchableOpacity
//           onPress={confirmExit}
//           style={[styles.button, styles.cancelButton]}
//           disabled={loading}
//         >
//           <Text style={styles.buttonText}>{isRTL ? 'إلغاء' : 'Cancel'}</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           onPress={handleSave}
//           style={[styles.button, styles.saveButton]}
//           disabled={loading || !unsavedChanges}
//         >
//           {loading ? (
//             <ActivityIndicator color="#fff" />
//           ) : (
//             <Text style={styles.buttonText}>{isRTL ? 'حفظ' : 'Save'}</Text>
//           )}
//         </TouchableOpacity>
//       </View>

//       {/* مودال دعوة الأعضاء */}
//       <Modal
//         visible={inviteModalVisible}
//         animationType="slide"
//         transparent
//         onRequestClose={closeInviteModal}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={[styles.modalContainer, darkMode ? styles.containerDark : styles.containerLight]}>
//             <Text style={[styles.modalTitle, darkMode ? styles.textLight : styles.textDark]}>
//               {isRTL ? 'رابط الدعوة' : 'Invite Link'}
//             </Text>
//             <Text selectable style={[styles.inviteLink, darkMode ? styles.textLight : styles.textDark]}>
//               {inviteLink}
//             </Text>

//             <TouchableOpacity
//               onPress={() => {
//                 // نسخ الرابط للحافظة
//                 navigator.clipboard.writeText(inviteLink);
//                 Alert.alert(isRTL ? 'تم النسخ' : 'Copied to clipboard');
//               }}
//               style={styles.copyButton}
//             >
//               <Ionicons name="copy" size={20} color="#fff" />
//               <Text style={styles.copyButtonText}>{isRTL ? 'نسخ' : 'Copy'}</Text>
//             </TouchableOpacity>

//             <TouchableOpacity onPress={closeInviteModal} style={styles.closeModalButton}>
//               <Text style={[styles.closeModalText, darkMode ? styles.textLight : styles.textDark]}>
//                 {isRTL ? 'إغلاق' : 'Close'}
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>

//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//   },
//   containerLight: {
//     backgroundColor: '#fff',
//   },
//   containerDark: {
//     backgroundColor: '#121212',
//   },
//   header: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     marginBottom: 12,
//     alignSelf: 'center',
//   },
//   textDark: {
//     color: '#222',
//   },
//   textLight: {
//     color: '#eee',
//   },
//   textDarkSecondary: {
//     color: '#555',
//   },
//   textLightSecondary: {
//     color: '#bbb',
//   },
//   avatarContainer: {
//     alignSelf: 'center',
//     marginBottom: 12,
//   },
//   avatar: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//   },
//   avatarPlaceholder: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     borderWidth: 2,
//     borderColor: '#ccc',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   avatarPlaceholderLight: {
//     backgroundColor: '#f0f0f0',
//   },
//   avatarPlaceholderDark: {
//     backgroundColor: '#333',
//     borderColor: '#555',
//   },
//   input: {
//     borderWidth: 1,
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     paddingVertical: Platform.OS === 'ios' ? 14 : 10,
//     marginVertical: 6,
//     fontSize: 16,
//   },
//   inputLight: {
//     borderColor: '#ccc',
//     color: '#222',
//   },
//   inputDark: {
//     borderColor: '#555',
//     color: '#eee',
//   },
//   row: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginVertical: 6,
//   },
//   label: {
//     fontSize: 18,
//   },
//   lockToggle: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   locked: {
//     backgroundColor: '#e74c3c',
//   },
//   unlocked: {
//     backgroundColor: '#27ae60',
//   },
//   memberRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 6,
//     paddingHorizontal: 8,
//     borderRadius: 8,
//     marginVertical: 2,
//   },
//   memberRowLight: {
//     backgroundColor: '#f9f9f9',
//   },
//   memberRowDark: {
//     backgroundColor: '#222',
//   },
//   memberAvatar: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//   },
//   memberName: {
//     fontWeight: '600',
//     fontSize: 16,
//   },
//   memberRole: {
//     fontSize: 13,
//     fontStyle: 'italic',
//   },
//   controls: {
//     flexDirection: 'row',
//     gap: 10,
//   },
//   controlButton: {
//     padding: 6,
//     borderRadius: 6,
//     marginHorizontal: 4,
//   },
//   adminActive: {
//     backgroundColor: '#2980b9',
//   },
//   adminInactive: {
//     backgroundColor: '#95a5a6',
//   },
//   removeButton: {
//     backgroundColor: '#c0392b',
//   },
//   emptyText: {
//     fontStyle: 'italic',
//     textAlign: 'center',
//     marginTop: 12,
//   },
//   inviteButton: {
//     flexDirection: 'row',
//     backgroundColor: '#34495e',
//     paddingVertical: 12,
//     borderRadius: 8,
//     marginTop: 16,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   inviteButtonText: {
//     color: '#fff',
//     fontWeight: '600',
//     marginLeft: 8,
//     fontSize: 16,
//   },
//   buttonsRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 20,
//   },
//   button: {
//     flex: 1,
//     paddingVertical: 14,
//     marginHorizontal: 8,
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   cancelButton: {
//     backgroundColor: '#7f8c8d',
//   },
//   saveButton: {
//     backgroundColor: '#27ae60',
//   },
//   buttonText: {
//     color: '#fff',
//     fontWeight: '700',
//     fontSize: 18,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: '#000000aa',
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//   },
//   modalContainer: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 20,
//     width: '100%',
//     maxWidth: 400,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 12,
//     textAlign: 'center',
//   },
//   inviteLink: {
//     fontSize: 16,
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   copyButton: {
//     flexDirection: 'row',
//     backgroundColor: '#2980b9',
//     padding: 12,
//     borderRadius: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   copyButtonText: {
//     color: '#fff',
//     marginLeft: 8,
//     fontWeight: '600',
//   },
//   closeModalButton: {
//     alignItems: 'center',
//     padding: 10,
//   },
//   closeModalText: {
//     fontSize: 18,
//     fontWeight: '600',
//   },
// });
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useFetchGroupDetails } from '@/Hooks/useFetchGroupDetails';
import { useUpdateGroupRole } from '@/Hooks/useUpdateGroupRole';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';


function getFirstParam(param: string | string[] | undefined): string {
  if (!param) return '';
  if (Array.isArray(param)) return param[0];
  return param;
}

export default function GroupSettingsScreen() {
  const params = useLocalSearchParams();
  const groupId = getFirstParam(params.groupId);

  const { groupDetails, loading, error, fetchGroupDetails } = useFetchGroupDetails();

  const {
    loading: updatingRole,
    error: roleError,
    successMessage,
    updateGroupRole,
  } = useUpdateGroupRole();

  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [modalVisible, setModalVisible] = useState(false);

  const [userData, setUserData] = useState<any>(null);
  const [editedDescription, setEditedDescription] = useState('');
  const [editedWelcomeMessage, setEditedWelcomeMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [groupStatus, setGroupStatus] = useState<'public' | 'private'>('public');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (groupDetails) {
      setGroupStatus(groupDetails.isPublic ? 'public' : 'private');
      setPassword(groupDetails.password || '');
    }
  }, [groupDetails]);
  useEffect(() => {
    if (groupDetails) {
      setEditedDescription(groupDetails.description || '');
      setEditedWelcomeMessage(groupDetails.welcomeMessageText || '');
    }
  }, [groupDetails]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const parsedUserData = JSON.parse(userDataString);
          setUserData(parsedUserData);
        }
      } catch (error) {
        console.error('حدث خطأ أثناء جلب بيانات المستخدم:', error);
      }
    };
    fetchUserData();
  }, []);

  const currentUserId = userData?._id;
  let currentUserRole = 'member';

  if (groupDetails?.creator?._id === currentUserId) {
    currentUserRole = 'creator';
  } else if (groupDetails?.owners?.some((owner: any) => owner._id === currentUserId)) {
    currentUserRole = 'owner';
  } else if (groupDetails?.admins?.some((admin: any) => admin._id === currentUserId)) {
    currentUserRole = 'admin';
  } else if (groupDetails?.blocked?.some((blocked: any) => blocked._id === currentUserId)) {
    currentUserRole = 'blocked';
  }

  useEffect(() => {
    if (groupId) {
      fetchGroupDetails(groupId);
    }
  }, [groupId]);


  const openRoleModal = (member: any) => {
    setSelectedUser(member);
    setModalVisible(true);
  };


  const handleUpdateRole = async (
    roleType: 'admin' | 'owner' | 'block',
    roleAction: 'add' | 'remove'
  ) => {
    if (!selectedUser || !groupId || !currentUserId || !currentUserRole) return;

    // Prevent regular members from changing any roles
    if (currentUserRole === 'member') {
      Alert.alert('Permission Denied', 'You are not authorized to manage roles.');
      return;
    }

    // Prevent admins from modifying or removing the owner
    if (
      currentUserRole === 'admin' &&
      roleType === 'owner'
    ) {
      Alert.alert('Permission Denied', 'Admins cannot modify or remove the group owner.');
      return;
    }

    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Confirmation',
        `Are you sure you want to ${roleAction === 'add' ? 'add' : 'remove'} the ${roleType} role for user ${selectedUser.username}?`,
        [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Confirm', onPress: () => resolve(true) },
        ]
      );
    });

    if (!confirmed) return;

    const success = await updateGroupRole({
      groupId,
      actorUserId: currentUserId,
      targetUserId: selectedUser._id,
      roleType,
      roleAction,
    });

    if (success) {
      await fetchGroupDetails(groupId);
      setModalVisible(false);
    }
  };

  const renderMemberCard = (member: any) => {
    if (!groupDetails) return null;

    const isCreator = groupDetails.creator?._id === member._id;
    const isOwner = groupDetails.owners?.some((owner: any) => owner._id === member._id);
    const isAdmin = groupDetails.admins?.some((admin: any) => admin._id === member._id);
    const isBlocked = groupDetails.blocked?.some((blocked: any) => blocked._id === member._id);

    let nameColor = '#4CAF50';
    if (isCreator) {
      nameColor = '#FFD700';
    } else if (isOwner) {
      nameColor = '#D32F2F';
    } else if (isAdmin) {
      nameColor = '#1976D2';
    } else if (isBlocked) {
      nameColor = '#555555';
    }

    const handlePress = () => {
      if (!isCreator) {
        openRoleModal(member);
      }
    };

    return (
      <TouchableOpacity
        key={member._id}
        style={styles.memberCard}
        onPress={handlePress}
        activeOpacity={isCreator ? 1 : 0.8}
      >
        <Image
          source={
            member.avatar
              ? { uri: member.avatar }
              : require('../../../../assets/images/coin.jpg')
          }
          style={styles.memberAvatar}
        />
        <View style={styles.memberInfo}>
          <Text
            style={[styles.memberName, { color: nameColor }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {member.username}
            {isCreator && ' 👑'}
          </Text>
        </View>
        {!isCreator && <Ionicons name="settings-outline" size={24} color="#007AFF" />}
      </TouchableOpacity>
    );
  };



  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading group details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={56} color="#D32F2F" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchGroupDetails(groupId)}
          activeOpacity={0.8}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!groupDetails) {
    return (
      <View style={styles.center}>
        <Text style={styles.noDataText}>No data to display.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      <View style={styles.groupHeader}>
        <Image
          source={
            groupDetails.avatar
              ? { uri: groupDetails.avatar }
              : require('../../../../assets/images/coin.jpg')
          }
          style={styles.groupAvatar}
        />
        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text style={styles.groupName}>{groupDetails.name}</Text>
          <Text style={styles.groupTag}>#{groupDetails.tag}</Text>
        </View>
      </View>

     <TouchableOpacity
        style={styles.editButton}
        onPress={async () => {
          setIsEditing(!isEditing); // بدء التعديل

        }}
      >
        <Text style={styles.editButtonText}>{isEditing ? 'Save' : 'Edit'}</Text>
      </TouchableOpacity>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Group Status</Text>

        {isEditing ? (
          <>
            <Picker
              selectedValue={groupStatus}
              onValueChange={(itemValue) => setGroupStatus(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Public" value="public" />
              <Picker.Item label="Private" value="private" />
            </Picker>

            {groupStatus === 'private' && (
              <TextInput
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
              />
            )}
          </>
        ) : (
          <Text style={styles.sectionContent}>
            {groupDetails.isPublic ? 'Public' : 'Private / Closed'}
          </Text>
        )}
      </View>
 
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Description</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={editedDescription}
            onChangeText={setEditedDescription}
            multiline
          />
        ) : (
          <Text style={styles.sectionContent}>
            {groupDetails.description || 'No description available'}
          </Text>
        )}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Welcome Message</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={editedWelcomeMessage}
            onChangeText={setEditedWelcomeMessage}
            multiline
          />
        ) : (
          <Text style={styles.sectionContent}>
            {groupDetails.welcomeMessageEnabled
              ? groupDetails.welcomeMessageText || 'No welcome message set'
              : 'Welcome message feature is disabled'}
          </Text>
        )}
      </View>


      {groupDetails.pinMessage ? (
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Pinned Message</Text>
          <Text style={styles.sectionContent}>{groupDetails.pinMessage}</Text>
        </View>
      ) : null}

      <View style={styles.membersSection}>
        <Text style={styles.sectionTitle}>Creator</Text>
        {groupDetails.creator ? renderMemberCard(groupDetails.creator) : <Text>Not specified</Text>}
      </View>
      <View style={styles.membersSection}>
        <Text style={styles.sectionTitle}>Owners</Text>
        {groupDetails.owners && groupDetails.owners.length > 0 ? (
          groupDetails.owners.map((owner: any) => renderMemberCard(owner))
        ) : (
          <Text style={styles.noMembersText}>No owners</Text>
        )}
      </View>
      <View style={styles.membersSection}>
        <Text style={styles.sectionTitle}>Admins</Text>
        {groupDetails.admins && groupDetails.admins.length > 0 ? (
          groupDetails.admins.map((admin: any) => renderMemberCard(admin))
        ) : (
          <Text style={styles.noMembersText}>No admins</Text>
        )}
      </View>

      <View style={styles.membersSection}>
        <Text style={styles.sectionTitle}>Members</Text>
        {groupDetails.members && groupDetails.members.length > 0 ? (
          groupDetails.members.map((member: any) => renderMemberCard(member))
        ) : (
          <Text style={styles.noMembersText}>No members</Text>
        )}
      </View>

      <View style={styles.membersSection}>
        <Text style={styles.sectionTitle}>Blocked Users</Text>
        {groupDetails.blocked && groupDetails.blocked.length > 0 ? (
          groupDetails.blocked.map((blocked: any) => renderMemberCard(blocked))
        ) : (
          <Text style={styles.noMembersText}>No blocked users</Text>
        )}
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Member Permissions</Text>
            {selectedUser && (
              <>
                <Text style={styles.modalUsername}>{selectedUser.username}</Text>

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => handleUpdateRole('admin', 'add')}
                  disabled={updatingRole}
                >
                  <Text style={styles.modalButtonText}>Add Admin</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => handleUpdateRole('admin', 'remove')}
                  disabled={updatingRole}
                >
                  <Text style={styles.modalButtonText}>Remove Admin</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => handleUpdateRole('owner', 'add')}
                  disabled={updatingRole}
                >
                  <Text style={styles.modalButtonText}>Assign Owner</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => handleUpdateRole('owner', 'remove')}
                  disabled={updatingRole}
                >
                  <Text style={styles.modalButtonText}>Remove Owner</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.blockButton]}
                  onPress={() => handleUpdateRole('block', 'add')}
                  disabled={updatingRole}
                >
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>Block Member</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.blockButton]}
                  onPress={() => handleUpdateRole('block', 'remove')}
                  disabled={updatingRole}
                >
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>Unblock Member</Text>
                </TouchableOpacity>

                {roleError && <Text style={styles.errorText}>{roleError}</Text>}
                {successMessage && <Text style={styles.successText}>{successMessage}</Text>}
              </>
            )}
          </View>
        </Pressable>
      </Modal>


    </ScrollView>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 16,
    marginTop: 10,
  },
  successText: {
    color: 'green',
    fontSize: 16,
    marginTop: 10,
  },
  retryButton: {
    marginTop: 15,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 5,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
  },
  groupHeader: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginTop: 8,
  },

  editButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
    marginHorizontal: 16,
  },

  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  groupAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ccc',
  },
  groupName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  groupTag: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    color: '#222',
  },
  sectionContent: {
    fontSize: 16,
    color: '#444',
  },
  membersSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  noMembersText: {
    fontSize: 16,
    color: '#999',
    marginTop: 5,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ccc',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 15,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#222',
  },
  ownerBadge: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalUsername: {
    fontSize: 18,
    marginBottom: 20,
    color: '#555',
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 6,
    marginVertical: 5,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  blockButton: {
    backgroundColor: '#D32F2F',
  },



  picker: {
    height: 50,
    width: '100%',
  },

});
