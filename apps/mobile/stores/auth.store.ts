import { AuthProvider, type UserPublicInfo } from '@besin-denetle/shared';
import { create } from 'zustand';
import * as authService from '../services/auth.service';
import { clearAuthData, getUser, hasToken } from '../utils/storage';

interface AuthState {
  // State
  user: UserPublicInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tempToken: string | null; // Kayıt için geçici token

  // Actions
  initialize: () => Promise<void>;
  loginWithGoogle: (accessToken: string) => Promise<{ needsRegistration: boolean }>;
  signupWithEmail: (email: string) => Promise<{ needsRegistration: boolean }>;
  completeRegistration: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  setTempToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: true,
  tempToken: null,

  // Uygulama başlangıcında token kontrolü
  initialize: async () => {
    set({ isLoading: true });
    try {
      const tokenExists = await hasToken();
      if (tokenExists) {
        // Token var, kullanıcı bilgisini al
        const user = await getUser<UserPublicInfo>();
        if (user) {
          set({ user, isAuthenticated: true });
        } else {
          // Token var ama kullanıcı yok, temizle
          await clearAuthData();
          set({ isAuthenticated: false });
        }
      }
    } catch (error) {
      console.error('Auth initialize error:', error);
      await clearAuthData();
    } finally {
      set({ isLoading: false });
    }
  },

  // Google ile giriş
  loginWithGoogle: async (accessToken: string) => {
    set({ isLoading: true });
    try {
      const response = await authService.oauth({
        provider: AuthProvider.GOOGLE,
        token: accessToken,
      });

      if (response.isNewUser) {
        // Yeni kullanıcı, kayıt gerekli
        set({ tempToken: response.tempToken, isLoading: false });
        return { needsRegistration: true };
      }

      // Mevcut kullanıcı, giriş başarılı
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return { needsRegistration: false };
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // E-posta ile kayıt/login (Beta test için)
  signupWithEmail: async (email: string) => {
    set({ isLoading: true });
    try {
      const response = await authService.emailSignup({
        email,
      });

      if (response.isNewUser) {
        // Yeni kullanıcı, kayıt gerekli
        set({ tempToken: response.tempToken, isLoading: false });
        return { needsRegistration: true };
      }

      // Mevcut kullanıcı, giriş başarılı
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return { needsRegistration: false };
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  // Apple ile giriş - İleride aktif edilecek
  // Aktif etmek için: pnpm --filter mobile add expo-apple-authentication
  // AuthState interface'ine loginWithApple tipini ekle
  /*
  loginWithApple: async (identityToken: string) => {
    set({ isLoading: true });
    try {
      const response = await authService.oauth({
        provider: AuthProvider.APPLE,
        token: identityToken,
      });

      if (response.isNewUser) {
        set({ tempToken: response.tempToken, isLoading: false });
        return { needsRegistration: true };
      }

      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return { needsRegistration: false };
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  */

  // Kayıt tamamla
  completeRegistration: async (username: string) => {
    const { tempToken } = get();
    if (!tempToken) {
      throw new Error('Geçici token bulunamadı');
    }

    set({ isLoading: true });
    try {
      const response = await authService.register({
        tempToken,
        username,
        termsAccepted: true,
      });

      set({
        user: response.user,
        isAuthenticated: true,
        tempToken: null,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Çıkış yap
  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        tempToken: null,
        isLoading: false,
      });
    }
  },

  // Geçici token ayarla
  setTempToken: (token: string | null) => {
    set({ tempToken: token });
  },
}));
