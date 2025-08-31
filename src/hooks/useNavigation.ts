import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useCallback } from 'react';

export function useNavigation() {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  
  const navigateToTask = useCallback((taskId: string) => {
    navigate(`/tasks/${taskId}`);
  }, [navigate]);
  
  const navigateToTimer = useCallback((taskId?: string) => {
    if (taskId) {
      navigate(`/timer/${taskId}`);
    } else {
      navigate('/timer');
    }
  }, [navigate]);
  
  const navigateToAnalytics = useCallback(() => {
    navigate('/analytics');
  }, [navigate]);
  
  const navigateToSettings = useCallback(() => {
    navigate('/settings');
  }, [navigate]);
  
  const navigateToDashboard = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);
  
  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);
  
  const goForward = useCallback(() => {
    navigate(1);
  }, [navigate]);
  
  return {
    // Navigation functions
    navigate,
    navigateToTask,
    navigateToTimer,
    navigateToAnalytics,
    navigateToSettings,
    navigateToDashboard,
    goBack,
    goForward,
    
    // Current location info
    currentPath: location.pathname,
    currentSearch: location.search,
    currentHash: location.hash,
    
    // Route params
    params,
    
    // Utility functions
    isCurrentPath: (path: string) => location.pathname === path,
    isPathActive: (path: string) => location.pathname.startsWith(path),
  };
}