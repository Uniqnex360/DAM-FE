import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UserSelectionContextType {
  selectedUserId: string | null;
  setSelectedUserId: (userId: string | null) => void;
  clearSelectedUser: () => void;
}

const UserSelectionContext = createContext<UserSelectionContextType | undefined>(undefined);

export const UserSelectionProvider = ({ children }: { children: ReactNode }) => {
  const { userRole, isImpersonating, loading } = useAuth(); 
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const clearSelectedUser = useCallback(() => {
    setSelectedUserId(null);
  }, []);

  React.useEffect(() => {
    if (isImpersonating) {
      setSelectedUserId(null);
    }
  }, [isImpersonating]);

  const canSelectUser = userRole === 'admin' && !isImpersonating;

  const handleSetSelectedUserId = useCallback((userId: string | null) => {
    if (canSelectUser) {
      setSelectedUserId(userId);
    }
  }, [canSelectUser]);

  
  

  return (
  <UserSelectionContext.Provider
    value={{
      selectedUserId: canSelectUser ? selectedUserId : null,
      setSelectedUserId: handleSetSelectedUserId,
      clearSelectedUser,
    }}
  >
    {children}
  </UserSelectionContext.Provider>
);
};

export const useUserSelection = () => {
  const context = useContext(UserSelectionContext);
  if (!context) {
    throw new Error('useUserSelection must be used within a UserSelectionProvider');
  }
  return context;
};