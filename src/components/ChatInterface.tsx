import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, Input, Button, Typography, Progress, Alert, Space, Avatar, Tooltip, Radio } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, AudioOutlined, AudioMutedOutlined, SoundOutlined, PauseOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { addAnswer, updateInterviewStatus, setFinalScore, setAssessmentPhase, setMCQQuestions, recordMCQResponse, finalizeMCQAssessment, setCodingQuestion, recordCodingResponse, finalizeCodingAssessment } from '../store/slices/candidateSlice';
import { setCurrentQuestion, submitAnswer, updateTimeRemaining, endInterview, startMCQPhase, startCodingPhase, startTechnicalPhase, TECHNICAL_TIME_LIMIT, MCQ_TIME_LIMIT, CODING_TIME_LIMIT } from '../store/slices/interviewSlice';
import { evaluateAnswerWithAI, generateSummaryWithAI } from '../services/aiService';
import Timer from './Timer';
import type { Answer, MCQQuestion } from '../types';
import { fetchMCQsFromGeeksforGeeks, getDefaultMCQQuestions } from '../services/mcqService';
import { getRandomCodingQuestion } from '../data/codingQuestions';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface ChatInterfaceProps {}

interface Message {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
}

const ChatInterface: React.FC<ChatInterfaceProps> = () => {
  const dispatch = useDispatch();
  const interview = useSelector((state: RootState) => state.interview);
  const currentCandidate = useSelector((state: RootState) => state.candidates.currentCandidate);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [sttError, setSttError] = useState<string | null>(null);
  const questionStartTimeRef = useRef<number>(MCQ_TIME_LIMIT);
  const timeUpHandledRef = useRef(false);
  const completionStartedRef = useRef(false);
  const [codingCode, setCodingCode] = useState('');
  const [codingLanguage, setCodingLanguage] = useState('javascript');
  const [focusLost, setFocusLost] = useState(false);
  const focusLostRef = useRef(false);
  const [currentMCQIndex, setCurrentMCQIndex] = useState(0);
  const isMCQPhase = interview.phase === 'mcq';
  const isCodingPhase = interview.phase === 'coding';
  const isTechnicalPhase = interview.phase === 'technical';
  const mcqQuestions = currentCandidate?.mcqQuestions ?? [];
  const mcqResponses = currentCandidate?.mcqResponses ?? [];
  const answeredMcqs = useMemo(
    () => mcqResponses.filter(response => typeof response.selectedOption === 'number').length,
    [mcqResponses],
  );
  const totalMcqs = mcqQuestions.length;
  const allMCQsAnswered = totalMcqs > 0 && answeredMcqs === totalMcqs;
  const currentMCQ = mcqQuestions[currentMCQIndex];
  const currentMCQResponse = currentMCQ ? mcqResponses.find(r => r.questionId === currentMCQ.id) : null;

  console.log('ChatInterface render - candidate:', currentCandidate);
  console.log('ChatInterface render - interview:', interview);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load voices when component mounts
  useEffect(() => {
    if ('speechSynthesis' in window) {
      // Load voices immediately if available
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        // Wait for voices to load
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }, []);

  // Text-to-Speech helpers with female AI voice
  const speak = (text: string) => {
    try {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      
      // Get available voices and select a female voice
      const voices = window.speechSynthesis.getVoices();
      let femaleVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('zira') || // Windows female voice
        voice.name.toLowerCase().includes('samantha') || // macOS female voice
        voice.name.toLowerCase().includes('karen') || // macOS female voice
        voice.name.toLowerCase().includes('susan') || // macOS female voice
        voice.name.toLowerCase().includes('victoria') || // macOS female voice
        voice.name.toLowerCase().includes('fiona') || // macOS female voice
        voice.name.toLowerCase().includes('kate') || // macOS female voice
        voice.name.toLowerCase().includes('sarah') // macOS female voice
      );
      
      // Fallback: try to find any English female voice by checking voice name patterns
      if (!femaleVoice) {
        femaleVoice = voices.find(voice => 
          voice.lang.startsWith('en') && 
          (voice.name.toLowerCase().includes('zira') ||
           voice.name.toLowerCase().includes('samantha') ||
           voice.name.toLowerCase().includes('karen') ||
           voice.name.toLowerCase().includes('susan') ||
           voice.name.toLowerCase().includes('victoria') ||
           voice.name.toLowerCase().includes('fiona') ||
           voice.name.toLowerCase().includes('kate') ||
           voice.name.toLowerCase().includes('sarah'))
        );
      }
      
      // If still no female voice found, use first available English voice
      if (!femaleVoice) {
        femaleVoice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
      }
      
      const utter = new SpeechSynthesisUtterance(text);
      if (femaleVoice) {
        utter.voice = femaleVoice;
      }
      utter.rate = 0.95; // Slightly slower for clarity
      utter.pitch = 1.1; // Slightly higher pitch for female voice
      utter.volume = 1.0;
      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);
      
      // Wait for voices to load if not available yet
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          const updatedVoices = window.speechSynthesis.getVoices();
          const updatedFemaleVoice = updatedVoices.find(voice => 
            voice.name.toLowerCase().includes('female') ||
            voice.name.toLowerCase().includes('zira') ||
            voice.name.toLowerCase().includes('samantha') ||
            voice.name.toLowerCase().includes('karen') ||
            voice.name.toLowerCase().includes('susan') ||
            voice.name.toLowerCase().includes('victoria') ||
            voice.name.toLowerCase().includes('fiona') ||
            voice.name.toLowerCase().includes('kate') ||
            voice.name.toLowerCase().includes('sarah') ||
            false // gender property not available in SpeechSynthesisVoice
          ) || updatedVoices.find(voice => voice.lang.startsWith('en')) || updatedVoices[0];
          
          if (updatedFemaleVoice) {
            utter.voice = updatedFemaleVoice;
          }
          window.speechSynthesis.speak(utter);
        };
      } else {
        window.speechSynthesis.speak(utter);
      }
    } catch {
      setIsSpeaking(false);
    }
  };
  const stopSpeaking = () => {
    try {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } catch {
      /* noop */
    }
  };

  // Auto speak current question (technical phase only)
  useEffect(() => {
    if (!isTechnicalPhase || !interview.currentQuestion || !currentCandidate) {
      stopSpeaking();
      return;
    }
    const text = `Question ${currentCandidate.currentQuestionIndex + 1}. ${interview.currentQuestion.text}`;
    speak(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTechnicalPhase, interview.currentQuestion, currentCandidate?.currentQuestionIndex]);

  // Speech-to-Text (Web Speech API)
  const startRecording = () => {
    if (isRecording) return;
    setSttError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSttError('Speech recognition is not supported in this browser.');
      return;
    }
    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      setCurrentAnswer(() => {
        // Replace when recording, not append blindly
        return transcript.trim();
      });
    };
    recognition.onerror = (e: any) => {
      setSttError(e?.error || 'Speech recognition error');
      setIsRecording(false);
    };
    recognition.onend = () => {
      setIsRecording(false);
    };
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* noop */
      }
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  // Initialize MCQ phase when interview starts
  useEffect(() => {
    if (currentCandidate && interview.isInterviewActive && interview.phase === 'mcq' && !currentCandidate.mcqQuestions?.length) {
      // Fetch MCQs from GeeksforGeeks API or use fallback
      fetchMCQsFromGeeksforGeeks().then(mcqSet => {
        dispatch(setMCQQuestions({ candidateId: currentCandidate.id, questions: mcqSet }));
        dispatch(setAssessmentPhase({ candidateId: currentCandidate.id, phase: 'mcq' }));
        // Reset to first question
        setCurrentMCQIndex(0);
      }).catch(() => {
        // Fallback to default questions if API fails
        const mcqSet = getDefaultMCQQuestions();
        dispatch(setMCQQuestions({ candidateId: currentCandidate.id, questions: mcqSet }));
        dispatch(setAssessmentPhase({ candidateId: currentCandidate.id, phase: 'mcq' }));
        // Reset to first question
        setCurrentMCQIndex(0);
      });
    }
  }, [currentCandidate, interview.isInterviewActive, interview.phase]);

  // Reset MCQ index when phase changes
  useEffect(() => {
    if (interview.phase === 'mcq' && mcqQuestions.length > 0) {
      // Find first unanswered question
      const firstUnansweredIndex = mcqQuestions.findIndex(q => 
        !mcqResponses.find(r => r.questionId === q.id && typeof r.selectedOption === 'number')
      );
      if (firstUnansweredIndex !== -1) {
        setCurrentMCQIndex(firstUnansweredIndex);
      } else {
        setCurrentMCQIndex(0);
      }
    }
  }, [interview.phase, mcqQuestions.length]);

  const startCodingRound = () => {
    if (!currentCandidate) return;
    const codingQuestion = getRandomCodingQuestion();
    dispatch(setCodingQuestion({ candidateId: currentCandidate.id, question: codingQuestion }));
    dispatch(startCodingPhase());
    timeUpHandledRef.current = false;
    questionStartTimeRef.current = CODING_TIME_LIMIT;
    stopRecording();
    stopSpeaking();
    setCodingCode(codingQuestion.starterCode || '');
    setMessages(prev => [
      ...prev,
      {
        id: `coding-${Date.now()}`,
        type: 'ai',
        content:
          `MCQ round complete! Next up: Coding challenge. You have 30 minutes to solve one LeetCode easy problem. Voice controls are disabled for this section.`,
        timestamp: new Date(),
      },
    ]);
  };

  const handleCodingSubmit = () => {
    if (!currentCandidate || !currentCandidate.codingQuestion) return;
    
    const codingResponse = {
      questionId: currentCandidate.codingQuestion.id,
      code: codingCode,
      language: codingLanguage,
      submittedAt: new Date().toISOString(),
      timeSpent: CODING_TIME_LIMIT - interview.timeRemaining,
    };
    
    dispatch(recordCodingResponse({ candidateId: currentCandidate.id, response: codingResponse }));
    
    // Simple scoring based on code completion (can be enhanced with actual code evaluation)
    const score = codingCode.trim().length > 50 ? 75 : 50; // Basic heuristic
    dispatch(finalizeCodingAssessment({ candidateId: currentCandidate.id, score }));
    
    // Move to technical phase
    startTechnicalRound();
  };

  const startTechnicalRound = () => {
    if (!currentCandidate) return;
    if (!currentCandidate.questions || currentCandidate.questions.length === 0) {
      console.error('No technical questions available');
      return;
    }
    
    dispatch(startTechnicalPhase({ questions: currentCandidate.questions }));
    dispatch(setCurrentQuestion(currentCandidate.questions[0]));
    dispatch(setAssessmentPhase({ candidateId: currentCandidate.id, phase: 'technical' }));
    timeUpHandledRef.current = false;
    questionStartTimeRef.current = TECHNICAL_TIME_LIMIT;
    setMessages(prev => [
      ...prev,
      {
        id: `technical-${Date.now()}`,
        type: 'ai',
        content:
          'Coding round complete! Now let\'s move to the technical interview. You have 5 minutes to answer 6 questions. Voice controls are enabled for this section.',
        timestamp: new Date(),
      },
    ]);
    
    // Speak the first question
    if (currentCandidate.questions[0]) {
      speak(currentCandidate.questions[0].text);
    }
  };

  const handleMCQSelection = (questionId: string, selectedOption: number) => {
    if (!currentCandidate) return;
    dispatch(recordMCQResponse({ candidateId: currentCandidate.id, questionId, selectedOption }));
  };

  const handleMCQQuestionSubmit = () => {
    if (!currentCandidate || !currentMCQ) return;
    
    // If no option selected, don't allow submission
    if (currentMCQResponse?.selectedOption === undefined) {
      return;
    }
    
    // Move to next question
    if (currentMCQIndex < totalMcqs - 1) {
      setCurrentMCQIndex(currentMCQIndex + 1);
    } else {
      // All questions answered, finalize and move to coding
      handleMCQSubmit();
    }
  };

  const handleMCQSubmit = () => {
    if (!currentCandidate) return;
    dispatch(finalizeMCQAssessment({ candidateId: currentCandidate.id }));
    startCodingRound();
  };

  // Timer update effect (single timer for entire interview)
  useEffect(() => {
    if (!interview.isInterviewActive || interview.isPaused) return;
    if (interview.timeRemaining <= 0) return;

    const timer = setTimeout(() => {
      const newTime = interview.timeRemaining - 1;
      dispatch(updateTimeRemaining(newTime));
    }, 1000);

    return () => clearTimeout(timer);
  }, [interview.isInterviewActive, interview.timeRemaining, interview.isPaused, dispatch]);

  // Handle time up once
  useEffect(() => {
    if (interview.isInterviewActive && interview.timeRemaining <= 0 && !timeUpHandledRef.current) {
      timeUpHandledRef.current = true;
      handleTimeUp();
    }
  }, [interview.isInterviewActive, interview.timeRemaining]);

  // Reset flags when interview starts/ends
  useEffect(() => {
    if (interview.isInterviewActive) {
      timeUpHandledRef.current = false;
      completionStartedRef.current = false;
    } else {
      questionStartTimeRef.current = TECHNICAL_TIME_LIMIT;
    }
  }, [interview.isInterviewActive]);

  useEffect(() => {
    if (interview.phase === 'mcq') {
      questionStartTimeRef.current = MCQ_TIME_LIMIT;
    } else if (interview.phase === 'coding') {
      questionStartTimeRef.current = CODING_TIME_LIMIT;
    } else if (interview.phase === 'technical') {
      questionStartTimeRef.current = interview.timeRemaining || TECHNICAL_TIME_LIMIT;
    }
    timeUpHandledRef.current = false;
  }, [interview.phase, interview.timeRemaining]);


  useEffect(() => {
    if (!interview.currentQuestion || !currentCandidate) {
      return;
    }
    // Build chat history with previous Q&A pairs and current question
    const chatHistory: Message[] = [];
    
    // Add previous Q&A pairs
    for (let i = 0; i < currentCandidate.currentQuestionIndex; i++) {
      const question = currentCandidate.questions[i];
      const answer = currentCandidate.answers[i];
      
      if (question) {
        chatHistory.push({
          id: `q-${question.id}`,
          type: 'ai',
          content: `Question ${i + 1}/${currentCandidate.questions.length} (${question.difficulty.toUpperCase()}): ${question.text}`,
          timestamp: new Date(),
        });
      }
      
      if (answer) {
        chatHistory.push({
          id: `a-${answer.questionId}`,
          type: 'user',
          content: answer.text,
          timestamp: new Date(answer.submittedAt),
        });
      }
    }
    
    // Add current question
    const currentQuestionMessage: Message = {
      id: `q-${interview.currentQuestion.id}`,
      type: 'ai',
      content: `Question ${currentCandidate.currentQuestionIndex + 1}/${currentCandidate.questions.length} (${interview.currentQuestion.difficulty.toUpperCase()}): ${interview.currentQuestion.text}`,
      timestamp: new Date(),
    };
    chatHistory.push(currentQuestionMessage);
    
    setMessages(chatHistory);
  }, [interview.currentQuestion, currentCandidate?.currentQuestionIndex, currentCandidate?.questions, currentCandidate?.answers, currentCandidate]);

  // Track when each question becomes active to measure time spent
  useEffect(() => {
    if (interview.currentQuestion) {
      questionStartTimeRef.current = interview.timeRemaining;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interview.currentQuestion]);

  useEffect(() => {
    if (!currentCandidate) return;
    if (currentCandidate.assessmentPhase === 'mcq' && interview.phase !== 'mcq') {
      dispatch(startMCQPhase());
    }
  }, [currentCandidate?.assessmentPhase, interview.phase, dispatch]);

  // Handle focus loss - automatically submit interview when user switches tabs/windows
  useEffect(() => {
    if (!interview.isInterviewActive || !currentCandidate) return;

    const handleFocusLoss = () => {
      // Check if focus was already lost to prevent multiple submissions
      if (focusLostRef.current || completionStartedRef.current) return;
      
      // Check if document is hidden (tab switched or window minimized)
      if (document.hidden) {
        focusLostRef.current = true;
        setFocusLost(true);
        
        console.warn('⚠️ Focus lost - Interview will be automatically submitted');
        
        // Stop any ongoing activities
        stopRecording();
        stopSpeaking();
        
        // Auto-submit based on current phase
        const phase = interview.phase;
        const candidate = currentCandidate;
        
        if (phase === 'mcq') {
          // Submit current MCQ responses
          if (candidate.mcqResponses && candidate.mcqResponses.length > 0) {
            dispatch(finalizeMCQAssessment({ candidateId: candidate.id }));
          }
          // Move to next phase or complete
          setTimeout(() => {
            if (candidate.codingQuestion) {
              const codingQuestion = getRandomCodingQuestion();
              dispatch(setCodingQuestion({ candidateId: candidate.id, question: codingQuestion }));
              dispatch(startCodingPhase());
              setCodingCode(codingQuestion.starterCode || '');
            } else {
              // Complete interview if no coding phase
              handleInterviewCompletion();
            }
          }, 100);
        } else if (phase === 'coding') {
          // Submit coding response
          const codingResponse = {
            questionId: candidate.codingQuestion?.id || '',
            code: codingCode || '',
            language: codingLanguage,
            submittedAt: new Date().toISOString(),
            timeSpent: CODING_TIME_LIMIT - interview.timeRemaining,
          };
          dispatch(recordCodingResponse({ candidateId: candidate.id, response: codingResponse }));
          const score = codingCode.trim().length > 50 ? 75 : 50;
          dispatch(finalizeCodingAssessment({ candidateId: candidate.id, score }));
          // Move to technical phase
          setTimeout(() => {
            if (candidate.questions && candidate.questions.length > 0) {
              dispatch(startTechnicalPhase({ questions: candidate.questions }));
              dispatch(setCurrentQuestion(candidate.questions[0]));
              dispatch(setAssessmentPhase({ candidateId: candidate.id, phase: 'technical' }));
            } else {
              handleInterviewCompletion();
            }
          }, 100);
        } else if (phase === 'technical') {
          // Submit current answer if exists, then complete interview
          if (currentAnswer.trim() && interview.currentQuestion) {
            const timeSpent = Math.max(0, questionStartTimeRef.current - interview.timeRemaining);
            const answer: Answer = {
              questionId: interview.currentQuestion.id,
              text: currentAnswer,
              timeSpent,
              submittedAt: new Date().toISOString(),
            };
            dispatch(addAnswer({ candidateId: candidate.id, answer }));
          }
          // Complete the interview
          setTimeout(() => {
            handleInterviewCompletion();
          }, 100);
        }
      }
    };

    const handleVisibilityChange = () => {
      handleFocusLoss();
    };

    const handleBlur = () => {
      handleFocusLoss();
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interview.isInterviewActive, interview.phase, currentCandidate?.id, currentAnswer, codingCode, codingLanguage, interview.timeRemaining]);

  const handleSubmitAnswer = async () => {
    console.log('Submit button clicked!');
    console.log('Current answer:', currentAnswer);
    console.log('Current question:', interview.currentQuestion);
    console.log('Current candidate:', currentCandidate);
    
    if (!currentAnswer.trim() || !interview.currentQuestion || !currentCandidate) {
      console.log('Submit blocked - no answer, question, or candidate');
      return;
    }

    console.log('Starting submit process...');
    setIsSubmitting(true);
    
    const timeSpent = Math.max(0, questionStartTimeRef.current - interview.timeRemaining);

    const answer: Answer = {
      questionId: interview.currentQuestion.id,
      text: currentAnswer,
      timeSpent,
      submittedAt: new Date().toISOString(),
    };

    // Add user message to current messages
    const userMessage: Message = {
      id: `a-${Date.now()}`,
      type: 'user',
      content: currentAnswer,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Submit answer
    dispatch(addAnswer({ candidateId: currentCandidate.id, answer }));
    dispatch(submitAnswer());

    setCurrentAnswer('');

    // Move to next question or complete interview
    const nextQuestionIndex = currentCandidate.currentQuestionIndex + 1;
    console.log('Next question index:', nextQuestionIndex);
    console.log('Total questions:', currentCandidate.questions.length);
    
    // CRITICAL: Stop after exactly 6 questions (index 0-5, so nextQuestionIndex should be < 6)
    if (nextQuestionIndex >= 6) {
      console.log('✅ Technical interview completed! Reached 6 questions limit.');
      handleInterviewCompletion();
    } else if (nextQuestionIndex < currentCandidate.questions.length) {
      const nextQuestion = currentCandidate.questions[nextQuestionIndex];
      console.log('Moving to next question:', nextQuestion);
      dispatch(setCurrentQuestion(nextQuestion));
      dispatch(updateInterviewStatus({ 
        candidateId: currentCandidate.id, 
        status: 'in_progress' 
      }));
    } else {
      console.log('✅ Technical interview completed! No more questions available.');
      handleInterviewCompletion();
    }

    setIsSubmitting(false);
  };

  const handleInterviewCompletion = async () => {
    if (completionStartedRef.current || !currentCandidate) return;
    completionStartedRef.current = true;

    console.log('Starting interview completion process...');
    
    // Show evaluation message
    const evaluationMessage: Message = {
      id: `evaluate-${Date.now()}`,
      type: 'ai',
      content: 'Interview completed! Your responses are being evaluated...',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, evaluationMessage]);

    try {
      // Calculate scores for each answer
      const scoredAnswers = [];
      for (let i = 0; i < currentCandidate.answers.length; i++) {
        const answer = currentCandidate.answers[i];
        const question = currentCandidate.questions[i];
        
        if (question && answer) {
          console.log(`Evaluating answer ${i + 1}:`, answer.text);
          const score = await evaluateAnswerWithAI(question, answer.text);
          console.log(`Score for answer ${i + 1}:`, score);
          
          scoredAnswers.push({
            ...answer,
            score: score
          });
        }
      }

      // Calculate final score
      const totalScore = scoredAnswers.reduce((sum, answer) => sum + (answer.score || 0), 0);
      const technicalScore = scoredAnswers.length ? Math.round(totalScore / scoredAnswers.length) : 0;
      const mcqScore = currentCandidate.mcqScore || 0;
      const codingScore = currentCandidate.codingScore || 0;
      const scoreComponents: number[] = [];
      if (mcqScore > 0) scoreComponents.push(mcqScore);
      if (codingScore > 0) scoreComponents.push(codingScore);
      if (scoredAnswers.length) scoreComponents.push(technicalScore);
      const combinedScore = scoreComponents.length
        ? Math.round(scoreComponents.reduce((sum, value) => sum + value, 0) / scoreComponents.length)
        : 0;
      
      console.log('MCQ score:', mcqScore, 'Coding score:', codingScore, 'Technical score:', technicalScore, 'Final:', combinedScore);

      // Generate AI summary
      const summary = await generateSummaryWithAI(currentCandidate, currentCandidate.questions, scoredAnswers);
      console.log('Generated summary:', summary);

      // Update candidate with final score and summary
      dispatch(setFinalScore({ 
        candidateId: currentCandidate.id, 
        score: combinedScore, 
        summary: summary 
      }));

      // Show completion message with score
      const completionMessage: Message = {
        id: `complete-${Date.now()}`,
        type: 'ai',
        content: `🎉 Assessment completed! MCQ score: ${mcqScore}/100 · Coding score: ${codingScore}/100 · Technical score: ${technicalScore}/100 · Final score: ${combinedScore}/100.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, completionMessage]);

    } catch (error) {
      console.error('Error during interview completion:', error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'ai',
        content: 'There was an error evaluating your responses. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      dispatch(endInterview());
    }
  };

  const handleTimeUp = () => {
    console.log(`Timer expired for phase: ${interview.phase}`);
    stopRecording();
    stopSpeaking();
    if (!currentCandidate) return;

    if (interview.phase === 'mcq') {
      handleMCQSubmit();
    } else if (interview.phase === 'coding') {
      handleCodingSubmit();
    } else if (interview.phase === 'technical') {
      // CRITICAL: Ensure we stop after 6 questions even if timer expires
      const answeredCount = currentCandidate.answers.length;
      if (answeredCount >= 6) {
        console.log(`✅ Technical interview completed! Already answered ${answeredCount} questions.`);
        setCurrentAnswer('');
        handleInterviewCompletion();
      } else {
        // If timer expired but haven't answered all 6, still complete
        console.log(`⏱️ Timer expired. Completed ${answeredCount}/6 questions.`);
        setCurrentAnswer('');
        handleInterviewCompletion();
      }
    }
  };

  const getProgressPercentage = () => {
    if (!currentCandidate) return 0;
    if (currentCandidate.assessmentPhase === 'mcq') {
      if (!totalMcqs) return 0;
      return (answeredMcqs / totalMcqs) * 33.33; // MCQ is 1/3 of total
    }
    if (currentCandidate.assessmentPhase === 'coding') {
      return 66.66; // Coding is 2/3 of total
    }
    if (currentCandidate.assessmentPhase === 'technical') {
      if (!currentCandidate.questions.length) return 100;
      return 66.66 + ((currentCandidate.currentQuestionIndex + 1) / currentCandidate.questions.length) * 33.33;
    }
    return 0;
  };

  const getProgressLabel = () => {
    if (!currentCandidate) return '0/0';
    if (currentCandidate.assessmentPhase === 'mcq') {
      return `${answeredMcqs}/${totalMcqs} MCQs`;
    }
    if (currentCandidate.assessmentPhase === 'coding') {
      return 'Coding Challenge';
    }
    if (currentCandidate.assessmentPhase === 'technical') {
      if (!currentCandidate.questions.length) return '0/0 questions';
      return `${Math.min(currentCandidate.currentQuestionIndex + 1, currentCandidate.questions.length)}/${currentCandidate.questions.length} questions`;
    }
    return 'Starting...';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#52c41a';
      case 'medium': return '#faad14';
      case 'hard': return '#ff4d4f';
      default: return '#1890ff';
    }
  };

  const formatTotalTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {focusLost && (
        <Alert
          message="Interview Auto-Submitted"
          description="You switched to another tab or window. The interview has been automatically submitted to maintain integrity."
          type="warning"
          showIcon
          closable
          onClose={() => setFocusLost(false)}
          style={{ 
            marginBottom: '16px',
            background: 'rgba(250, 173, 20, 0.1)',
            border: '1px solid rgba(250, 173, 20, 0.3)',
            borderRadius: '8px'
          }}
        />
      )}
      <Card
        style={{
          background: 'linear-gradient(135deg, rgba(20, 25, 35, 0.95) 0%, rgba(15, 20, 30, 0.98) 100%)',
          border: '1px solid rgba(124, 92, 255, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(124, 92, 255, 0.1)',
          overflow: 'hidden'
        }}
        bodyStyle={{ padding: '24px' }}
      >
        {/* Enhanced Progress Section */}
        <div style={{ 
          marginBottom: '24px',
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(124, 92, 255, 0.1) 0%, rgba(0, 209, 255, 0.1) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(124, 92, 255, 0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <Title level={4} style={{ margin: 0, color: '#e3dfff', fontSize: '18px', fontWeight: 600 }}>
              📊 Assessment Progress
            </Title>
            <div style={{
              padding: '6px 16px',
              background: 'rgba(124, 92, 255, 0.2)',
              borderRadius: '20px',
              border: '1px solid rgba(124, 92, 255, 0.4)',
              color: '#e3dfff',
              fontSize: '14px',
              fontWeight: 600
            }}>
              {getProgressLabel()}
            </div>
          </div>
          <Progress 
            percent={getProgressPercentage()} 
            status="active"
            strokeColor={{
              '0%': '#7c5cff',
              '100%': '#00d1ff',
            }}
            trailColor="rgba(255, 255, 255, 0.1)"
            strokeWidth={8}
            style={{
              marginBottom: 0
            }}
            format={() => `${Math.round(getProgressPercentage())}%`}
          />
        </div>

        {currentCandidate && interview.isInterviewActive && (
          <Alert
            message="⚠️ Important: Tab Switching Policy"
            description="Switching to another tab, window, or application will automatically submit your interview. Please stay on this page during the assessment."
            type="warning"
            showIcon
            style={{ 
              marginBottom: '20px',
              background: 'rgba(250, 173, 20, 0.1)',
              border: '1px solid rgba(250, 173, 20, 0.3)',
              borderRadius: '8px'
            }}
          />
        )}

        {currentCandidate && (isTechnicalPhase || isMCQPhase || isCodingPhase) && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              padding: '20px',
              background: `linear-gradient(135deg, ${getDifficultyColor(interview.currentQuestion?.difficulty || (isMCQPhase ? 'medium' : isCodingPhase ? 'easy' : 'easy'))}15 0%, ${getDifficultyColor(interview.currentQuestion?.difficulty || (isMCQPhase ? 'medium' : isCodingPhase ? 'easy' : 'easy'))}08 100%)`,
              borderRadius: '12px',
              border: `2px solid ${getDifficultyColor(interview.currentQuestion?.difficulty || (isMCQPhase ? 'medium' : isCodingPhase ? 'easy' : 'easy'))}40`,
              boxShadow: `0 4px 20px ${getDifficultyColor(interview.currentQuestion?.difficulty || (isMCQPhase ? 'medium' : isCodingPhase ? 'easy' : 'easy'))}20`,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                background: getDifficultyColor(interview.currentQuestion?.difficulty || (isMCQPhase ? 'medium' : isCodingPhase ? 'easy' : 'easy')),
                borderRadius: '12px 0 0 12px'
              }} />
              <div style={{ paddingLeft: '16px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <div>
                    <div style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      background: getDifficultyColor(interview.currentQuestion?.difficulty || (isMCQPhase ? 'medium' : isCodingPhase ? 'easy' : 'easy')),
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      marginBottom: '8px'
                    }}>
                      {isTechnicalPhase
                        ? `${interview.currentQuestion?.difficulty.toUpperCase() || 'TECHNICAL'} QUESTION`
                        : isCodingPhase
                        ? 'CODING CHALLENGE'
                        : 'MCQ ASSESSMENT'}
                    </div>
                    {isTechnicalPhase && interview.currentQuestion && (
                      <div style={{ 
                        color: '#e3dfff', 
                        fontSize: '14px',
                        marginTop: '4px',
                        fontWeight: 500
                      }}>
                        Question {currentCandidate.currentQuestionIndex + 1} of {currentCandidate.questions.length}
                      </div>
                    )}
                  </div>
                  {(isTechnicalPhase || isCodingPhase) && (
                    <div style={{
                      padding: '8px 16px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '8px',
                      border: '1px solid rgba(124, 92, 255, 0.3)',
                      color: '#e3dfff',
                      fontSize: '16px',
                      fontWeight: 600,
                      fontFamily: 'monospace'
                    }}>
                      ⏱️ {formatTotalTime(interview.timeRemaining)}
                    </div>
                  )}
                </div>
                {isMCQPhase && (
                  <div style={{ color: '#e3dfff', fontSize: '14px', marginTop: '8px' }}>
                    Answer 10 MCQs (3 aptitude, 2 logical reasoning, 2 English, 3 programming) within 10 minutes. Voice controls are disabled for this section.
                  </div>
                )}
                {isCodingPhase && (
                  <div style={{ color: '#e3dfff', fontSize: '14px', marginTop: '8px' }}>
                    Solve one LeetCode easy problem within 30 minutes. Voice controls are disabled for this section.
                  </div>
                )}
              </div>
            </div>
            {isTechnicalPhase && interview.currentQuestion && (
              <div style={{ marginTop: '16px' }}>
                <Space style={{ width: '100%', justifyContent: 'center' }}>
                  <Tooltip title={isSpeaking ? 'Pause voice' : 'Read question aloud'}>
                    <Button
                      icon={isSpeaking ? <PauseOutlined /> : <SoundOutlined />}
                      onClick={() => {
                        if (isSpeaking) {
                          stopSpeaking();
                        } else if (interview.currentQuestion) {
                          speak(interview.currentQuestion.text);
                        }
                      }}
                      size="large"
                      style={{
                        background: isSpeaking 
                          ? 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)'
                          : 'linear-gradient(135deg, #7c5cff 0%, #5a3fd8 100%)',
                        border: 'none',
                        color: '#fff',
                        fontWeight: 600,
                        boxShadow: isSpeaking 
                          ? '0 4px 15px rgba(255, 77, 79, 0.4)'
                          : '0 4px 15px rgba(124, 92, 255, 0.4)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {isSpeaking ? '⏸️ Pause' : '🔊 Read Aloud'}
                    </Button>
                  </Tooltip>
                  <Tooltip title={isRecording ? 'Stop recording' : 'Record your answer'}>
                    <Button
                      icon={isRecording ? <AudioMutedOutlined /> : <AudioOutlined />}
                      onClick={() => {
                        if (isRecording) stopRecording();
                        else startRecording();
                      }}
                      danger={isRecording}
                      size="large"
                      style={{
                        background: isRecording
                          ? 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)'
                          : 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                        border: 'none',
                        color: '#fff',
                        fontWeight: 600,
                        boxShadow: isRecording
                          ? '0 4px 15px rgba(255, 77, 79, 0.4)'
                          : '0 4px 15px rgba(82, 196, 26, 0.4)',
                        transition: 'all 0.3s ease',
                        animation: isRecording ? 'pulse 2s infinite' : 'none'
                      }}
                    >
                      {isRecording ? '⏹️ Stop Recording' : '🎤 Record Answer'}
                    </Button>
                  </Tooltip>
                </Space>
                {sttError && (
                  <div style={{ marginTop: '12px' }}>
                    <Alert 
                      type="warning" 
                      message={sttError} 
                      showIcon 
                      style={{
                        background: 'rgba(250, 173, 20, 0.1)',
                        border: '1px solid rgba(250, 173, 20, 0.3)',
                        borderRadius: '8px'
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}


        {currentCandidate && (isTechnicalPhase || isMCQPhase || isCodingPhase) && (
          <div style={{ marginBottom: '16px' }}>
            <Timer
              timeRemaining={interview.timeRemaining}
              initialTime={interview.timeLimit}
              isPaused={interview.isPaused}
            />
          </div>
        )}

        {currentCandidate && currentCandidate.interviewStatus === 'in_progress' && currentCandidate.assessmentPhase !== 'mcq' && (
          <div style={{ width: '100%' }}>
            <div style={{
              marginBottom: '16px',
              padding: '16px',
              background: 'rgba(124, 92, 255, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(124, 92, 255, 0.3)'
            }}>
              <TextArea
                value={currentAnswer}
                onChange={(e) => {
                  console.log('Input change:', e.target.value);
                  setCurrentAnswer(e.target.value);
                }}
                placeholder="💭 Type your answer here... Be detailed and specific!"
                autoSize={{ minRows: 4, maxRows: 8 }}
                disabled={isSubmitting}
                style={{ 
                  width: '100%',
                  background: 'rgba(20, 25, 35, 0.8)',
                  border: '1px solid rgba(124, 92, 255, 0.4)',
                  borderRadius: '8px',
                  color: '#e3dfff',
                  fontSize: '15px',
                  padding: '12px'
                }}
              />
              <div style={{
                marginTop: '8px',
                fontSize: '12px',
                color: 'rgba(227, 223, 255, 0.6)',
                textAlign: 'right'
              }}>
                {currentAnswer.length} characters
              </div>
            </div>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => {
                console.log('Button clicked!');
                handleSubmitAnswer();
              }}
              loading={isSubmitting}
              disabled={!currentAnswer.trim()}
              size="large"
              block
              style={{ 
                height: '50px',
                background: currentAnswer.trim()
                  ? 'linear-gradient(135deg, #7c5cff 0%, #5a3fd8 100%)'
                  : 'rgba(124, 92, 255, 0.3)',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 600,
                boxShadow: currentAnswer.trim()
                  ? '0 6px 20px rgba(124, 92, 255, 0.4)'
                  : 'none',
                transition: 'all 0.3s ease',
                cursor: currentAnswer.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              {isSubmitting ? '⏳ Submitting...' : '✅ Submit Answer'}
            </Button>
          </div>
        )}
        
        {currentCandidate && currentCandidate.assessmentPhase === 'mcq' && (
          <div style={{ width: '100%', marginBottom: '16px' }}>
            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, rgba(0, 209, 255, 0.15) 0%, rgba(124, 92, 255, 0.1) 100%)',
              borderRadius: '12px',
              border: '1px solid rgba(0, 209, 255, 0.3)',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{
                  padding: '6px 12px',
                  background: 'rgba(0, 209, 255, 0.2)',
                  borderRadius: '6px',
                  color: '#00d1ff',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>
                  📝 Multiple Choice Round
                </div>
                <div style={{
                  padding: '6px 12px',
                  background: 'rgba(124, 92, 255, 0.2)',
                  borderRadius: '6px',
                  color: '#e3dfff',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  {answeredMcqs}/{totalMcqs} Answered
                </div>
              </div>
              <Text style={{ color: '#e3dfff', fontSize: '14px' }}>
                Answer each question and click "Submit & Next" to proceed. You must answer all questions to complete the MCQ assessment.
              </Text>
            </div>
            {currentMCQ && (() => {
              const categoryColors: Record<string, string> = {
                aptitude: '#52c41a',
                logical: '#1890ff',
                english: '#faad14',
                programming: '#7c5cff'
              };
              const categoryColor = categoryColors[currentMCQ.category] || '#7c5cff';
              const hasAnswer = currentMCQResponse?.selectedOption !== undefined;
              
              return (
                <div style={{ marginBottom: '24px' }}>
                  <Card 
                    style={{ 
                      background: hasAnswer
                        ? `linear-gradient(135deg, ${categoryColor}15 0%, ${categoryColor}08 100%)`
                        : 'rgba(20, 25, 35, 0.6)',
                      border: `2px solid ${hasAnswer ? categoryColor + '40' : 'rgba(124, 92, 255, 0.2)'}`,
                      borderRadius: '12px',
                      boxShadow: hasAnswer
                        ? `0 4px 15px ${categoryColor}20`
                        : '0 2px 8px rgba(0, 0, 0, 0.2)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{
                          padding: '4px 12px',
                          background: categoryColor,
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {currentMCQ.category}
                        </div>
                        <Text strong style={{ color: '#e3dfff', fontSize: '14px' }}>
                          Question {currentMCQIndex + 1} of {totalMcqs}
                        </Text>
                      </div>
                      <Text style={{ color: '#e3dfff', fontSize: '15px', lineHeight: '1.6', fontWeight: 500 }}>
                        {currentMCQ.question}
                      </Text>
                      <Radio.Group
                        onChange={(e) => handleMCQSelection(currentMCQ.id, e.target.value)}
                        value={currentMCQResponse?.selectedOption}
                        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                      >
                        {currentMCQ.options.map((option, optionIndex) => {
                          const isSelected = currentMCQResponse?.selectedOption === optionIndex;
                          const rgbaValues: Record<string, string> = {
                            '#52c41a': '82, 196, 26',
                            '#1890ff': '24, 144, 255',
                            '#faad14': '250, 173, 20',
                            '#7c5cff': '124, 92, 255'
                          };
                          return (
                            <Radio 
                              key={optionIndex} 
                              value={optionIndex}
                              style={{
                                color: '#e3dfff',
                                padding: '10px 12px',
                                background: isSelected
                                  ? `rgba(${rgbaValues[categoryColor] || '124, 92, 255'}, 0.2)`
                                  : 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '8px',
                                border: isSelected
                                  ? `2px solid ${categoryColor}`
                                  : '1px solid rgba(124, 92, 255, 0.3)',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer'
                              }}
                            >
                              <span style={{ fontSize: '14px' }}>{String.fromCharCode(65 + optionIndex)}. {option}</span>
                            </Radio>
                          );
                        })}
                      </Radio.Group>
                      <Button
                        type="primary"
                        onClick={handleMCQQuestionSubmit}
                        disabled={!hasAnswer}
                        size="large"
                        block
                        style={{ 
                          height: '50px',
                          marginTop: '16px',
                          background: hasAnswer
                            ? 'linear-gradient(135deg, #7c5cff 0%, #5a3fd8 100%)'
                            : 'rgba(124, 92, 255, 0.3)',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '16px',
                          fontWeight: 600,
                          boxShadow: hasAnswer
                            ? '0 6px 20px rgba(124, 92, 255, 0.4)'
                            : 'none',
                          transition: 'all 0.3s ease',
                          cursor: hasAnswer ? 'pointer' : 'not-allowed'
                        }}
                      >
                        {currentMCQIndex < totalMcqs - 1 
                          ? (hasAnswer ? '✅ Submit & Next Question' : '⏳ Select an answer to continue')
                          : (hasAnswer ? '✅ Submit Final Answer & Complete MCQ' : '⏳ Select an answer to complete')
                        }
                      </Button>
                    </Space>
                  </Card>
                </div>
              );
            })()}
          </div>
        )}

        {currentCandidate && currentCandidate.assessmentPhase === 'coding' && currentCandidate.codingQuestion && (
          <div style={{ width: '100%', marginBottom: '16px' }}>
            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, rgba(82, 196, 26, 0.15) 0%, rgba(124, 92, 255, 0.1) 100%)',
              borderRadius: '12px',
              border: '1px solid rgba(82, 196, 26, 0.3)',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{
                  padding: '6px 12px',
                  background: 'rgba(82, 196, 26, 0.2)',
                  borderRadius: '6px',
                  color: '#52c41a',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>
                  💻 Coding Challenge
                </div>
                <div style={{
                  padding: '6px 12px',
                  background: 'rgba(124, 92, 255, 0.2)',
                  borderRadius: '6px',
                  color: '#e3dfff',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  LeetCode Easy
                </div>
              </div>
              <Text style={{ color: '#e3dfff', fontSize: '14px' }}>
                Solve the problem below within 30 minutes. Write your solution in the code editor.
              </Text>
            </div>

            <Card 
              style={{ 
                marginBottom: '16px',
                background: 'rgba(20, 25, 35, 0.6)',
                border: '2px solid rgba(82, 196, 26, 0.3)',
                borderRadius: '12px'
              }}
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <Text strong style={{ color: '#52c41a', fontSize: '18px', display: 'block', marginBottom: '8px' }}>
                    {currentCandidate.codingQuestion.title}
                  </Text>
                  <Text style={{ color: '#e3dfff', fontSize: '15px', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                    {currentCandidate.codingQuestion.description}
                  </Text>
                </div>

                {currentCandidate.codingQuestion.examples && currentCandidate.codingQuestion.examples.length > 0 && (
                  <div>
                    <Text strong style={{ color: '#e3dfff', fontSize: '16px', display: 'block', marginBottom: '12px' }}>
                      Examples:
                    </Text>
                    {currentCandidate.codingQuestion.examples.map((example, idx) => (
                      <div key={idx} style={{
                        marginBottom: '12px',
                        padding: '12px',
                        background: 'rgba(82, 196, 26, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(82, 196, 26, 0.3)'
                      }}>
                        <Text style={{ color: '#e3dfff', fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                          <strong>Input:</strong> {example.input}
                        </Text>
                        <Text style={{ color: '#e3dfff', fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                          <strong>Output:</strong> {example.output}
                        </Text>
                        {example.explanation && (
                          <Text style={{ color: '#e3dfff', fontSize: '14px', display: 'block', fontStyle: 'italic' }}>
                            <strong>Explanation:</strong> {example.explanation}
                          </Text>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {currentCandidate.codingQuestion.constraints && currentCandidate.codingQuestion.constraints.length > 0 && (
                  <div>
                    <Text strong style={{ color: '#e3dfff', fontSize: '16px', display: 'block', marginBottom: '12px' }}>
                      Constraints:
                    </Text>
                    <ul style={{ color: '#e3dfff', fontSize: '14px', paddingLeft: '20px' }}>
                      {currentCandidate.codingQuestion.constraints.map((constraint, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>{constraint}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Space>
            </Card>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <Text strong style={{ color: '#e3dfff', fontSize: '16px' }}>
                  Your Solution
                </Text>
                <Space>
                  <Text style={{ color: '#e3dfff', fontSize: '12px' }}>Language:</Text>
                  <select
                    value={codingLanguage}
                    onChange={(e) => setCodingLanguage(e.target.value)}
                    style={{
                      padding: '4px 8px',
                      background: 'rgba(20, 25, 35, 0.8)',
                      border: '1px solid rgba(124, 92, 255, 0.4)',
                      borderRadius: '6px',
                      color: '#e3dfff',
                      fontSize: '14px'
                    }}
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </select>
                </Space>
              </div>
              <TextArea
                value={codingCode}
                onChange={(e) => setCodingCode(e.target.value)}
                placeholder="Write your solution here..."
                autoSize={{ minRows: 15, maxRows: 25 }}
                style={{ 
                  width: '100%',
                  background: 'rgba(20, 25, 35, 0.8)',
                  border: '1px solid rgba(82, 196, 26, 0.4)',
                  borderRadius: '8px',
                  color: '#e3dfff',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  padding: '12px'
                }}
              />
            </div>

            <Button
              type="primary"
              onClick={handleCodingSubmit}
              disabled={!codingCode.trim()}
              size="large"
              block
              style={{ 
                height: '50px',
                background: codingCode.trim()
                  ? 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)'
                  : 'rgba(82, 196, 26, 0.3)',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 600,
                boxShadow: codingCode.trim()
                  ? '0 6px 20px rgba(82, 196, 26, 0.4)'
                  : 'none',
                transition: 'all 0.3s ease',
                cursor: codingCode.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              {codingCode.trim() ? '✅ Submit Solution' : '⏳ Write your solution to submit'}
            </Button>
          </div>
        )}

        {/* Debug info */}
        <div style={{ marginTop: '16px', padding: '8px', background: '#f0f0f0', fontSize: '12px' }}>
          <div>Interview Status: {currentCandidate?.interviewStatus || 'No candidate'}</div>
          <div>Current Answer: "{currentAnswer}"</div>
          <div>Is Submitting: {isSubmitting.toString()}</div>
          <div>Current Question Index: {currentCandidate?.currentQuestionIndex || 0}</div>
        </div>

        {currentCandidate && currentCandidate.interviewStatus === 'completed' && (
          <div>
            <Alert
              message="Interview Completed!"
              description={`Your final score: ${currentCandidate.finalScore || 'Calculating...'}/100`}
              type="success"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            {currentCandidate.aiSummary && (
              <Card title="AI Summary" size="small">
                <Text>{currentCandidate.aiSummary}</Text>
              </Card>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ChatInterface;
