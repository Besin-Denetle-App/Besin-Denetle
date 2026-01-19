import {
  type LogoutResponse,
  type OAuthRequest,
  type OAuthResponse,
  type RefreshTokenResponse,
  type RegisterRequest,
  type RegisterResponse,
} from "@besin-denetle/shared";
import {
  clearAuthData,
  getRefreshToken,
  saveTokens,
  saveUser,
} from "../utils/storage";
import { api } from "./api";

/**
 * E-posta ile kayıt/login (Beta test için)
 */
export const emailSignup = async (request: {
  email: string;
}): Promise<OAuthResponse> => {
  const response = await api.post<OAuthResponse>("/auth/email-signup", request);
  const data = response.data;

  // Mevcut kullanıcıysa token kaydet
  if (!data.isNewUser) {
    await saveTokens(data.accessToken, data.refreshToken);
    await saveUser(data.user);
  }

  return data;
};

/**
 * OAuth ile giriş yap (Google/Apple)
 */
export const oauth = async (request: OAuthRequest): Promise<OAuthResponse> => {
  const response = await api.post<OAuthResponse>("/auth/oauth", request);
  const data = response.data;

  // Mevcut kullanıcıysa token kaydet
  if (!data.isNewUser) {
    await saveTokens(data.accessToken, data.refreshToken);
    await saveUser(data.user);
  }

  return data;
};

/**
 * Yeni kullanıcı kaydını tamamla
 */
export const register = async (
  request: RegisterRequest,
): Promise<RegisterResponse> => {
  const response = await api.post<RegisterResponse>("/auth/register", request);
  const data = response.data;

  // Token ve kullanıcı bilgisini kaydet
  await saveTokens(data.accessToken, data.refreshToken);
  await saveUser(data.user);

  return data;
};

/**
 * Access token yenile
 */
export const refresh = async (): Promise<RefreshTokenResponse | null> => {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;

    const response = await api.post<RefreshTokenResponse>("/auth/refresh", {
      refreshToken,
    });
    const data = response.data;

    await saveTokens(data.accessToken, data.refreshToken);
    return data;
  } catch {
    return null;
  }
};

/**
 * Logout
 */
export const logout = async (): Promise<void> => {
  try {
    await api.post<LogoutResponse>("/auth/logout");
  } catch {
    // Hata olsa bile yerel verileri temizle
  }
  await clearAuthData();
};

/**
 * Hesabı kalıcı olarak sil
 */
export const deleteAccount = async (): Promise<void> => {
  await api.delete("/auth/delete-account");
  await clearAuthData();
};
