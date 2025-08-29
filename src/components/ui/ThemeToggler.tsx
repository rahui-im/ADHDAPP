import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from './Button';
import { SunIcon, MoonIcon, DesktopIcon } from './Icons';
import { setTheme } from '../../store/userSlice';
import { RootState } from '../../store/store';

type Theme = 'light' | 'dark' | 'auto';

export const ThemeToggler: React.FC = () => {
  const dispatch = useDispatch();
  const currentTheme = useSelector((state: RootState) => state.user.currentUser?.settings.theme) || 'auto';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const themes: { name: Theme; icon: React.ReactNode }[] = [
    { name: 'light', icon: <SunIcon className="w-5 h-5" /> },
    { name: 'dark', icon: <MoonIcon className="w-5 h-5" /> },
    { name: 'auto', icon: <DesktopIcon className="w-5 h-5" /> },
  ];

  const handleThemeChange = (theme: Theme) => {
    dispatch(setTheme(theme));
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getIconForTheme = (theme: Theme) => {
    switch (theme) {
      case 'light':
        return <SunIcon className="w-5 h-5" />;
      case 'dark':
        return <MoonIcon className="w-5 h-5" />;
      case 'auto':
      default:
        return <DesktopIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        ariaLabel="Toggle theme"
        ariaExpanded={isMenuOpen}
        icon={getIconForTheme(currentTheme)}
      >
        <span className="sr-only">Toggle Theme</span>
      </Button>
      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <ul className="py-1">
            {themes.map((theme) => (
              <li key={theme.name}>
                <button
                  onClick={() => handleThemeChange(theme.name)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  {theme.icon}
                  <span className="capitalize">{theme.name === 'auto' ? 'System' : theme.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
