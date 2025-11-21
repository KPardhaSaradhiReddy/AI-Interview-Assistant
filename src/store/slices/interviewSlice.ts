import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { InterviewState, Question } from '../../types';

export const MCQ_TIME_LIMIT = 600; // 10 minutes
export const CODING_TIME_LIMIT = 1800; // 30 minutes
export const TECHNICAL_TIME_LIMIT = 300; // 5 minutes

const initialState: InterviewState = {
  isInterviewActive: false,
  currentQuestion: undefined,
  timeRemaining: 0,
  isPaused: false,
  phase: 'mcq',
  timeLimit: MCQ_TIME_LIMIT,
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    startInterview: (state, action: PayloadAction<{ candidate: any; questions: Question[] }>) => {
      state.isInterviewActive = true;
      state.currentQuestion = undefined;
      state.timeRemaining = MCQ_TIME_LIMIT;
      state.timeLimit = MCQ_TIME_LIMIT;
      state.phase = 'mcq';
      state.isPaused = false;
    },
    startMCQPhase: (state) => {
      state.phase = 'mcq';
      state.currentQuestion = undefined;
      state.timeRemaining = MCQ_TIME_LIMIT;
      state.timeLimit = MCQ_TIME_LIMIT;
      state.isInterviewActive = true;
      state.isPaused = false;
    },
    startCodingPhase: (state) => {
      state.phase = 'coding';
      state.currentQuestion = undefined;
      state.timeRemaining = CODING_TIME_LIMIT;
      state.timeLimit = CODING_TIME_LIMIT;
      state.isInterviewActive = true;
      state.isPaused = false;
    },
    startTechnicalPhase: (state, action: PayloadAction<{ questions: Question[] }>) => {
      state.phase = 'technical';
      state.currentQuestion = action.payload.questions[0];
      state.timeRemaining = TECHNICAL_TIME_LIMIT;
      state.timeLimit = TECHNICAL_TIME_LIMIT;
      state.isInterviewActive = true;
      state.isPaused = false;
    },
    setCurrentQuestion: (state, action: PayloadAction<Question | undefined>) => {
      state.currentQuestion = action.payload;
    },
    updateTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
    },
    pauseInterview: (state) => {
      state.isPaused = true;
    },
    resumeInterview: (state) => {
      state.isPaused = false;
    },
    endInterview: (state) => {
      state.isInterviewActive = false;
      state.currentQuestion = undefined;
      state.timeRemaining = 0;
      state.timeLimit = TECHNICAL_TIME_LIMIT;
      state.phase = 'completed';
      state.isPaused = false;
    },
    submitAnswer: () => {
      // Placeholder reducer (side effects handled elsewhere)
    },
  },
});

export const {
  startInterview,
  startMCQPhase,
  startCodingPhase,
  startTechnicalPhase,
  setCurrentQuestion,
  updateTimeRemaining,
  pauseInterview,
  resumeInterview,
  endInterview,
  submitAnswer,
} = interviewSlice.actions;

export default interviewSlice.reducer;
