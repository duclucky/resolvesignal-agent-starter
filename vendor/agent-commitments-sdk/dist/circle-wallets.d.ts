import { type Hex } from "viem";
import type { PreparedCall } from "./client.js";
/** States currently documented by Circle Wallets transaction APIs. */
export type CircleTransactionState = "CANCELLED" | "CLEARED" | "COMPLETE" | "CONFIRMED" | "DENIED" | "FAILED" | "INITIATED" | "QUEUED" | "SENT" | "STUCK";
export type CircleExecutionPhase = "PENDING" | "MINED" | "FINALIZED" | "TERMINAL_FAILURE" | "UNKNOWN";
export type CircleFeeLevel = "LOW" | "MEDIUM" | "HIGH";
export interface CircleContractExecutionRequest {
    readonly walletId: string;
    readonly contractAddress: string;
    readonly callData: Hex;
    readonly fee: {
        readonly type: "level";
        readonly config: {
            readonly feeLevel: CircleFeeLevel;
        };
    };
    readonly idempotencyKey: string;
    readonly refId?: string;
}
export interface CircleTransactionRecord {
    readonly id: string;
    readonly state: CircleTransactionState;
    readonly blockchain?: string;
    readonly txHash?: string;
    readonly errorReason?: string;
    readonly errorDetails?: string;
}
/**
 * Minimal structural interface implemented by Circle's Developer-Controlled
 * Wallets client. Applications own its credentials and lifecycle.
 */
export interface CircleDeveloperWalletsClient {
    createContractExecutionTransaction(request: CircleContractExecutionRequest): Promise<{
        readonly data?: {
            readonly id?: string;
            readonly state?: string;
        };
    }>;
    getTransaction(request: {
        readonly id: string;
    }): Promise<{
        readonly data?: {
            readonly transaction?: CircleTransactionRecord;
        };
    }>;
}
export interface CircleWalletsSubmission {
    readonly transactionId: string;
    readonly circleState: CircleTransactionState;
    readonly phase: CircleExecutionPhase;
}
export interface CircleWalletsInspection extends CircleWalletsSubmission {
    readonly transactionHash?: Hex;
    readonly errorReason?: string;
    readonly errorDetails?: string;
}
export interface CircleWalletsWaitOptions {
    readonly pollIntervalMs?: number;
    readonly timeoutMs?: number;
    readonly signal?: AbortSignal;
}
export declare function circleExecutionPhase(state: CircleTransactionState): CircleExecutionPhase;
export declare class CircleWalletsExecutor {
    private readonly circle;
    private readonly walletId;
    private readonly feeLevel;
    constructor(circle: CircleDeveloperWalletsClient, walletId: string, options?: {
        readonly feeLevel?: CircleFeeLevel;
    });
    submit(call: PreparedCall, metadata: {
        readonly idempotencyKey: string;
        readonly refId?: string;
    }): Promise<CircleWalletsSubmission>;
    inspect(transactionId: string): Promise<CircleWalletsInspection>;
    /**
     * Polls the transaction created earlier. This method never submits or retries
     * an onchain operation, so callers can resume it safely after a restart.
     */
    waitForFinality(transactionId: string, options?: CircleWalletsWaitOptions): Promise<CircleWalletsInspection>;
}
