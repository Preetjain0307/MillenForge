import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  brand: {
    logo: '',
    name: 'NeuraMind',
    primaryColor: '#6366f1',
    secondaryColor: '#f43f5e',
    typography: 'Inter',
    borderRadius: '8px',
    buttonStyle: 'rounded',
    imageStyle: 'rounded'
  },
  theme: null, // Holds the generated AI theme structure
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    updateBrand: (state, action) => {
      state.brand = { ...state.brand, ...action.payload };
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    clearTheme: (state) => {
      state.theme = null;
    }
  },
});

export const { updateBrand, setTheme, clearTheme } = themeSlice.actions;
export default themeSlice.reducer;
