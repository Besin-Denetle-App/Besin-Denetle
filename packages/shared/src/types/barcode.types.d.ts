export declare enum ProductType {
    UNKNOWN = 0,
    FOOD = 1,
    BEVERAGE = 2,
    PET_FOOD = 3,
    OTHER = 9
}
export interface IBarcode {
    id: string;
    code: string;
    type: ProductType;
    is_manual: boolean;
    is_flagged: boolean;
    created_at: Date;
}
export interface ICreateBarcode {
    code: string;
    type?: ProductType;
    is_manual?: boolean;
}
