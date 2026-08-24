/**
 * NeuraMind — Redux Auth Slice
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE = '/api/auth';

// Axios instance with credentials support
const authApi = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Restore user session on startup
 */
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.get('/me');
      return response.data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Session expired or unauthenticated.');
    }
  }
);

/**
 * Request OTP verification code for email
 */
export const requestOtp = createAsyncThunk(
  'auth/requestOtp',
  async (email, { rejectWithValue }) => {
    try {
      const response = await authApi.post('/email/request-otp', { email });
      return { email, ...response.data };
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.message || data?.error || 'Failed to request verification code.';
      return rejectWithValue({ message: msg, cooldownSeconds: data?.cooldownSeconds });
    }
  }
);

/**
 * Verify 6-digit OTP code
 */
export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await authApi.post('/email/verify-otp', { email, otp });
      return response.data.user;
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Verification failed.';
      return rejectWithValue(msg);
    }
  }
);

/**
 * Logout current user
 */
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await authApi.post('/logout');
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Logout failed.');
    }
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true, // initial startup check
  submitting: false,
  error: null,
  otpSent: false,
  otpEmail: '',
  resendCooldown: 0,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    resetOtpState: (state) => {
      state.otpSent = false;
      state.otpEmail = '';
      state.resendCooldown = 0;
      state.error = null;
    },
    setResendCooldown: (state, action) => {
      state.resendCooldown = action.payload;
    },
    decrementCooldown: (state) => {
      if (state.resendCooldown > 0) {
        state.resendCooldown -= 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchCurrentUser
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = Boolean(action.payload);
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      })

      // requestOtp
      .addCase(requestOtp.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(requestOtp.fulfilled, (state, action) => {
        state.submitting = false;
        state.otpSent = true;
        state.otpEmail = action.payload.email;
        state.resendCooldown = action.payload.cooldownSeconds || 60;
        state.error = null;
      })
      .addCase(requestOtp.rejected, (state, action) => {
        state.submitting = false;
        const payload = action.payload;
        state.error = typeof payload === 'string' ? payload : (payload?.message || 'Failed to request verification code.');
        if (payload?.cooldownSeconds) {
          state.resendCooldown = payload.cooldownSeconds;
        }
      })

      // verifyOtp
      .addCase(verifyOtp.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.submitting = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.otpSent = false;
        state.otpEmail = '';
        state.error = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // logoutUser
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.otpSent = false;
        state.otpEmail = '';
        state.error = null;
      });
  },
});

export const { clearAuthError, resetOtpState, setResendCooldown, decrementCooldown } = authSlice.actions;
export default authSlice.reducer;
