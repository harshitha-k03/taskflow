import { createSlice } from '@reduxjs/toolkit';

const token = localStorage.getItem('accessToken');
const user = JSON.parse(localStorage.getItem('user') || 'null');

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user,
    accessToken: token,
    isAuthenticated: !!token,
    loading: false,
    error: null,
  },
  reducers: {
    setCredentials(state, action) {
      const { user, accessToken, refreshToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.isAuthenticated = true;
      state.error = null;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken || '');
      localStorage.setItem('user', JSON.stringify(user));
    },
    updateAccessToken(state, action) {
      state.accessToken = action.payload;
      localStorage.setItem('accessToken', action.payload);
    },
    updateUser(state, action) {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    },
    setLoading(state, action) { state.loading = action.payload; },
    setError(state, action) { state.error = action.payload; },
  },
});

export const { setCredentials, updateAccessToken, updateUser, logout, setLoading, setError } = authSlice.actions;
export default authSlice.reducer;
