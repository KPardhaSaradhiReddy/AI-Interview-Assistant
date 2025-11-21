import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  interviewerEmail: string | null;
  interviewerName: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  interviewerEmail: null,
  interviewerName: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ email: string; name: string }>) => {
      state.isAuthenticated = true;
      state.interviewerEmail = action.payload.email;
      state.interviewerName = action.payload.name;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.interviewerEmail = null;
      state.interviewerName = null;
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;





