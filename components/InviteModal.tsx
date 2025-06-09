// InviteModal.tsx
import React, { useState } from 'react';
import { Modal, View, TextInput, TouchableOpacity, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useAllFriends } from '@/Hooks/useAllFriends';
import { useAddMembersToGroup } from '@/Hooks/useAddMembersToGroup';

type Props = {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  actorUserId: string;
};

export default function InviteModal({ visible, onClose, groupId, actorUserId }: Props) {
  const { friends, loading: friendsLoading } = useAllFriends();
  const { addMembers, loading, successMessage, error } = useAddMembersToGroup(actorUserId);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelection = (userId: string) => {
    setSelectedIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleInvite = async () => {
    if (selectedIds.length === 0) return;
    await addMembers(groupId, selectedIds);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>دعوة أصدقاء للمجموعة</Text>

          <TextInput
            placeholder="ابحث عن صديق..."
            style={styles.input}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />

          {friendsLoading ? (
            <ActivityIndicator />
          ) : (
            <FlatList
              data={filteredFriends}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.friendItem}
                  onPress={() => toggleSelection(item._id)}
                >
                  <Text>{item.username}</Text>
                  {selectedIds.includes(item._id) && <Text>✅</Text>}
                </TouchableOpacity>
              )}
              style={{ maxHeight: 250 }}
            />
          )}

          {loading && <ActivityIndicator />}
          {error && <Text style={styles.error}>{error}</Text>}
          {successMessage && <Text style={styles.success}>{successMessage}</Text>}

          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelBtn}>إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleInvite}>
              <Text style={styles.inviteBtn}>دعوة</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  container: { backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '90%' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 10 },
  friendItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 10 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  cancelBtn: { color: 'red' },
  inviteBtn: { color: 'green' },
  error: { color: 'red', marginTop: 8 },
  success: { color: 'green', marginTop: 8 },
});
