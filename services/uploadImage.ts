// services/uploadImage.ts
import { CLOUDINARY_UPLOAD_PRESET, CLOUDINARY_URL } from '@/utils/cloudinaryConfig';
import * as ImagePicker from 'expo-image-picker';

export const pickAndUploadImage = async () => {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissionResult.granted) {
    alert("Permission to access media library is required!");
    return null;
  }

  const pickerResult = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

  if (pickerResult.canceled || !pickerResult.assets?.length) return null;

  const image = pickerResult.assets[0];

  // تحويل URI إلى Blob
  const uriToBlob = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  };

  try {
    const blob = await uriToBlob(image.uri);
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
      // لا تضف headers: {'Content-Type': 'multipart/form-data'}
    });

    const data = await response.json();

    if (data.secure_url) {
      return data.secure_url;
    } else {
      throw new Error('Upload failed');
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return null;
  }
};


