// // src/services/auth.ts

// import axios from '@/utils/axiosInstance';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// export const loginUser = async (username: string, password: string) => {
//   try {
//     const response = await axios.post('/login', {
//       username,
//       password,
//     });

//     if (response.status === 200 && response.data.token) {
//       const { token, user } = response.data;

//       await AsyncStorage.setItem('authToken', token);
//       await AsyncStorage.setItem('hasSeenOnboarding', 'true');

//       return { success: true, user, token };
//     } else {
//       return { success: false, message: 'Authentication failed. No token.' };
//     }
//   } catch (error: any) {
//     console.error('Login error:', error?.response || error?.message || error);
//     return {
//       success: false,
//       message:
//         error?.response?.data?.message || 'Server error. Please try again later.',
//     };
//   }
// };

// src/services/auth.ts

import axios from '@/utils/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const loginUser = async (username: string, password: string) => {
  try {
    const response = await axios.post('/login', {
      username,
      password,
    });

    if (response.status === 200 && response.data.token) {
      const { token, user } = response.data;

      // 🟢 حفظ التوكن
      await AsyncStorage.setItem('authToken', token);

      // 🟢 حفظ بيانات المستخدم بصيغة JSON
      await AsyncStorage.setItem('userData', JSON.stringify(user));

      // 🟢 حفظ علامة مشاهدة واجهة الترحيب أو المقدمة
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');

      return { success: true, user, token };
    } else {
      return { success: false, message: 'Authentication failed. No token.' };
    }
  } catch (error: any) {
    console.error('Login error:', error?.response || error?.message || error);
    return {
      success: false,
      message:
        error?.response?.data?.message || 'Server error. Please try again later.',
    };
  }
};



interface RegisterResponse {
  success: boolean;
  message?: string;
  user?: any;
  token?: string;
}

export const registerUser = async (
  username: string,
  password: string,
  email: string
): Promise<RegisterResponse> => {
  try {
    const response = await axios.post('/signup', {
      username,
      password,
      email,
    });

    if (response.status === 201 && response.data.user) {
      // تسجيل ناجح، عادة ترجع بيانات المستخدم وربما التوكن
      const { user, token } = response.data;

      return { success: true, user, token };
    } else {
      return {
        success: false,
        message: 'Registration failed. Invalid server response.',
      };
    }
  } catch (error: any) {
    console.error('Registration error:', error?.response || error?.message || error);

    return {
      success: false,
      message:
        error?.response?.data?.message || 'Server error. Please try again later.',
    };
  }
};



// دالة رفع صورة إلى السيرفر
export const uploadImage = async (imageUri: string): Promise<{ success: boolean; imageUrl?: string; message?: string }> => {
  try {
    // تجهيز بيانات الصورة كـ FormData
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg', // أو نوع الصورة المناسب
      name: 'photo.jpg',  // يمكنك تعديل الاسم حسب الحاجة
    } as any); // type assertion لتجنب مشاكل TypeScript

    // إرسال الصورة عبر POST إلى endpoint الرفع (تأكد من المسار)
    const response = await axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.status === 201 && response.data.imageUrl) {
      // رفع ناجح، نعيد رابط الصورة
      return { success: true, imageUrl: response.data.imageUrl };
    } else {
      return { success: false, message: 'Upload failed: Invalid server response.' };
    }
  } catch (error: any) {
    console.error('Upload image error:', error?.response || error?.message || error);
    return {
      success: false,
      message: error?.response?.data?.message || 'Server error during image upload. Please try again later.',
    };
  }
};
