import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { storageService } from '../services/storageService';

export const useUserSettingsManager = () => {
  const currentUser = useSelector((state: RootState) => state.user.currentUser);

  useEffect(() => {
    if (currentUser) {
      storageService.user.saveUser(currentUser);
    }
  }, [currentUser]);
};
