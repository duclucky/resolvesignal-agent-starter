import { type Address, type Hex } from "viem";
export type InboundFundingStage = "PLANNED" | "BURN_SUBMITTED" | "BURN_CONFIRMED" | "ATTESTED" | "MINT_SUBMITTED" | "MINT_CONFIRMED" | "DEPOSIT_SUBMITTED" | "DEPOSIT_CONFIRMED";
export type InboundFundingAction = "SUBMIT_BURN" | "CHECK_BURN" | "FETCH_ATTESTATION" | "SUBMIT_MINT" | "CHECK_MINT" | "APPROVE_AND_DEPOSIT" | "CHECK_DEPOSIT" | "COMPLETE";
export interface InboundFundingRoute {
    readonly protocol: "CCTP";
    readonly sourceChainId: number;
    readonly sourceDomain: number;
    readonly destinationChainId: number;
    readonly destinationDomain: number;
    readonly recipient: Address;
    readonly budgetVault: Address;
    readonly operationId: Hex;
    readonly requestedAmount: bigint;
}
export interface InboundFundingEvidence {
    readonly burnTxHash: Hex | undefined;
    readonly messageHash: Hex | undefined;
    readonly attestationHash: Hex | undefined;
    readonly mintTxHash: Hex | undefined;
    readonly receivedAmount: bigint | undefined;
    readonly depositTxHash: Hex | undefined;
    readonly depositAmount: bigint | undefined;
}
export interface InboundFundingState {
    readonly id: Hex;
    readonly stage: InboundFundingStage;
    readonly route: InboundFundingRoute;
    readonly evidence: InboundFundingEvidence;
}
export type InboundFundingEvent = {
    readonly type: "BURN_SUBMITTED";
    readonly txHash: Hex;
} | {
    readonly type: "BURN_CONFIRMED";
    readonly txHash: Hex;
    readonly messageHash: Hex;
} | {
    readonly type: "ATTESTATION_RECEIVED";
    readonly messageHash: Hex;
    readonly attestationHash: Hex;
} | {
    readonly type: "MINT_SUBMITTED";
    readonly txHash: Hex;
} | {
    readonly type: "MINT_CONFIRMED";
    readonly txHash: Hex;
    readonly receivedAmount: bigint;
} | {
    readonly type: "DEPOSIT_SUBMITTED";
    readonly txHash: Hex;
    readonly amount: bigint;
} | {
    readonly type: "DEPOSIT_CONFIRMED";
    readonly txHash: Hex;
    readonly amount: bigint;
};
export declare class InboundFundingConflictError extends Error {
    constructor(message?: string);
}
export declare function createInboundFunding(route: InboundFundingRoute): InboundFundingState;
export declare function advanceInboundFunding(state: InboundFundingState, event: InboundFundingEvent): InboundFundingState;
export declare function budgetCreditableAmount(state: InboundFundingState): bigint;
export declare function nextInboundFundingAction(state: InboundFundingState): InboundFundingAction;
