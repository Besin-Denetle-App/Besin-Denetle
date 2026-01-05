import { VoteTarget, VoteType } from '../types';
export interface VoteRequest {
    target: VoteTarget;
    targetId: string;
    voteType: VoteType;
}
export interface VoteResponse {
    success: boolean;
    newScore: number;
    newVoteCount: number;
    previousVote: VoteType | null;
}
