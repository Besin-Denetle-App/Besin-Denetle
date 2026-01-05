export declare const MAX_VARIANTS = 3;
export declare const TEMP_TOKEN_EXPIRY_MS: number;
export declare const AI_RATE_LIMIT_MS: number;
export declare const DEFAULT_PRODUCT_IMAGE = "/images/placeholder-product.png";
export declare const SCORE_CHANGES: {
    readonly NEW_UP: 1;
    readonly NEW_DOWN: -1;
    readonly UP_TO_DOWN: -2;
    readonly DOWN_TO_UP: 2;
};
export declare const API_ENDPOINTS: {
    readonly AUTH: {
        readonly OAUTH: "/api/auth/oauth";
        readonly REGISTER: "/api/auth/register";
        readonly REFRESH: "/api/auth/refresh";
        readonly LOGOUT: "/api/auth/logout";
    };
    readonly PRODUCTS: {
        readonly SCAN: "/api/products/scan";
        readonly CONFIRM: "/api/products/confirm";
        readonly REJECT: "/api/products/reject";
    };
    readonly CONTENT: {
        readonly REJECT: "/api/content/reject";
    };
    readonly ANALYSIS: {
        readonly REJECT: "/api/analysis/reject";
    };
};
