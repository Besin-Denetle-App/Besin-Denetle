export declare enum AuthProvider {
    GOOGLE = "google",
    APPLE = "apple"
}
export declare enum UserRole {
    USER = "user",
    ADMIN = "admin"
}
export interface IUser {
    id: string;
    username: string;
    email: string;
    auth_provider: AuthProvider;
    provider_id: string;
    role: UserRole;
    is_active: boolean;
    created_at: Date;
}
export interface ICreateUser {
    username: string;
    email: string;
    auth_provider: AuthProvider;
    provider_id: string;
    role?: UserRole;
}
