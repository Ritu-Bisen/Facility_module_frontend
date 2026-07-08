import { createSlice } from '@reduxjs/toolkit';

// Rehydrate state from localStorage on app load
const storedUser = localStorage.getItem('user');
const storedAccessToken = localStorage.getItem('accessToken');
const storedRefreshToken = localStorage.getItem('refreshToken');

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  accessToken: storedAccessToken || null,
  refreshToken: storedRefreshToken || null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { data, accessToken, refreshToken } = action.payload;
      state.user = data;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      // Persist to localStorage
      localStorage.setItem('user', JSON.stringify(data));
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('roleName', data.roleName || '');
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('roleName');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;