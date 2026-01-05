"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_ENDPOINTS = exports.SCORE_CHANGES = exports.DEFAULT_PRODUCT_IMAGE = exports.AI_RATE_LIMIT_MS = exports.TEMP_TOKEN_EXPIRY_MS = exports.MAX_VARIANTS = void 0;
exports.MAX_VARIANTS = 3;
exports.TEMP_TOKEN_EXPIRY_MS = 5 * 60 * 1000;
exports.AI_RATE_LIMIT_MS = 10 * 1000;
exports.DEFAULT_PRODUCT_IMAGE = '/images/placeholder-product.png';
exports.SCORE_CHANGES = {
    NEW_UP: 1,
    NEW_DOWN: -1,
    UP_TO_DOWN: -2,
    DOWN_TO_UP: 2,
};
exports.API_ENDPOINTS = {
    AUTH: {
        OAUTH: '/api/auth/oauth',
        REGISTER: '/api/auth/register',
        REFRESH: '/api/auth/refresh',
        LOGOUT: '/api/auth/logout',
    },
    PRODUCTS: {
        SCAN: '/api/products/scan',
        CONFIRM: '/api/products/confirm',
        REJECT: '/api/products/reject',
    },
    CONTENT: {
        REJECT: '/api/content/reject',
    },
    ANALYSIS: {
        REJECT: '/api/analysis/reject',
    },
};
//# sourceMappingURL=constants.js.map