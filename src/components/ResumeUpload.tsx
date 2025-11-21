import React, { useState } from 'react';
import { Upload, Button, Form, Input, Card, Alert, Typography, Modal } from 'antd';
import { InboxOutlined, FileTextOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { addCandidate, setCurrentCandidate, clearCurrentCandidate } from '../store/slices/candidateSlice';
import { startInterview } from '../store/slices/interviewSlice';
import { parseResume } from '../services/resumeParser';
import { generateQuestionsFromResume, generateQuestions, checkAPICredits } from '../services/aiService';
import { v4 as uuidv4 } from 'uuid';
import type { Candidate } from '../types';
import APIStatusNotification from './APIStatusNotification';
import { useAPIStatus } from '../hooks/useAPIStatus';

const { Dragger } = Upload;
const { Title, Text } = Typography;

interface ResumeUploadProps {
  onComplete: () => void;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ onComplete }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [file, setFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<Partial<Candidate>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'available' | 'quota-exceeded' | 'unavailable'>('checking');
  const { status, handleAPIError, retryAPI, dismissNotification } = useAPIStatus();

  // Check API status on component mount (disabled to avoid quota issues)
  React.useEffect(() => {
    // Set status based on known quota issue
    setApiStatus('quota-exceeded');
  }, []);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    
    // Extract name from filename first
    const nameFromFileName = extractNameFromFileName(file.name);
    console.log('📝 Extracted name from filename:', nameFromFileName);
    
    try {
      const data = await parseResume(file);
      setExtractedData(data);
      
      // Priority: Use name from resume content if available, otherwise use name from filename
      const finalName = data.name || nameFromFileName || '';
      
      form.setFieldsValue({
        name: finalName,
        email: data.email || '',
        phone: data.phone || '',
      });
      
      // If we used name from filename, log it
      if (!data.name && nameFromFileName) {
        console.log('✅ Using name extracted from filename:', nameFromFileName);
      }
      
      setFile(file);
    } catch (err: any) {
      setError('Failed to parse resume. Please try again.');
      console.error('Resume parsing error:', err);
      
      // Even if parsing fails, try to set name from filename
      if (nameFromFileName) {
        form.setFieldsValue({
          name: nameFromFileName,
        });
        console.log('✅ Set name from filename as fallback:', nameFromFileName);
      }
      
      // Handle API errors
      handleAPIError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    setError(null);

    // Validate file name before proceeding
    if (!file) {
      setError('Please upload a resume file first.');
      setLoading(false);
      return;
    }

    if (!validateFileName(file.name)) {
      setError('Invalid file name. File name must contain "resume".');
      showFileNameError();
      setLoading(false);
      return;
    }

    try {
      const candidate: Candidate = {
        id: uuidv4(),
        name: values.name,
        email: values.email,
        phone: values.phone,
        resumeFileName: file?.name || undefined,
        resumeText: extractedData.resumeText,
        interviewStatus: 'in_progress',
        currentQuestionIndex: 0,
        questions: [],
        answers: [],
        assessmentPhase: 'mcq',
        mcqQuestions: [],
        mcqResponses: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Generate interview questions based on resume
      const questions = await generateQuestionsFromResume(extractedData.resumeText || '');
      console.log('🔍 ResumeUpload: Generated questions count:', questions.length);
      console.log('🔍 ResumeUpload: Questions array:', questions.map(q => ({ id: q.id, text: q.text.substring(0, 30) + '...' })));
      
      // CRITICAL: Ensure exactly 6 questions - no more, no less
      if (questions.length > 6) {
        console.warn(`⚠️ Generated ${questions.length} questions, limiting to exactly 6`);
        candidate.questions = questions.slice(0, 6);
      } else if (questions.length < 6) {
        console.error(`🚨 CRITICAL: Only ${questions.length} questions generated! Expected 6.`);
        // Use fallback to ensure we have exactly 6
        const fallbackQuestions = await generateQuestions();
        const needed = 6 - questions.length;
        candidate.questions = [...questions, ...fallbackQuestions.slice(0, needed)].slice(0, 6);
        console.log(`🔍 Added ${needed} fallback questions to reach 6 total`);
      } else {
        candidate.questions = questions;
        console.log(`✅ ResumeUpload: Set exactly ${candidate.questions.length} questions correctly`);
      }
      
      // Final validation - must be exactly 6
      if (candidate.questions.length !== 6) {
        console.error(`🚨 FINAL VALIDATION FAILED: Expected 6 questions, got ${candidate.questions.length}!`);
        candidate.questions = candidate.questions.slice(0, 6);
        if (candidate.questions.length < 6) {
          // Emergency fallback - generate simple questions
          const emergencyQuestions = Array.from({ length: 6 - candidate.questions.length }, (_, i) => ({
            id: `emergency-q-${i}`,
            text: `Technical question ${candidate.questions.length + i + 1}`,
            difficulty: 'medium' as const,
            timeLimit: 90,
            category: 'General'
          }));
          candidate.questions = [...candidate.questions, ...emergencyQuestions].slice(0, 6);
        }
      }
      
      // CRITICAL DEBUG: Log the final questions array
      console.log('🔍 CRITICAL DEBUG - Final candidate questions:');
      candidate.questions.forEach((q, index) => {
        console.log(`  Question ${index + 1}: ${q.id} - ${q.text.substring(0, 30)}...`);
      });

      dispatch(addCandidate(candidate));
      dispatch(setCurrentCandidate(candidate.id));
      dispatch(startInterview({ candidate, questions: candidate.questions }));

      onComplete();
    } catch (err: any) {
      setError('Failed to start interview. Please try again.');
      console.error('Interview start error:', err);
      
      // Handle API errors
      handleAPIError(err);
    } finally {
      setLoading(false);
    }
  };

  const validateFileName = (fileName: string): boolean => {
    // Check if filename contains "resume" (case-insensitive)
    const fileNameLower = fileName.toLowerCase();
    return fileNameLower.includes('resume');
  };

  const extractNameFromFileName = (fileName: string): string => {
    // Remove file extension
    let nameWithoutExt = fileName.replace(/\.(pdf|docx?)$/i, '');
    
    // Remove "resume" (case-insensitive) from filename
    nameWithoutExt = nameWithoutExt.replace(/\.?resume\.?/i, '');
    
    // Handle different formats:
    // "JohnDoe.Resume.pdf" -> "JohnDoe"
    // "John_Doe.Resume.pdf" -> "John_Doe"
    // "JohnDoeResume.pdf" -> "JohnDoe"
    // "John.Doe.Resume.pdf" -> "John.Doe"
    
    // Split by dots and take the first part (before resume)
    const parts = nameWithoutExt.split('.');
    let extractedName = parts[0] || nameWithoutExt;
    
    // Clean up: replace underscores and multiple dots with spaces
    extractedName = extractedName.replace(/[._]+/g, ' ');
    
    // Convert to Title Case (capitalize first letter of each word)
    extractedName = extractedName
      .split(' ')
      .map(word => {
        if (!word) return '';
        // Handle camelCase (e.g., "JohnDoe" -> "John Doe")
        const camelCaseSplit = word.replace(/([a-z])([A-Z])/g, '$1 $2');
        return camelCaseSplit
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
      })
      .filter(word => word.length > 0)
      .join(' ')
      .trim();
    
    return extractedName;
  };

  const showFileNameError = () => {
    Modal.error({
      title: 'Invalid File Name',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          <p style={{ marginBottom: '12px' }}>
            The uploaded file name must contain the word "resume".
          </p>
          <p style={{ marginBottom: '8px', fontWeight: 600, color: '#1890ff' }}>
            Please upload your file in the format:
          </p>
          <p style={{ 
            background: '#f0f0f0', 
            padding: '12px', 
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#333'
          }}>
            NAME.RESUME.PDF
          </p>
          <p style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
            Examples: JohnDoe.Resume.pdf, jane_smith.resume.docx, MyResume.pdf
          </p>
        </div>
      ),
      okText: 'Got it',
      width: 500,
    });
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.pdf,.docx',
    beforeUpload: (file: File) => {
      // Validate filename contains "resume"
      if (!validateFileName(file.name)) {
        setError(null); // Clear any previous errors
        setFile(null); // Clear the file
        setExtractedData({}); // Clear extracted data
        showFileNameError();
        return false; // Prevent upload
      }
      
      // If validation passes, proceed with file upload
      handleFileUpload(file);
      return false; // Prevent auto upload
    },
    showUploadList: false,
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0 }}>
          Upload Your Resume
        </Title>
        <Button 
          type="default" 
          onClick={() => dispatch(clearCurrentCandidate())}
        >
          Clear Data
        </Button>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          style={{ marginBottom: '16px' }}
          closable
          onClose={() => setError(null)}
        />
      )}

      {/* API Status Notification */}
      <APIStatusNotification
        isVisible={!status.isOnline && status.lastError !== null}
        onRetry={retryAPI}
        onDismiss={dismissNotification}
      />

      <Card>
        <Dragger {...uploadProps} style={{ marginBottom: '24px' }}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag file to this area to upload</p>
          <p className="ant-upload-hint">
            Support for PDF and DOCX files. Maximum file size: 10MB
          </p>
          <p className="ant-upload-hint" style={{ color: '#ff4d4f', fontWeight: 500, marginTop: '8px' }}>
            ⚠️ File name must contain "resume" (e.g., NAME.RESUME.PDF)
          </p>
        </Dragger>

        {file && (
          <Alert
            message={`File uploaded: ${file.name}`}
            type="success"
            icon={<FileTextOutlined />}
            style={{ marginBottom: '16px' }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={loading}
        >
          <Form.Item
            label="Full Name"
            name="name"
            rules={[{ required: true, message: 'Please enter your name' }]}
          >
            <Input placeholder="Enter your full name" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input placeholder="Enter your email address" />
          </Form.Item>

          <Form.Item
            label="Phone Number"
            name="phone"
            rules={[{ required: true, message: 'Please enter your phone number' }]}
          >
            <Input placeholder="Enter your phone number" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
            >
              Start Interview
            </Button>
          </Form.Item>
        </Form>

        <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center', display: 'block' }}>
          By starting the interview, you agree to our terms of service and privacy policy.
        </Text>
      </Card>
    </div>
  );
};

export default ResumeUpload;
