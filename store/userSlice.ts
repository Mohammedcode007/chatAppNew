// src/store/userSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  userData: {
    _id?: string;
    username?: string;
    status?: string;
    friends?: any[];  // يمكنك تحسين النوع حسب بيانات الأصدقاء
    subscription?: any;
    coins?: number;
    [key: string]: any;
  } | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  userData: null,
  token: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<{ userData: any; token: string }>) {
      state.userData = action.payload.userData;
      state.token = action.payload.token;
      state.error = null;
    },
    clearUser(state) {
      state.userData = null;
      state.token = null;
      state.error = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    // يمكن إضافة إجراءات أخرى حسب الحاجة
  },
});

export const { setUser, clearUser, setLoading, setError } = userSlice.actions;

export default userSlice.reducer;
