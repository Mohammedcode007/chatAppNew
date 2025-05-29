import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // أو أي مكتبة أيقونات تستخدمها

interface BlockedUser {
  id: string;
  name: string;
}

interface BlockedUsersModalProps {
  visible: boolean;
  onClose: () => void;
  blockedUsers: BlockedUser[];
  onUnblock: (userId: string) => void;
  theme: {
    bg: string;
    text: string;
    subText: string;
    card: string;
    border: string;
  };
}

const BlockedUsersModal: React.FC<BlockedUsersModalProps> = ({
  visible,
  onClose,
  blockedUsers,
  onUnblock,
  theme,
}) => {
  return (
    <Modal animationType="slide" visible={visible} transparent>
      <View style={[styles.modalBackground, { backgroundColor: theme.bg + 'cc' }]}>
        <View style={[styles.modalContainer, { backgroundColor: "white", borderColor: theme.border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Blocked Users</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="trash-outline" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={blockedUsers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
              <View style={[styles.userItem, { borderBottomColor: theme.border }]}>
                <Text style={[styles.userName, { color: theme.text }]}>{item.name}</Text>
                <TouchableOpacity onPress={() => onUnblock(item.id)}>
                  <Ionicons name="close-circle" size={22} color={theme.subText} />
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: theme.subText }]}>
                No blocked users.
              </Text>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxHeight: '70%',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  userName: {
    fontSize: 16,
  },
  emptyText: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default BlockedUsersModal;
