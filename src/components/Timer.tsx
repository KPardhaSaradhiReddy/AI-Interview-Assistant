import React from 'react';
import { Progress, Typography, Space } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface TimerProps {
  timeRemaining: number;
  initialTime: number;
  isPaused: boolean;
}

const Timer: React.FC<TimerProps> = ({ timeRemaining, initialTime, isPaused }) => {
  const displayTime = Math.max(0, timeRemaining);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = () => {
    const percentage = (displayTime / initialTime) * 100;
    if (percentage > 50) return '#52c41a';
    if (percentage > 25) return '#faad14';
    return '#ff4d4f';
  };

  const getStatus = () => {
    if (isPaused) return 'normal';
    if (displayTime <= 10) return 'exception';
    return 'active';
  };

  return (
    <div style={{ 
      textAlign: 'center',
      padding: '20px',
      background: displayTime <= 30 && !isPaused
        ? 'linear-gradient(135deg, rgba(255, 77, 79, 0.15) 0%, rgba(207, 19, 34, 0.1) 100%)'
        : 'linear-gradient(135deg, rgba(124, 92, 255, 0.15) 0%, rgba(0, 209, 255, 0.1) 100%)',
      borderRadius: '12px',
      border: `2px solid ${displayTime <= 30 && !isPaused ? 'rgba(255, 77, 79, 0.4)' : 'rgba(124, 92, 255, 0.3)'}`,
      boxShadow: displayTime <= 30 && !isPaused
        ? '0 4px 20px rgba(255, 77, 79, 0.2)'
        : '0 4px 20px rgba(124, 92, 255, 0.2)',
      transition: 'all 0.3s ease'
    }}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <ClockCircleOutlined style={{ 
            fontSize: '24px',
            color: displayTime <= 30 && !isPaused ? '#ff4d4f' : '#7c5cff',
            animation: displayTime <= 10 && !isPaused ? 'pulse 1s infinite' : 'none'
          }} />
          <Text strong style={{ 
            fontSize: '28px',
            fontFamily: 'monospace',
            color: displayTime <= 30 && !isPaused ? '#ff4d4f' : '#e3dfff',
            fontWeight: 700,
            letterSpacing: '2px'
          }}>
            {formatTime(displayTime)}
          </Text>
        </div>
        
        <Progress
          percent={(displayTime / initialTime) * 100}
          strokeColor={getProgressColor()}
          status={getStatus()}
          showInfo={false}
          style={{ width: '100%' }}
          strokeWidth={10}
          trailColor="rgba(255, 255, 255, 0.1)"
        />
        
        {isPaused && (
          <div style={{
            padding: '8px 16px',
            background: 'rgba(250, 173, 20, 0.2)',
            borderRadius: '8px',
            border: '1px solid rgba(250, 173, 20, 0.4)'
          }}>
            <Text style={{ color: '#faad14', fontSize: '14px', fontWeight: 600 }}>
              ⏸️ Timer Paused
            </Text>
          </div>
        )}
        
        {displayTime <= 30 && !isPaused && (
          <div style={{
            padding: '8px 16px',
            background: 'rgba(255, 77, 79, 0.2)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 77, 79, 0.4)',
            animation: 'pulse 1.5s infinite'
          }}>
            <Text style={{ color: '#ff4d4f', fontSize: '14px', fontWeight: 700 }}>
              ⚠️ {displayTime <= 10 ? 'Time Almost Up!' : 'Time Running Out!'}
            </Text>
          </div>
        )}
      </Space>
    </div>
  );
};

export default Timer;
