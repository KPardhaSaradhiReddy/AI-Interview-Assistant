// Offline mode utilities for testing without API limits

export const isOfflineMode = (): boolean => {
  // Check if we're in offline mode (no API key or quota exceeded)
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  return !apiKey || apiKey.trim() === '';
};

// Check if API quota is exceeded (imported from aiService)
export const isAPIQuotaExceeded = (): boolean => {
  // This will be updated by the aiService when quota is exceeded
  return localStorage.getItem('gemini_quota_exceeded') === 'true';
};

export const getOfflineModeMessage = (): string => {
  return isOfflineMode() 
    ? '🔄 Running in offline mode - All features work with fallback methods'
    : '🤖 AI features enabled - Enhanced experience with Gemini integration';
};

export const logOfflineModeStatus = (): void => {
  console.log('=== Application Mode ===');
  console.log('Offline Mode:', isOfflineMode());
  console.log('Message:', getOfflineModeMessage());
  console.log('========================');
};

