import { useFriendRequests } from '@/Hooks/useWebSocket';
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

export default function FriendRequestsScreen() {
  const {
    friendRequests,
    notifications,
    respondToFriendRequest,
  } = useFriendRequests();

  return (
    <View style={styles.container}>
      {notifications.length > 0 && (
        <View style={styles.notificationContainer}>
          {notifications.map((note, i) => (
            <Text key={i} style={styles.notificationText}>
              {note}
            </Text>
          ))}
        </View>
      )}

      <Text style={styles.heading}>طلبات الصداقة</Text>

      <FlatList
        data={friendRequests}
        keyExtractor={(item) => item.fromUserId}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.username}>{item.fromUsername}</Text>
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.button, styles.acceptButton]}
                onPress={() => respondToFriendRequest(item.fromUserId, true)}
              >
                <Text style={styles.buttonText}>قبول</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={() => respondToFriendRequest(item.fromUserId, false)}
              >
                <Text style={styles.buttonText}>رفض</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>لا توجد طلبات صداقة حالياً</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f4f6fa',
  },
  notificationContainer: {
    marginBottom: 15,
    backgroundColor: '#e6ffe6',
    padding: 10,
    borderRadius: 8,
  },
  notificationText: {
    color: '#2e7d32',
    fontSize: 14,
    marginBottom: 5,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#444',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 6,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4caf50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 40,
  },
});
