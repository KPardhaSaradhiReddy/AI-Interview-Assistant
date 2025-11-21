import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { store, persistor } from './store/store';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import IntervieweeTab from './components/IntervieweeTab';
import InterviewerTab from './components/InterviewerTab';
import InterviewerLogin from './components/InterviewerLogin';
import ProtectedRoute from './components/ProtectedRoute';
import WelcomeBackModal from './components/WelcomeBackModal';
import { logOfflineModeStatus } from './utils/offlineMode';
import './App.css';

function App() {
  // Log offline mode status on app start
  logOfflineModeStatus();
  
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ConfigProvider
          theme={{
            algorithm: antdTheme.darkAlgorithm,
            token: {
              colorPrimary: '#7c5cff',
              colorBgBase: '#0b0f19',
              colorText: 'rgba(255,255,255,0.88)',
              borderRadius: 10,
            },
          }}
        >
          <Router>
            <div className="App">
              <Routes>
                <Route path="/interviewer/login" element={<InterviewerLogin />} />
                <Route path="/" element={
                  <Layout>
                    <LandingPage />
                    <WelcomeBackModal />
                  </Layout>
                } />
                <Route path="/interviewee" element={
                  <Layout>
                    <IntervieweeTab />
                    <WelcomeBackModal />
                  </Layout>
                } />
                <Route 
                  path="/interviewer" 
                  element={
                    <Layout>
                      <ProtectedRoute>
                        <InterviewerTab />
                      </ProtectedRoute>
                      <WelcomeBackModal />
                    </Layout>
                  } 
                />
              </Routes>
            </div>
          </Router>
        </ConfigProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
