import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  I18nManager,
  Modal,
} from 'react-native';
import { useThemeMode } from '@/context/ThemeContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectLanguage: (lang: 'en' | 'ar') => void;
  selectedLanguage: string;
  isRTL?: boolean;
}

const LanguageModal = ({
  visible,
  onClose,
  onSelectLanguage,
  selectedLanguage,
  isRTL = I18nManager.isRTL,
}: Props) => {
  const { darkMode } = useThemeMode(); // ← استخدام الكونتكست
  const styles = getStyles(darkMode);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Select Language</Text>

          <TouchableOpacity
            style={[
              styles.languageOption,
              selectedLanguage === 'en' && styles.selectedOption,
            ]}
            onPress={() => onSelectLanguage('en')}
          >
            <Text style={styles.languageText}>English</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.languageOption,
              selectedLanguage === 'ar' && styles.selectedOption,
            ]}
            onPress={() => onSelectLanguage('ar')}
          >
            <Text style={styles.languageText}>العربية</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: '#00000088',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
      width: '80%',
      borderRadius: 10,
      padding: 20,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
      color: isDark ? '#fff' : '#000',
    },
    languageOption: {
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 8,
      marginVertical: 5,
      backgroundColor: isDark ? '#333' : '#eee',
    },
    selectedOption: {
      backgroundColor: '#007AFF',
    },
    languageText: {
      fontSize: 16,
      color: isDark ? '#fff' : '#000',
      textAlign: 'center',
    },
    closeButton: {
      marginTop: 15,
      backgroundColor: '#FF3B30',
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    closeButtonText: {
      color: '#fff',
      fontWeight: 'bold',
    },
  });

export default LanguageModal;
