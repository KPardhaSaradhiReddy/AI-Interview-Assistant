import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, CloseOutlined, HomeOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../store/slices/authSlice';

const { Title, Text } = Typography;

const InterviewerLogin: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    
    try {
      // Simple validation - in production, this would call an API
      // For demo purposes, accept any email/password combination
      // You can add specific credentials here if needed
      
      // Extract name from email (before @) for display
      const name = values.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Dispatch login action
      dispatch(login({ 
        email: values.email, 
        name: name || 'Interviewer' 
      }));
      
      message.success('Login successful!');
      navigate('/interviewer');
    } catch (error) {
      message.error('Login failed. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0b0f19 0%, #1a1f2e 100%)',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: '450px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          borderRadius: '12px',
          background: 'rgba(20, 25, 35, 0.95)',
          border: '1px solid rgba(124, 92, 255, 0.2)',
          position: 'relative'
        }}
      >
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={() => navigate('/')}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            color: '#fff',
            fontSize: '18px',
            zIndex: 10
          }}
        />
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <div>
            <Title level={2} style={{ color: '#fff', marginBottom: '8px' }}>
              Interviewer Login
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Access the candidate dashboard
            </Text>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            style={{ marginTop: '24px' }}
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please enter your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#7c5cff' }} />}
                placeholder="Email address"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(124, 92, 255, 0.3)',
                  color: '#fff'
                }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please enter your password!' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#7c5cff' }} />}
                placeholder="Password"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(124, 92, 255, 0.3)',
                  color: '#fff'
                }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<LoginOutlined />}
                block
                style={{
                  height: '48px',
                  background: 'linear-gradient(135deg, #7c5cff 0%, #5a3fd8 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600
                }}
              >
                Login
              </Button>
            </Form.Item>
          </Form>

          <Button
            type="default"
            icon={<HomeOutlined />}
            onClick={() => navigate('/')}
            block
            style={{
              height: '48px',
              marginTop: '12px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              border: '1px solid rgba(124, 92, 255, 0.3)',
              color: '#e3dfff',
              background: 'rgba(124, 92, 255, 0.1)'
            }}
          >
            Exit
          </Button>

          <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '16px' }}>
            Demo: Any email and password combination will work
          </Text>
        </Space>
      </Card>
    </div>
  );
};

export default InterviewerLogin;



