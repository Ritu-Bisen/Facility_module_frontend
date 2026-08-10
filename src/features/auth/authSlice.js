import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Rehydrate state from localStorage on app load
const storedUser = localStorage.getItem('user');
const storedAccessToken = localStorage.getItem('accessToken');
const storedRefreshToken = localStorage.getItem('refreshToken');
const storedMenus = localStorage.getItem('menus');

export const fetchUserMenus = createAsyncThunk(
  'auth/fetchUserMenus',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken;
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/me/menus`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch menus');
    }
  }
);

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  accessToken: storedAccessToken || null,
  refreshToken: storedRefreshToken || null,
  menus: storedMenus ? JSON.parse(storedMenus) : [],
  status: 'idle',
  error: null,
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
      state.menus = [];
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('roleName');
      localStorage.removeItem('menus');
      localStorage.removeItem('userMenuData');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserMenus.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserMenus.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.menus = action.payload;
        localStorage.setItem('menus', JSON.stringify(action.payload));
      })
      .addCase(fetchUserMenus.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;