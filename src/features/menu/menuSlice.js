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

const savedMenuData = localStorage.getItem('userMenuData');
const parsedMenuData = savedMenuData ? JSON.parse(savedMenuData) : null;

const initialState = {
  menus: parsedMenuData?.menus || [],
  permissions: parsedMenuData?.permissions || {}, // flat map of screenPath -> permissions object
  facilityType: parsedMenuData?.facilityType || null,
  loading: false,
  isLoaded: !!parsedMenuData,
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
      state.isLoaded = false;
      localStorage.removeItem('userMenuData');
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
        state.isLoaded = true;
        const menus = Array.isArray(action.payload?.menus) ? action.payload.menus : [];
        state.menus = menus;
        state.facilityType = action.payload?.facilityType || null;
        
        // Build flat permission map
        const pMap = {};
        menus.forEach(module => {
          if (module && Array.isArray(module.screens)) {
            module.screens.forEach(screen => {
              if (screen && screen.screenUrl) {
                pMap[screen.screenUrl] = {
                  canView: !!screen.canView,
                  canAdd: !!screen.canAdd,
                  canEdit: !!screen.canEdit,
                  canDelete: !!screen.canDelete,
                  canApprove: !!screen.canApprove
                };
              }
            });
          }
        });
        state.permissions = pMap;

        localStorage.setItem('userMenuData', JSON.stringify({
          menus: state.menus,
          permissions: state.permissions,
          facilityType: state.facilityType
        }));
      })
      .addCase(fetchMyMenus.rejected, (state, action) => {
        state.loading = false;
        state.isLoaded = true;
        state.error = action.payload;
      });
  },
});

export const { clearMenus } = menuSlice.actions;
export default menuSlice.reducer;
