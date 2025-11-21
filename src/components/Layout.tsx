import React from 'react';
import { Layout as AntLayout, Tabs, Typography, Button, Space } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { UserOutlined, DashboardOutlined, LogoutOutlined } from '@ant-design/icons';
import type { RootState } from '../store/store';
import { logout } from '../store/slices/authSlice';

const { Header, Content } = AntLayout;
const { Title } = Typography;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const interviewerName = useSelector((state: RootState) => state.auth.interviewerName);

  const getActiveKey = () => {
    if (location.pathname.includes('/interviewee')) return 'interviewee';
    if (location.pathname.includes('/interviewer')) return 'interviewer';
    return 'interviewee';
  };

  const handleTabChange = (key: string) => {
    if (key === 'interviewee') {
      navigate('/interviewee');
    } else if (key === 'interviewer') {
      if (isAuthenticated) {
        navigate('/interviewer');
      } else {
        navigate('/interviewer/login');
      }
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/interviewer/login');
  };

  const tabItems = [
    {
      key: 'interviewee',
      label: (
        <span>
          <UserOutlined />
          Interviewee
        </span>
      ),
    },
    {
      key: 'interviewer',
      label: (
        <span>
          <DashboardOutlined />
          Interviewer
        </span>
      ),
    },
  ];

  return (
    <AntLayout style={{
      minHeight: '100vh',
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      background: 'radial-gradient(1200px 600px at 0% 0%, rgba(124,92,255,0.15) 0%, rgba(124,92,255,0) 60%), radial-gradient(1000px 500px at 100% 100%, rgba(0,209,255,0.12) 0%, rgba(0,209,255,0) 60%), #0b0f19'
    }}>
      <Header style={{
        background: 'rgba(12, 16, 27, 0.6)',
        padding: '0 24px',
        boxShadow: '0 6px 30px rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(124,92,255,0.25)'
      }}>
        <Title 
          level={3} 
          style={{ 
            margin: 0, 
            color: '#e3dfff', 
            letterSpacing: '0.3px',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
          onClick={() => navigate('/')}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          AI Interview Assistant
        </Title>
        <Space>
          <Tabs
            activeKey={getActiveKey()}
            onChange={handleTabChange}
            items={tabItems}
            style={{ margin: 0, color: '#fff' }}
          />
          {isAuthenticated && location.pathname.includes('/interviewer') && (
            <Space>
              <span style={{ color: '#e3dfff', fontSize: '14px' }}>
                {interviewerName}
              </span>
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                style={{ color: '#e3dfff' }}
              >
                Logout
              </Button>
            </Space>
          )}
        </Space>
      </Header>
      <Content style={{
        padding: '24px',
        background: 'transparent',
        flex: 1,
        overflow: 'auto',
        height: 'calc(100vh - 64px)'
      }}>
        {children}
      </Content>
    </AntLayout>
  );
};

export default Layout;
