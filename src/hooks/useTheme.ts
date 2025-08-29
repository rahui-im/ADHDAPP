import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

export const useTheme = () => {
  const theme = useSelector((state: RootState) => state.user.currentUser?.settings.theme) || 'auto';

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark';
    const isSystem = theme === 'auto';

    const applyTheme = () => {
      if (isSystem) {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', systemPrefersDark);
      } else {
        root.classList.toggle('dark', isDark);
      }
    };

    applyTheme();

    if (isSystem) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);
};
