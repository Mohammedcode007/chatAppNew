import React, { useState } from "react";
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Text,
  Alert,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function ImageMessage({ uri }: { uri: string }) {
  const [modalVisible, setModalVisible] = useState(false);

const handleDownload = async () => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "You need to allow access to save files.");
      return;
    }

    const fileName = uri.split("/").pop() || `image_${Date.now()}.jpg`;
    const dir = FileSystem.documentDirectory;

    if (!dir) {
      Alert.alert("خطأ", "تعذر تحديد مجلد حفظ الملفات.");
      return;
    }

    const fileUri = dir + fileName;

    const downloadResult = await FileSystem.downloadAsync(uri, fileUri);
    await MediaLibrary.saveToLibraryAsync(downloadResult.uri);

    Alert.alert("Downloaded", "Image saved to your gallery.");
  } catch (err) {
    Alert.alert("Error", "Failed to download image.");
    console.error(err);
  }
};


  return (
    <>
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Image source={{ uri }} style={styles.thumbnail} resizeMode="cover" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <Image source={{ uri }} style={styles.fullImage} resizeMode="contain" />

          <TouchableOpacity
            onPress={handleDownload}
            style={styles.downloadButton}
          >
            <Ionicons name="download-outline" size={28} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setModalVisible(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  thumbnail: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: width,
    height: height * 0.8,
  },
  downloadButton: {
    position: "absolute",
    top: 40,
    right: 70,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
    borderRadius: 30,
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
    borderRadius: 30,
  },
});
