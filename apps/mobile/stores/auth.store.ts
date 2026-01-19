import { AuthProvider, type UserPublicInfo } from "@besin-denetle/shared";
import { create } from "zustand";
import * as authService from "../services/auth.service";
import { clearAuthData, getUser, hasToken } from "../utils/storage";

interface AuthState {
  // State
  user: UserPublicInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tempToken: string | null; // Kayıt için geçici token

  // Actions
  initialize: () => Promise<void>;
  loginWithGoogle: (
    accessToken: string,
  ) => Promise<{ needsRegistration: boolean }>;
  signupWithEmail: (email: string) => Promise<{ needsRegistration: boolean }>;
  completeRegistration: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
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
        // Token var, kullanıcıyı yükle
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
      console.error("Auth initialize error:", error);
      await clearAuthData();
    } finally {
      set({ isLoading: false });
    }
  },

  // Google login
  loginWithGoogle: async (accessToken: string) => {
    set({ isLoading: true });
    try {
      const response = await authService.oauth({
        provider: AuthProvider.GOOGLE,
        token: accessToken,
      });

      if (response.isNewUser) {
        // Yeni kullanıcı, kayıt ekranına yönlendir
        set({ tempToken: response.tempToken, isLoading: false });
        return { needsRegistration: true };
      }

      // Mevcut kullanıcı, login başarılı
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

  // E-posta login (Beta)
  signupWithEmail: async (email: string) => {
    set({ isLoading: true });
    try {
      const response = await authService.emailSignup({
        email,
      });

      if (response.isNewUser) {
        // Yeni kullanıcı, kayıt ekranına yönlendir
        set({ tempToken: response.tempToken, isLoading: false });
        return { needsRegistration: true };
      }

      // Mevcut kullanıcı, login başarılı
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
  // Apple login - İleride aktif edilecek
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

  // Kayıtı tamamla
  completeRegistration: async (username: string) => {
    const { tempToken } = get();
    if (!tempToken) {
      throw new Error("Geçici token bulunamadı");
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

  // Hesabı sil
  deleteAccount: async () => {
    set({ isLoading: true });
    try {
      await authService.deleteAccount();
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        tempToken: null,
        isLoading: false,
      });
    }
  },

  // Temp token setter
  setTempToken: (token: string | null) => {
    set({ tempToken: token });
  },
}));
