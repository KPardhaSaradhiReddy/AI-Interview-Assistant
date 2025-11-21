import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Candidate, MCQQuestion, CodingQuestion, CodingResponse } from '../../types';

interface CandidateState {
  candidates: Candidate[];
  currentCandidate?: Candidate;
}

const initialState: CandidateState = {
  candidates: [],
  currentCandidate: undefined,
};

const candidateSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    addCandidate: (state, action: PayloadAction<Candidate>) => {
      state.candidates.push(action.payload);
    },
    updateCandidate: (state, action: PayloadAction<{ id: string; updates: Partial<Candidate> }>) => {
      const candidate = state.candidates.find(c => c.id === action.payload.id);
      if (candidate) {
        Object.assign(candidate, action.payload.updates);
        candidate.updatedAt = new Date().toISOString();
      }
    },
    setCurrentCandidate: (state, action: PayloadAction<string>) => {
      state.currentCandidate = state.candidates.find(c => c.id === action.payload);
    },
    addAnswer: (state, action: PayloadAction<{ candidateId: string; answer: any }>) => {
      const candidate = state.candidates.find(c => c.id === action.payload.candidateId);
      if (candidate) {
        candidate.answers.push(action.payload.answer);
        candidate.currentQuestionIndex += 1;
        candidate.updatedAt = new Date().toISOString();
        
        // Update currentCandidate if it's the same candidate
        if (state.currentCandidate?.id === candidate.id) {
          state.currentCandidate = candidate;
        }
      }
    },
    updateInterviewStatus: (state, action: PayloadAction<{ candidateId: string; status: Candidate['interviewStatus'] }>) => {
      const candidate = state.candidates.find(c => c.id === action.payload.candidateId);
      if (candidate) {
        candidate.interviewStatus = action.payload.status;
        candidate.updatedAt = new Date().toISOString();
        
        // Update currentCandidate if it's the same candidate
        if (state.currentCandidate?.id === candidate.id) {
          state.currentCandidate = candidate;
        }
      }
    },
    setFinalScore: (state, action: PayloadAction<{ candidateId: string; score: number; summary: string }>) => {
      const candidate = state.candidates.find(c => c.id === action.payload.candidateId);
      if (candidate) {
        candidate.finalScore = action.payload.score;
        candidate.aiSummary = action.payload.summary;
        candidate.interviewStatus = 'completed';
        candidate.assessmentPhase = 'completed';
        candidate.updatedAt = new Date().toISOString();
        
        // Update currentCandidate if it's the same candidate
        if (state.currentCandidate?.id === candidate.id) {
          state.currentCandidate = candidate;
        }
      }
    },
    setAssessmentPhase: (state, action: PayloadAction<{ candidateId: string; phase: NonNullable<Candidate['assessmentPhase']> }>) => {
      const candidate = state.candidates.find(c => c.id === action.payload.candidateId);
      if (candidate) {
        candidate.assessmentPhase = action.payload.phase;
        candidate.updatedAt = new Date().toISOString();
        if (state.currentCandidate?.id === candidate.id) {
          state.currentCandidate = candidate;
        }
      }
    },
    setMCQQuestions: (state, action: PayloadAction<{ candidateId: string; questions: MCQQuestion[] }>) => {
      const candidate = state.candidates.find(c => c.id === action.payload.candidateId);
      if (candidate) {
        candidate.mcqQuestions = action.payload.questions;
        candidate.mcqResponses = action.payload.questions.map(q => ({ questionId: q.id }));
        candidate.updatedAt = new Date().toISOString();
        if (state.currentCandidate?.id === candidate.id) {
          state.currentCandidate = candidate;
        }
      }
    },
    recordMCQResponse: (state, action: PayloadAction<{ candidateId: string; questionId: string; selectedOption: number }>) => {
      const candidate = state.candidates.find(c => c.id === action.payload.candidateId);
      if (candidate) {
        if (!candidate.mcqResponses) {
          candidate.mcqResponses = [];
        }
        const response = candidate.mcqResponses.find(r => r.questionId === action.payload.questionId);
        if (response) {
          response.selectedOption = action.payload.selectedOption;
        } else {
          candidate.mcqResponses.push({
            questionId: action.payload.questionId,
            selectedOption: action.payload.selectedOption,
          });
        }
        candidate.updatedAt = new Date().toISOString();
        if (state.currentCandidate?.id === candidate.id) {
          state.currentCandidate = candidate;
        }
      }
    },
    finalizeMCQAssessment: (state, action: PayloadAction<{ candidateId: string }>) => {
      const candidate = state.candidates.find(c => c.id === action.payload.candidateId);
      if (candidate && candidate.mcqQuestions?.length) {
        if (!candidate.mcqResponses) {
          candidate.mcqResponses = candidate.mcqQuestions.map(q => ({ questionId: q.id }));
        }
        const responses = candidate.mcqResponses.map(response => {
          const question = candidate.mcqQuestions?.find(q => q.id === response.questionId);
          const isCorrect = question ? response.selectedOption === question.correctOption : false;
          return {
            ...response,
            isCorrect,
          };
        });
        candidate.mcqResponses = responses;
        const correctCount = responses.filter(r => r.isCorrect).length;
        candidate.mcqScore = Math.round((correctCount / candidate.mcqQuestions.length) * 100);
        candidate.assessmentPhase = 'coding';
        candidate.updatedAt = new Date().toISOString();
        if (state.currentCandidate?.id === candidate.id) {
          state.currentCandidate = candidate;
        }
      }
    },
    setCodingQuestion: (state, action: PayloadAction<{ candidateId: string; question: CodingQuestion }>) => {
      const candidate = state.candidates.find(c => c.id === action.payload.candidateId);
      if (candidate) {
        candidate.codingQuestion = action.payload.question;
        candidate.assessmentPhase = 'coding';
        candidate.updatedAt = new Date().toISOString();
        if (state.currentCandidate?.id === candidate.id) {
          state.currentCandidate = candidate;
        }
      }
    },
    recordCodingResponse: (state, action: PayloadAction<{ candidateId: string; response: CodingResponse }>) => {
      const candidate = state.candidates.find(c => c.id === action.payload.candidateId);
      if (candidate) {
        candidate.codingResponse = action.payload.response;
        candidate.updatedAt = new Date().toISOString();
        if (state.currentCandidate?.id === candidate.id) {
          state.currentCandidate = candidate;
        }
      }
    },
    finalizeCodingAssessment: (state, action: PayloadAction<{ candidateId: string; score: number }>) => {
      const candidate = state.candidates.find(c => c.id === action.payload.candidateId);
      if (candidate) {
        candidate.codingScore = action.payload.score;
        candidate.assessmentPhase = 'technical';
        candidate.updatedAt = new Date().toISOString();
        if (state.currentCandidate?.id === candidate.id) {
          state.currentCandidate = candidate;
        }
      }
    },
    clearCurrentCandidate: (state) => {
      state.currentCandidate = undefined;
    },
    deleteCandidate: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.candidates = state.candidates.filter(c => c.id !== id);
      if (state.currentCandidate?.id === id) {
        state.currentCandidate = undefined;
      }
    },
  },
});

export const {
  addCandidate,
  updateCandidate,
  setCurrentCandidate,
  addAnswer,
  updateInterviewStatus,
  setFinalScore,
  setAssessmentPhase,
  setMCQQuestions,
  recordMCQResponse,
  finalizeMCQAssessment,
  setCodingQuestion,
  recordCodingResponse,
  finalizeCodingAssessment,
  clearCurrentCandidate,
  deleteCandidate,
} = candidateSlice.actions;

export default candidateSlice.reducer;
