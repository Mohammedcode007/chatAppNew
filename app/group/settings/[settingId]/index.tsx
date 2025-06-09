import React, { useEffect, useState, useRef } from 'react';
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
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useFetchGroupDetails } from '@/Hooks/useFetchGroupDetails';
import { useUpdateGroupRole } from '@/Hooks/useUpdateGroupRole';
import { useUpdateGroupInfo } from '@/Hooks/useUpdateGroupInfo';

function getFirstParam(param: string | string[] | undefined): string {
  if (!param) return '';
  if (Array.isArray(param)) return param[0];
  return param;
}

export default function GroupSettingsScreen() {
  const params = useLocalSearchParams();
  const groupId = getFirstParam(params.groupId);
  const [userData, setUserData] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { groupDetails, loading, error, fetchGroupDetails } = useFetchGroupDetails();
  const { updateGroupInfo } = useUpdateGroupInfo(userData?._id);
  const { updateGroupRole } = useUpdateGroupRole();

  // الحقول القابلة للتحرير
  const [editedDescription, setEditedDescription] = useState('');
  const [editedWelcomeMessage, setEditedWelcomeMessage] = useState('');
  const [groupStatus, setGroupStatus] = useState<'public' | 'private'>('public');
  const [password, setPassword] = useState('');

  // حالة التحرير الحالية للحقل (للسماح بتحرير متعدد الحقول)
  const [editingField, setEditingField] = useState<string | null>(null);

  // لحفظ تلقائي بعد ترك الحقل (debounce)
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (groupId) fetchGroupDetails(groupId);
  }, [groupId]);

  useEffect(() => {
    const fetchUserData = async () => {
      const data = await AsyncStorage.getItem('userData');
      if (data) setUserData(JSON.parse(data));
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    if (groupDetails) {
      setEditedDescription(groupDetails.description || '');
      setEditedWelcomeMessage(groupDetails.welcomeMessageText || '');
      setGroupStatus(groupDetails.isPublic ? 'public' : 'private');
      setPassword(groupDetails.password || '');
    }
  }, [groupDetails]);

  const currentUserId = userData?._id;
  let currentUserRole = 'member';
  if (groupDetails?.creator?._id === currentUserId) currentUserRole = 'creator';
  else if (groupDetails?.owners?.some((o: any) => o?._id === currentUserId)) currentUserRole = 'owner';
  else if (groupDetails?.admins?.some((a: any) => a?._id === currentUserId)) currentUserRole = 'admin';
  else if (groupDetails?.blocked?.some((b: any) => b?._id === currentUserId)) currentUserRole = 'blocked';

  // دالة حفظ التعديلات تلقائيًا مع debounce
  const saveChanges = () => {
    if (!groupId) return;
    updateGroupInfo(groupId, {
      description: editedDescription,
      welcomeMessageText: editedWelcomeMessage,
      isPublic: groupStatus === 'public',
      password: groupStatus === 'private' ? password : '',
    });
  };

  // 1. حذف هذا السطر:
  // const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  // 2. أضف حالة جديدة لتتبع التغييرات
  const [hasChanges, setHasChanges] = useState(false);

  // 3. تعديل دالة handleFieldChange
  const handleFieldChange = (field: string, value: string) => {
    switch (field) {
      case 'description':
        setEditedDescription(value);
        break;
      case 'welcomeMessage':
        setEditedWelcomeMessage(value);
        break;
      case 'password':
        setPassword(value);
        break;
      case 'groupStatus':
        setGroupStatus(value as 'public' | 'private');
        if (value === 'public') setPassword('');
        break;
    }
    setHasChanges(true);  // علامه على وجود تغييرات
  };

  // 4. دالة الحفظ التي تستدعي updateGroupInfo
  const handleSave = () => {
    saveChanges();
    setHasChanges(false);
    setEditingField(null);
  };




  const openRoleModal = (member: any) => {
    setSelectedUser(member);
    setModalVisible(true);
  };

  const handleUpdateRole = async (
    roleType: 'admin' | 'owner' | 'block',
    roleAction: 'add' | 'remove'
  ) => {
    if (!selectedUser || !groupId || !currentUserId) return;

    if (currentUserRole === 'member') {
      Alert.alert('Unauthorized', 'You are not allowed to manage roles.');
      return;
    }

    if (currentUserRole === 'admin' && roleType === 'owner') {
      Alert.alert('Unauthorized', 'Admins cannot modify owners.');
      return;
    }

    const confirmed = await new Promise<boolean>((resolve) =>
      Alert.alert(
        'Confirm Role Change',
        `Do you want to ${roleAction} ${roleType} role for ${selectedUser.username}?`,
        [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Confirm', onPress: () => resolve(true) },
        ]
      )
    );

    if (!confirmed) return;

    const success = await updateGroupRole({
      groupId,
      actorUserId: currentUserId,
      targetUserId: selectedUser?._id,
      roleType,
      roleAction,
    });

    if (success) {
      setModalVisible(false);
      fetchGroupDetails(groupId);
    }
  };

  const renderMemberCard = (member: any) => {
    const isCreator = groupDetails?.creator?._id === member?._id;
    const isOwner = groupDetails?.owners?.some((o: any) => o?._id === member?._id);
    const isAdmin = groupDetails?.admins?.some((a: any) => a?._id === member?._id);
    const isBlocked = groupDetails?.blocked?.some((b: any) => b?._id === member?._id);

    let bgColor = isCreator
      ? '#FFF9C4'
      : isOwner
        ? '#FFCDD2'
        : isAdmin
          ? '#BBDEFB'
          : isBlocked
            ? '#E0E0E0'
            : '#C8E6C9';

    let textColor = isBlocked ? '#757575' : '#212121';

    return (
      <Pressable
        key={member?._id}
        style={({ pressed }) => [
          styles.memberCard,
          { backgroundColor: bgColor },
          pressed && !isCreator ? { opacity: 0.6 } : {},
        ]}
        onPress={() => !isCreator && openRoleModal(member)}
      >

        <View style={styles.memberInfo}>
<Text style={[styles.memberName, { color: textColor }]}>
  {`${member.username.slice(0, 30)}${member.username.length > 30 ? '...' : ''}`} {isCreator && '👑'}
</Text>



          <View style={styles.roleBadgeContainer}>
            {isOwner && (
              <View style={[styles.roleBadge, { backgroundColor: '#D32F2F' }]}>
                <Text style={styles.roleBadgeText}>Owner</Text>
              </View>
            )}
            {isAdmin && (
              <View style={[styles.roleBadge, { backgroundColor: '#1976D2' }]}>
                <Text style={styles.roleBadgeText}>Admin</Text>
              </View>
            )}
            {isBlocked && (
              <View style={[styles.roleBadge, { backgroundColor: '#616161' }]}>
                <Text style={styles.roleBadgeText}>Blocked</Text>
              </View>
            )}
          </View>
        </View>
        {!isCreator && <Ionicons name="settings" size={24} color="#007AFF" />}
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 8, color: '#007AFF' }}>Loading group details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: 'red' }}>Error loading group details: {error}</Text>
      </View>
    );
  }
  const getSortedMembers = () => {
    if (!groupDetails || !groupDetails.members) return [];

    const creator = [groupDetails.creator].filter(Boolean);
    const owners = groupDetails.owners || [];
    const admins = groupDetails.admins || [];
    const blocked = groupDetails.blocked || [];

    const ownerIds = new Set(owners.map((o: any) => o._id));
    const adminIds = new Set(admins.map((a: any) => a._id));
    const blockedIds = new Set(blocked.map((b: any) => b._id));
    const creatorId = groupDetails.creator?._id;

    // إزالة المكرر: الأعضاء العاديين هم من ليسوا ضمن أي من الأدوار
    const remainingMembers = (groupDetails.members || []).filter((member: any) => {
      return (
        member._id !== creatorId &&
        !ownerIds.has(member._id) &&
        !adminIds.has(member._id) &&
        !blockedIds.has(member._id)
      );
    });

    return [
      ...creator,
      ...owners.filter((o) => o._id !== creatorId),
      ...admins.filter((a) => a._id !== creatorId && !ownerIds.has(a._id)),
      ...blocked.filter((b) => b._id !== creatorId && !ownerIds.has(b._id) && !adminIds.has(b._id)),
      ...remainingMembers,
    ];
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Group Description</Text>
        <Pressable
          onPress={() => setEditingField('description')}
          style={styles.editableContainer}
        >
          {editingField === 'description' ? (
            <TextInput
              style={[styles.textInput, styles.multiLineInput]}
              value={editedDescription}
              onChangeText={(text) => handleFieldChange('description', text)}
              multiline
              autoFocus
              onBlur={() => setEditingField(null)}
              placeholder="Edit description..."
              returnKeyType="done"
              textAlignVertical="top"
              maxLength={500}
            />
          ) : (
            <Text style={styles.textDisplay}>
              {editedDescription || 'No description set. Tap to edit.'}
            </Text>
          )}
        </Pressable>

        <Text style={styles.sectionTitle}>Welcome Message</Text>
        <Pressable
          onPress={() => setEditingField('welcomeMessage')}
          style={styles.editableContainer}
        >
          {editingField === 'welcomeMessage' ? (
            <TextInput
              style={[styles.textInput, styles.multiLineInput]}
              value={editedWelcomeMessage}
              onChangeText={(text) => handleFieldChange('welcomeMessage', text)}
              multiline
              autoFocus
              onBlur={() => setEditingField(null)}
              placeholder="Edit welcome message..."
              returnKeyType="done"
              textAlignVertical="top"
              maxLength={300}
            />
          ) : (
            <Text style={styles.textDisplay}>
              {editedWelcomeMessage || 'No welcome message set. Tap to edit.'}
            </Text>
          )}
        </Pressable>

        <Text style={styles.sectionTitle}>Group Status</Text>
        <View style={styles.statusContainer}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              groupStatus === 'public' && styles.statusButtonActive,
            ]}
            onPress={() => handleFieldChange('groupStatus', 'public')}
          >
            <Text
              style={[
                styles.statusButtonText,
                groupStatus === 'public' && styles.statusButtonTextActive,
              ]}
            >
              Public
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statusButton,
              groupStatus === 'private' && styles.statusButtonActive,
            ]}
            onPress={() => handleFieldChange('groupStatus', 'private')}
          >
            <Text
              style={[
                styles.statusButtonText,
                groupStatus === 'private' && styles.statusButtonTextActive,
              ]}
            >
              Private
            </Text>
          </TouchableOpacity>
        </View>

        {groupStatus === 'private' && (
          <>
            <Text style={styles.sectionTitle}>Password</Text>
            <Pressable
              onPress={() => setEditingField('password')}
              style={styles.editableContainer}
            >
              {editingField === 'password' ? (
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={(text) => handleFieldChange('password', text)}
                  secureTextEntry
                  autoFocus
                  onBlur={() => setEditingField(null)}
                  placeholder="Set password..."
                  returnKeyType="done"
                  maxLength={50}
                />
              ) : (
                <Text style={styles.textDisplay}>
                  {password ? '••••••••' : 'No password set. Tap to set.'}
                </Text>
              )}
            </Pressable>
          </>
        )}

        <Text style={styles.sectionTitle}>Members ({groupDetails?.members?.length || 0})</Text>
        {groupDetails?.members?.length === 0 && (
          <Text style={{ color: '#777', marginVertical: 8 }}>No members found.</Text>
        )}
        {getSortedMembers().map((member: any) => renderMemberCard(member))}

        {/* Role Management Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Manage Roles for {selectedUser?.username}
              </Text>

              {/* أزرار تغيير الأدوار */}
              {currentUserRole !== 'member' && (
                <>
                  {currentUserRole !== 'admin' && (
                    <>
                      <TouchableOpacity
                        style={styles.modalButton}
                        onPress={() =>
                          handleUpdateRole('owner', groupDetails?.owners.some((o: any) => o?._id === selectedUser?._id) ? 'remove' : 'add')
                        }
                      >
                        <Text style={styles.modalButtonText}>
                          {groupDetails?.owners.some((o: any) => o?._id === selectedUser?._id)
                            ? 'Remove Owner'
                            : 'Make Owner'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() =>
                      handleUpdateRole('admin', groupDetails?.admins.some((a: any) => a?._id === selectedUser?._id) ? 'remove' : 'add')
                    }
                  >
                    <Text style={styles.modalButtonText}>
                      {groupDetails?.admins.some((a: any) => a?._id === selectedUser?._id)
                        ? 'Remove Admin'
                        : 'Make Admin'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#D32F2F' }]}
                    onPress={() =>
                      handleUpdateRole('block', groupDetails?.blocked.some((b: any) => b?._id === selectedUser?._id) ? 'remove' : 'add')
                    }
                  >
                    <Text style={[styles.modalButtonText, { color: 'white' }]}>
                      {groupDetails?.blocked.some((b: any) => b?._id === selectedUser?._id)
                        ? 'Unblock User'
                        : 'Block User'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#777', marginTop: 10 }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
        {hasChanges && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>حفظ</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#212121',
  },
  editableContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  textDisplay: {
    fontSize: 16,
    color: '#444',
    minHeight: 40,
  },
  textInput: {
    fontSize: 16,
    color: '#212121',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  multiLineInput: {
    minHeight: 80,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
    marginVertical: 12,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statusButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 25,
    paddingVertical: 10,
    marginHorizontal: 5,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#007AFF',
  },
  statusButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  statusButtonTextActive: {
    color: 'white',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderRadius: 12,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#CCC',
  },
  memberInfo: {
    flex: 1,
    justifyContent: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center'
  },
  memberName: {
    fontWeight: '700',
    fontSize: 16,
  },
  roleBadgeContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  roleBadge: {
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginRight: 6,
  },
  roleBadgeText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#212121',
  },
  modalButton: {
    backgroundColor: '#1976D2',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});
