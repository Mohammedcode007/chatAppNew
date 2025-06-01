import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCreateGroup } from '@/Hooks/useCreateGroup';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CreateGroup = () => {
  const [groupName, setGroupName] = useState('');
  const [showAgreement, setShowAgreement] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const parsed = JSON.parse(userDataString);
          setUserData(parsed);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        if (storedToken) {
          setToken(storedToken);
        }
      } catch (error) {
        console.error('Failed to get token:', error);
      }
    };
    fetchToken();
  }, []);

  const {
    createGroup,
    group,
    loading,
    error,
    successMessage
  } = useCreateGroup(userData?._id, token);

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      Alert.alert('Group name is required', 'Please enter a group name.');
      return;
    }
    if (!isChecked) {
      Alert.alert('Agreement required', 'You must agree to the terms before creating a group.');
      return;
    }
    createGroup(groupName);
  };

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      Alert.alert('Success', successMessage);
      setGroupName('');
      setIsChecked(false);
      setShowAgreement(false);
      // navigation.goBack(); // Optional: if using React Navigation
    }
  }, [successMessage]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.title}>Create New Group</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter group name"
          placeholderTextColor="#aaa"
          value={groupName}
          onChangeText={setGroupName}
        />

        <Pressable
          onPress={() => setIsChecked(!isChecked)}
          style={styles.checkboxContainer}
        >
          <Ionicons
            name={isChecked ? 'checkbox' : 'square-outline'}
            size={24}
            color="#6A2D91"
          />
          <Text style={styles.checkboxLabel}>I agree to the group creation terms</Text>
        </Pressable>

        <Pressable onPress={() => setShowAgreement(!showAgreement)}>
          <Text style={styles.agreementText}>
            View group creation terms
          </Text>
        </Pressable>

        {showAgreement && (
          <View style={styles.inlineAgreement}>
            <Text style={styles.agreementTitle}>Terms</Text>
            <Text style={styles.agreementBody}>
              • Group must not contain offensive content.{"\n"}
              • Respect all group members.{"\n"}
              • No inappropriate or illegal content.{"\n"}
              • Admins reserve the right to delete any violating group without notice.
            </Text>
          </View>
        )}

        <Pressable
          style={[styles.createButton, loading && { opacity: 0.6 }]}
          onPress={handleCreateGroup}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creating...' : 'Create Group'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateGroup;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6A2D91',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 15,
    color: '#333',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkboxLabel: {
    marginLeft: 8,
    color: '#333',
    fontSize: 14,
  },
  agreementText: {
    color: '#7A3DA3',
    textAlign: 'left',
    fontSize: 14,
    textDecorationLine: 'underline',
    marginVertical: 8,
  },
  inlineAgreement: {
    backgroundColor: '#f9f4fc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d3c1e6',
    marginBottom: 20,
  },
  agreementTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 5,
    color: '#6A2D91',
  },
  agreementBody: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
  },
  createButton: {
    backgroundColor: '#6A2D91',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
