/**
 * @file vote.types.ts
 * @description Oylama sistemi tanımları (UP/DOWN)
 * @package @besin-denetle/shared
 */

/**
 * Oy tipi
 */
export enum VoteType {
  UP = 'UP',
  DOWN = 'DOWN',
}

/**
 * Oylama hedefi
 */
export enum VoteTarget {
  PRODUCT = 'product',
  CONTENT = 'content',
  ANALYSIS = 'analysis',
}

/**
 * Oy arayüzü
 */
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

/**
 * Oy oluşturma için gerekli alanlar
 */
export interface ICreateVote {
  user_id: string;
  vote_type: VoteType;
  product_id?: string | null;
  product_content_id?: string | null;
  content_analysis_id?: string | null;
}
