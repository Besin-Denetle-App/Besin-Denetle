import { AuthProvider, IUser } from '../types';
export interface OAuthRequest {
    provider: AuthProvider;
    token: string;
}
export interface OAuthLoginResponse {
    accessToken: string;
    refreshToken: string;
    user: IUser;
}
export interface OAuthRegisterResponse {
    tempToken: string;
    email: string;
    needsRegistration: true;
}
export interface RegisterRequest {
    tempToken: string;
    username: string;
    termsAccepted: boolean;
}
export interface RegisterResponse {
    accessToken: string;
    refreshToken: string;
    user: IUser;
}
export interface RefreshTokenRequest {
    refreshToken: string;
}
export interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
}
