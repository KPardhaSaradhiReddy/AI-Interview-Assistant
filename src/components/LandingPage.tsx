import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Space, Row, Col, Statistic, Tag, Divider } from 'antd';
import { 
  RocketOutlined, 
  UserOutlined, 
  DashboardOutlined, 
  CheckCircleOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  GlobalOutlined,
  ArrowRightOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const { Title, Paragraph, Text } = Typography;

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(true);
  }, []);

  const features = [
    {
      icon: <ThunderboltOutlined style={{ fontSize: '32px', color: '#7c5cff' }} />,
      title: 'AI-Powered Questions',
      description: 'Personalized interview questions generated from your resume using advanced AI',
    },
    {
      icon: <SafetyOutlined style={{ fontSize: '32px', color: '#52c41a' }} />,
      title: 'Skill-Based Assessment',
      description: 'Questions tailored specifically to your technical skills and experience',
    },
    {
      icon: <GlobalOutlined style={{ fontSize: '32px', color: '#1890ff' }} />,
      title: 'Voice-Enabled',
      description: 'Speak your answers naturally with voice-to-text technology',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Upload Resume',
      description: 'Upload your resume (PDF or DOCX) and let AI extract your information',
    },
    {
      number: '02',
      title: 'MCQ Assessment',
      description: 'Complete 10 multiple-choice questions covering aptitude, logic, and programming',
    },
    {
      number: '03',
      title: 'Coding Challenge',
      description: 'Solve a real-world coding problem in your preferred language',
    },
    {
      number: '04',
      title: 'Technical Interview',
      description: 'Answer 6 AI-generated questions based on your technical skills',
    },
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <div className={`hero-section ${animated ? 'fade-in' : ''}`}>
        <div className="hero-content">
          <div className="hero-badge">
            <RocketOutlined style={{ marginRight: '8px' }} />
            <Text>AI-Powered Interview Platform</Text>
          </div>
          <Title level={1} className="hero-title">
            Ace Your Technical
            <span className="gradient-text"> Interview</span>
          </Title>
          <Paragraph className="hero-description">
            Experience a revolutionary interview process powered by AI. Get personalized questions 
            based on your resume, showcase your skills, and receive instant feedback.
          </Paragraph>
          <Space size="large" style={{ marginTop: '32px' }}>
            <Button
              type="primary"
              size="large"
              icon={<PlayCircleOutlined />}
              onClick={() => navigate('/interviewee')}
              className="cta-button"
            >
              Start Interview
            </Button>
            <Button
              size="large"
              icon={<DashboardOutlined />}
              onClick={() => navigate('/interviewer/login')}
              className="secondary-button"
            >
              Interviewer Login
            </Button>
          </Space>
        </div>
        <div className="hero-stats">
          <Row gutter={[24, 24]}>
            <Col xs={12} sm={12} md={6}>
              <Card className="stat-card">
                <Statistic
                  title={<span style={{ color: '#999' }}>Questions</span>}
                  value={6}
                  suffix="Technical"
                  valueStyle={{ color: '#7c5cff', fontSize: '28px' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card className="stat-card">
                <Statistic
                  title={<span style={{ color: '#999' }}>MCQ</span>}
                  value={10}
                  suffix="Questions"
                  valueStyle={{ color: '#52c41a', fontSize: '28px' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card className="stat-card">
                <Statistic
                  title={<span style={{ color: '#999' }}>Coding</span>}
                  value={1}
                  suffix="Challenge"
                  valueStyle={{ color: '#1890ff', fontSize: '28px' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card className="stat-card">
                <Statistic
                  title={<span style={{ color: '#999' }}>AI</span>}
                  value={100}
                  suffix="% Personalized"
                  valueStyle={{ color: '#faad14', fontSize: '28px' }}
                />
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <Title level={2} style={{ textAlign: 'center', marginBottom: '48px', color: '#e3dfff' }}>
          Why Choose Our Platform?
        </Title>
        <Row gutter={[24, 24]}>
          {features.map((feature, index) => (
            <Col xs={24} sm={12} md={8} key={index}>
              <Card
                className={`feature-card ${animated ? 'slide-up' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
                hoverable
              >
                <div className="feature-icon">{feature.icon}</div>
                <Title level={4} style={{ color: '#e3dfff', marginTop: '16px' }}>
                  {feature.title}
                </Title>
                <Paragraph style={{ color: '#999', marginBottom: 0 }}>
                  {feature.description}
                </Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Process Section */}
      <div className="process-section">
        <Title level={2} style={{ textAlign: 'center', marginBottom: '48px', color: '#e3dfff' }}>
          How It Works
        </Title>
        <Row gutter={[24, 24]}>
          {steps.map((step, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card className="process-card" hoverable>
                <div className="process-number">{step.number}</div>
                <Title level={4} style={{ color: '#e3dfff', marginTop: '16px' }}>
                  {step.title}
                </Title>
                <Paragraph style={{ color: '#999', marginBottom: 0 }}>
                  {step.description}
                </Paragraph>
                {index < steps.length - 1 && (
                  <ArrowRightOutlined className="process-arrow" />
                )}
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <Card className="cta-card">
          <Title level={2} style={{ textAlign: 'center', color: '#e3dfff', marginBottom: '16px' }}>
            Ready to Get Started?
          </Title>
          <Paragraph style={{ textAlign: 'center', color: '#999', marginBottom: '32px', fontSize: '16px' }}>
            Upload your resume and begin your personalized interview experience
          </Paragraph>
          <div style={{ textAlign: 'center' }}>
            <Button
              type="primary"
              size="large"
              icon={<UserOutlined />}
              onClick={() => navigate('/interviewee')}
              className="cta-button-large"
            >
              Start Your Interview Now
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LandingPage;

