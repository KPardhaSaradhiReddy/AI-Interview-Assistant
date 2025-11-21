# AI-Powered Interview Assistant

A comprehensive React application that provides an AI-powered interview experience for both candidates and interviewers. Features a modern dark theme, multi-phase assessment system, voice interaction, and advanced analytics dashboard.

## 🎯 Key Features

### 📋 Assessment Flow
The interview process consists of three phases in the following order:
1. **MCQ Assessment** (10 minutes) - 10 multiple-choice questions
   - 3 Aptitude questions
   - 2 Logical Reasoning questions
   - 2 English questions
   - 3 Programming questions
2. **Coding Challenge** (30 minutes) - LeetCode easy-level problem
   - Code editor with syntax highlighting
   - Multiple language support (JavaScript, TypeScript, Python, Java, C++)
   - Problem description with examples and constraints
3. **Technical Interview** (5 minutes) - 6 AI-generated questions
   - 2 Easy questions (50 seconds each)
   - 2 Medium questions (90 seconds each)
   - 2 Hard questions (150 seconds each)
   - Voice-enabled question reading and answer recording

### 🎨 Modern UI/UX
- **Dark Theme**: Engaging dark theme with gradient backgrounds
- **Interactive Charts**: Comprehensive analytics dashboard with:
  - Score distribution charts
  - Status distribution pie charts
  - Category performance analysis
  - Recent performance trends
- **Enhanced Visuals**: Smooth animations, glassmorphism effects, and modern design

### 🗣️ Voice Features
- **Text-to-Speech (TTS)**: Female AI voice reads questions aloud during technical interview
- **Speech-to-Text (STT)**: Microphone recording for voice answers with live transcription
- **Voice Controls**: Play/pause for questions, record/stop for answers
- **Smart Integration**: Voice features enabled only during technical interview phase

### 📄 Resume Processing
- **File Validation**: Filename must contain "resume" (e.g., `JohnDoe.Resume.pdf`)
- **Auto Name Extraction**: Automatically extracts candidate name from filename
- **Smart Parsing**: AI-powered extraction of Name, Email, Phone from resume content
- **Format Support**: PDF and DOCX file formats
- **Name Priority**: Uses resume content name first, falls back to filename extraction

### 🤖 AI Integration (Google Gemini API)
- **Dynamic Question Generation**: Unique questions for each interview using Gemini API
- **Question Variation**: Advanced prompts ensure different questions each time (not just reordered)
- **Skills-Based Questions**: Questions generated strictly from resume's technical skills section
- **Answer Evaluation**: AI-powered scoring with detailed feedback
- **Summary Generation**: Professional candidate assessments

### 📊 Interviewer Dashboard
- **Comprehensive Analytics**: 
  - Total candidates, completed interviews, in-progress status
  - Average scores across all candidates
  - Score distribution charts
  - Category performance (MCQ, Coding, Technical)
  - Recent performance trends
- **Candidate Management**:
  - Search and filter candidates
  - View detailed candidate profiles
  - Delete candidate records
  - Track progress and scores
- **Authentication**: Secure login system for interviewers

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Gemini API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-interview-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file in the root directory:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_GEMINI_MODEL_FAST=gemini-1.5-flash
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

## 📁 Project Structure

```
src/
├── components/                # React components
│   ├── APIStatusNotification.tsx  # API status notifications
│   ├── ChatInterface.tsx          # Main interview interface with voice features
│   ├── IntervieweeTab.tsx         # Candidate interview interface
│   ├── InterviewerLogin.tsx        # Interviewer authentication
│   ├── InterviewerTab.tsx         # Enhanced dashboard with charts
│   ├── Layout.tsx                 # Main layout with dark theme
│   ├── ProtectedRoute.tsx         # Route protection for interviewers
│   ├── ResumeUpload.tsx           # Resume upload with validation
│   ├── Timer.tsx                  # Timer component
│   └── WelcomeBackModal.tsx       # Session recovery modal
├── data/                     # Static data
│   ├── codingQuestions.ts        # LeetCode easy questions
│   └── mcqQuestions.ts           # MCQ question bank
├── hooks/                    # Custom React hooks
│   └── useAPIStatus.ts       # API status management hook
├── services/                 # Business logic services
│   ├── aiService.ts         # Gemini AI integration
│   ├── mcqService.ts        # MCQ question service
│   └── resumeParser.ts      # Resume parsing logic
├── store/                    # Redux state management
│   ├── slices/              # Redux slices
│   │   ├── authSlice.ts         # Authentication state
│   │   ├── candidateSlice.ts    # Candidate state management
│   │   ├── interviewSlice.ts     # Interview state management
│   │   └── uiSlice.ts           # UI state management
│   └── store.ts             # Redux store configuration
├── tests/                   # Test files
│   ├── ai-functionality-demo.test.ts
│   ├── api-fallback.test.ts
│   ├── basic-requirements.test.ts
│   ├── question-limit.test.ts
│   ├── requirements-compliance.test.ts
│   └── setup.ts
├── types/                   # TypeScript type definitions
│   └── index.ts             # Type definitions
├── utils/                   # Utility functions
│   └── offlineMode.ts       # Offline mode utilities
├── App.tsx                  # Main application component
├── App.css                  # Application styles with dark theme
├── index.css                # Global styles
└── main.tsx                 # Application entry point
```

## 📖 Usage Guide

### For Candidates

1. **Upload Resume**:
   - Navigate to the Interviewee tab
   - Upload your resume file (PDF or DOCX)
   - **Important**: Filename must contain "resume" (e.g., `YourName.Resume.pdf`)
   - The system will automatically extract your name from the filename

2. **Complete Profile**:
   - Review auto-filled information (Name, Email, Phone)
   - Fill in any missing fields
   - Click "Start Interview"

3. **MCQ Assessment** (10 minutes):
   - Answer 10 multiple-choice questions
   - Questions cover aptitude, logical reasoning, English, and programming
   - Voice controls are disabled for this section
   - Submit when all questions are answered or timer expires

4. **Coding Challenge** (30 minutes):
   - Solve one LeetCode easy-level problem
   - Write your solution in the code editor
   - Choose your preferred programming language
   - Submit your solution

5. **Technical Interview** (5 minutes):
   - Answer 6 AI-generated questions based on your resume
   - Use voice features:
     - Click "Read Aloud" to hear questions
     - Click "Record Answer" to speak your response
   - Type or speak your answers
   - Questions are automatically submitted when time expires

6. **View Results**:
   - See your scores for MCQ, Coding, and Technical sections
   - Review AI-generated summary
   - View detailed feedback

### For Interviewers

1. **Login**:
   - Navigate to Interviewer tab
   - Enter your credentials (demo mode available)
   - Access the secure dashboard

2. **View Dashboard**:
   - See comprehensive statistics and charts
   - Monitor candidate performance trends
   - Analyze score distributions

3. **Manage Candidates**:
   - Search candidates by name or email
   - Filter by interview status
   - View detailed candidate profiles
   - Delete candidate records if needed

4. **Review Performance**:
   - View individual candidate assessments
   - Review MCQ responses and scores
   - Check coding solutions
   - Read technical interview Q&A
   - Analyze AI-generated summaries

## 🔧 Technical Details

### Assessment Phases

#### Phase 1: MCQ Assessment
- **Duration**: 10 minutes
- **Questions**: 10 MCQs (3 aptitude, 2 logical, 2 English, 3 programming)
- **Source**: GeeksforGeeks API integration (with fallback to local question bank)
- **Features**: Randomized questions, automatic scoring

#### Phase 2: Coding Challenge
- **Duration**: 30 minutes
- **Type**: LeetCode easy-level problem
- **Features**: 
  - Code editor with syntax highlighting
  - Multiple language support
  - Problem description with examples
  - Constraints and test cases

#### Phase 3: Technical Interview
- **Duration**: 5 minutes (total for all 6 questions)
- **Questions**: 6 AI-generated questions (2 easy, 2 medium, 2 hard)
- **Source**: Google Gemini API
- **Features**:
  - Questions generated from resume's technical skills section
  - Unique questions for each interview
  - Voice-enabled interaction
  - Automatic submission on timeout

### AI Question Generation

The system uses Google Gemini API to generate unique questions:

- **Variation Mechanisms**:
  - Unique interview ID for each session
  - Variation seed (timestamp + random number)
  - Random focus angles (performance, security, scalability, etc.)
  - Random scenario contexts (production, startup, enterprise, etc.)
  - Random question styles (scenario-based, code review, troubleshooting, etc.)
  - Maximum temperature (1.0) for maximum variation

- **Question Requirements**:
  - Generated strictly from resume's technical skills section
  - Exactly 6 questions (2 easy, 2 medium, 2 hard)
  - Completely unique for each interview (not just reordered)
  - Real-world scenarios and practical applications

### File Naming Requirements

Resume files must follow this format:
- **Required**: Filename must contain "resume" (case-insensitive)
- **Examples**:
  - `JohnDoe.Resume.pdf` ✅
  - `Jane_Smith.resume.docx` ✅
  - `RobertJohnsonResume.pdf` ✅
  - `document.pdf` ❌ (will show error popup)

### Name Extraction

The system automatically extracts candidate names from:
1. **Resume Content**: AI-powered extraction from resume text
2. **Filename**: Fallback extraction from filename
   - Handles formats: `Name.Resume.pdf`, `Name_Resume.pdf`, `NameResume.pdf`
   - Converts to proper Title Case
   - Handles camelCase conversion

## 🎨 UI/UX Features

### Dark Theme
- Modern gradient backgrounds
- Glassmorphism effects
- Smooth animations
- Enhanced visual hierarchy
- Improved readability

### Interactive Charts
- **Bar Charts**: Score distribution, category performance
- **Pie Charts**: Status distribution
- **Area Charts**: Performance trends over time
- **Real-time Updates**: Charts update as new data arrives

### Voice Interface
- **Female AI Voice**: Natural-sounding voice for questions
- **Live Transcription**: Real-time speech-to-text conversion
- **Visual Feedback**: Clear indicators for speaking/recording states
- **Error Handling**: Graceful fallback if voice features unavailable

## 🔐 Authentication

### Interviewer Login
- Secure authentication system
- Protected routes for interviewer dashboard
- Session management
- Logout functionality

## 📊 Analytics Dashboard

### Statistics Cards
- Total Candidates
- Completed Interviews
- In Progress
- Average Score

### Charts & Graphs
- **Score Distribution**: Visual breakdown of candidate scores
- **Status Distribution**: Pie chart of interview statuses
- **Category Performance**: Average scores by assessment type
- **Performance Trends**: Line chart showing recent performance

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **State Management**: Redux Toolkit + Redux Persist
- **UI Library**: Ant Design
- **Charts**: Recharts
- **AI Integration**: Google Gemini API (@google/generative-ai)
- **File Processing**: PDF.js + mammoth.js
- **Routing**: React Router DOM
- **Build Tool**: Vite
- **Styling**: CSS with dark theme
- **Voice**: Web Speech API (SpeechSynthesis & SpeechRecognition)

## 🔄 API Integration

### Google Gemini API
- **Question Generation**: Dynamic, unique questions per interview
- **Answer Evaluation**: AI-powered scoring
- **Summary Generation**: Professional candidate assessments
- **Fallback System**: Automatic fallback when API unavailable

### GeeksforGeeks API (MCQ)
- **Question Source**: Programming and aptitude questions
- **Fallback**: Local question bank if API unavailable
- **Randomization**: Ensures variety in questions

## 📝 Data Persistence

All application data is stored locally using:
- **Redux Persist**: State management with localStorage
- **Session Recovery**: Automatic restoration of unfinished interviews
- **Cross-tab Sync**: Real-time synchronization between tabs
- **Candidate Data**: All interview data persisted locally

## 🧪 Testing

Comprehensive test suite covering:
- AI functionality demonstration
- API fallback mechanisms
- Core requirements validation
- Question limit enforcement
- Requirements compliance

## 🐛 Error Handling

- **File Validation**: Clear error messages for invalid filenames
- **API Errors**: Graceful fallback to offline mode
- **Voice Errors**: Fallback to text-only mode
- **Network Issues**: Automatic retry mechanisms
- **User Feedback**: Clear error messages and notifications

## 🚨 Important Notes

### API Configuration
- **Gemini API Key**: Required for AI features
- **Rate Limits**: System handles quota limits gracefully
- **Fallback Mode**: All features work offline with fallback systems

### Browser Compatibility
- Chrome 90+ (recommended for voice features)
- Firefox 88+
- Safari 14+
- Edge 90+

### File Requirements
- **Format**: PDF or DOCX
- **Size**: Maximum 10MB
- **Naming**: Must contain "resume" in filename
- **Example**: `YourName.Resume.pdf`

## 📈 Recent Updates

### Latest Features
- ✅ Dark theme with modern UI/UX
- ✅ Three-phase assessment system (MCQ → Coding → Technical)
- ✅ Voice features (TTS and STT)
- ✅ Enhanced interviewer dashboard with charts
- ✅ File naming validation
- ✅ Auto name extraction from filename
- ✅ Google Gemini API integration
- ✅ Unique question generation per interview
- ✅ Coding challenge section with LeetCode questions
- ✅ Interviewer authentication system
- ✅ Comprehensive analytics and reporting

### Performance Improvements
- Optimized question generation
- Enhanced variation mechanisms
- Improved error handling
- Better user feedback
- Streamlined assessment flow

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

[Add your license information here]

## 👥 Contact

For questions about this project, please contact [your-email@example.com]

---

**Built with ❤️ using React, TypeScript, and Google Gemini AI**
"# AI-Interview-Assistant" 
"# AI-Interview-Assistant" 
"# AI-Interview-Assistant" 
