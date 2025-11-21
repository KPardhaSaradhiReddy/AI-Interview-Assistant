export interface Question {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number; // in seconds
  category: string;
  expectedAnswer?: string;
}

export interface Answer {
  questionId: string;
  text: string;
  timeSpent: number; // in seconds
  score?: number;
  submittedAt: string;
}

export interface MCQQuestion {
  id: string;
  question: string;
  category: 'aptitude' | 'logical' | 'english' | 'programming';
  options: string[];
  correctOption: number;
}

export interface MCQResponse {
  questionId: string;
  selectedOption?: number;
  isCorrect?: boolean;
}

export interface CodingQuestion {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  examples: Array<{ input: string; output: string; explanation?: string }>;
  constraints?: string[];
  functionSignature?: string;
  starterCode?: string;
  leetcodeId?: string;
}

export interface CodingResponse {
  questionId: string;
  code: string;
  language: string;
  submittedAt: string;
  timeSpent: number;
  score?: number;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeFileName?: string;
  resumeText?: string;
  interviewStatus: 'not_started' | 'in_progress' | 'completed';
  currentQuestionIndex: number;
  questions: Question[];
  answers: Answer[];
  assessmentPhase?: 'mcq' | 'coding' | 'technical' | 'completed';
  mcqQuestions?: MCQQuestion[];
  mcqResponses?: MCQResponse[];
  mcqScore?: number;
  codingQuestion?: CodingQuestion;
  codingResponse?: CodingResponse;
  codingScore?: number;
  finalScore?: number;
  aiSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewState {
  isInterviewActive: boolean;
  currentQuestion?: Question;
  timeRemaining: number;
  isPaused: boolean;
  phase: 'mcq' | 'coding' | 'technical' | 'completed';
  timeLimit: number;
}

export interface UIState {
  activeTab: 'interviewee' | 'interviewer';
  isLoading: boolean;
  error?: string;
  showWelcomeBackModal: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  interviewerEmail: string | null;
  interviewerName: string | null;
}

export interface AppState {
  candidates: Candidate[];
  interview: InterviewState;
  ui: UIState;
  auth: AuthState;
}
