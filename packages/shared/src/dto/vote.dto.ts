import { VoteTarget, VoteType } from '../types';

/**
 * Oy verme isteği
 */
export interface VoteRequest {
  target: VoteTarget;
  targetId: string;
  voteType: VoteType;
}

/**
 * Oy verme yanıtı
 */
export interface VoteResponse {
  success: boolean;
  newScore: number;
  newVoteCount: number;
  previousVote: VoteType | null; // Önceki oy (değişim için)
}
