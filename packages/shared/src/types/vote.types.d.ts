export declare enum VoteType {
    UP = "UP",
    DOWN = "DOWN"
}
export declare enum VoteTarget {
    PRODUCT = "product",
    CONTENT = "content",
    ANALYSIS = "analysis"
}
export interface IVote {
    id: string;
    user_id: string;
    vote_type: VoteType;
    product_id: string | null;
    product_content_id: string | null;
    content_analysis_id: string | null;
    created_at: Date;
    updated_at: Date;
}
export interface ICreateVote {
    user_id: string;
    vote_type: VoteType;
    product_id?: string | null;
    product_content_id?: string | null;
    content_analysis_id?: string | null;
}
