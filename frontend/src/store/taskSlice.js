import { createSlice } from '@reduxjs/toolkit';

const taskSlice = createSlice({
  name: 'tasks',
  initialState: { tasks: [], currentTask: null, loading: false, error: null },
  reducers: {
    setTasks(state, action) { state.tasks = action.payload; },
    setCurrentTask(state, action) { state.currentTask = action.payload; },
    addTask(state, action) { state.tasks.unshift(action.payload); },
    updateTask(state, action) {
      const idx = state.tasks.findIndex(t => t._id === action.payload._id);
      if (idx !== -1) state.tasks[idx] = { ...state.tasks[idx], ...action.payload };
      if (state.currentTask?._id === action.payload._id) {
        state.currentTask = { ...state.currentTask, ...action.payload };
      }
    },
    removeTask(state, action) {
      state.tasks = state.tasks.filter(t => t._id !== action.payload);
    },
    setLoading(state, action) { state.loading = action.payload; },
    setError(state, action) { state.error = action.payload; },
  },
});

export const { setTasks, setCurrentTask, addTask, updateTask, removeTask, setLoading, setError } = taskSlice.actions;
export default taskSlice.reducer;
