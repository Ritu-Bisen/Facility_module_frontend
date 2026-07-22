import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchMyMenus = createAsyncThunk(
  'menu/fetchMyMenus',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('No token found');
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/facility-access/my-menus`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data; // { success, menus, facilityType }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  menus: [],
  permissions: {}, // flat map of screenPath -> permissions object
  facilityType: null,
  loading: false,
  error: null,
};

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    clearMenus: (state) => {
      state.menus = [];
      state.permissions = {};
      state.facilityType = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyMenus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyMenus.fulfilled, (state, action) => {
        state.loading = false;
        state.menus = action.payload.menus || [];
        state.facilityType = action.payload.facilityType;
        
        // Build flat permission map
        const pMap = {};
        state.menus.forEach(module => {
          module.screens.forEach(screen => {
            pMap[screen.screenUrl] = {
              canView: screen.canView,
              canAdd: screen.canAdd,
              canEdit: screen.canEdit,
              canDelete: screen.canDelete,
              canApprove: screen.canApprove
            };
          });
        });
        state.permissions = pMap;
      })
      .addCase(fetchMyMenus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearMenus } = menuSlice.actions;
export default menuSlice.reducer;
