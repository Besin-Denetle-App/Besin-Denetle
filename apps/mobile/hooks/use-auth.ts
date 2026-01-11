import { useAuthStore } from '../stores/auth.store';

/**
 * Auth store'a kolay erişim için hook
 */
export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    tempToken,
    initialize,
    loginWithGoogle,
    completeRegistration,
    logout,
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    tempToken,
    initialize,
    loginWithGoogle,
    completeRegistration,
    logout,
  };
}
