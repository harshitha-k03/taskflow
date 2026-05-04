import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0,
    loading: false,
  },
  reducers: {
    setNotifications(state, action) {
      state.items = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.read).length;
    },
    markOneRead(state, action) {
      const n = state.items.find((n) => n._id === action.payload);
      if (n && !n.read) {
        n.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllRead(state) {
      state.items.forEach((n) => (n.read = true));
      state.unreadCount = 0;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    prependNotification(state, action) {
      state.items.unshift(action.payload);
      if (!action.payload.read) state.unreadCount += 1;
    },
  },
});

export const {
  setNotifications,
  markOneRead,
  markAllRead,
  setLoading,
  prependNotification,
} = notificationSlice.actions;
export default notificationSlice.reducer;
