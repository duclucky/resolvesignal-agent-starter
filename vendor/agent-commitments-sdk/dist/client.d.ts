import { type Address, type Hex } from "viem";
import type { Quote } from "./quote.js";
export type TransportState = "PREPARED" | "SUBMITTED" | "UNKNOWN" | "CONFIRMED" | "REVERTED";
export type EconomicStatus = "NONE" | "RESERVED" | "FUNDED" | "SETTLED" | "REFUNDED" | "CANCELLED" | "UNKNOWN";
export type EscrowStatus = "OPEN" | "FUNDED" | "SUBMITTED" | "COMPLETED" | "REJECTED" | "EXPIRED" | "UNKNOWN";
export type RecoveryAction = "DISPATCH" | "SET_PROVIDER_BUDGET" | "FUND" | "CANCEL_RESERVATION" | "WAIT_FOR_ESCROW" | "RECONCILE" | "INSPECT_ESCROW" | "CHECK_TRANSACTION";
export interface PreparedCall {
    readonly chainId: number;
    readonly to: Address;
    readonly data: Hex;
    readonly value: 0n;
}
export interface ExternalSigner {
    sendTransaction(call: PreparedCall): Promise<Hex>;
}
export interface ContractReadRequest {
    readonly address: Address;
    readonly abi: readonly unknown[];
    readonly functionName: string;
    readonly args?: readonly unknown[];
    readonly blockNumber?: bigint | undefined;
}
export interface ChainReader {
    readContract(request: ContractReadRequest): Promise<unknown>;
    getTransactionReceipt(request: {
        hash: Hex;
    }): Promise<{
        status: "success" | "reverted";
    } | undefined>;
    getBlockNumber?: (() => Promise<bigint>) | undefined;
    simulateContract?: ((request: ContractReadRequest) => Promise<unknown>) | undefined;
}
export interface ViemPublicClientLike {
    readContract(request: ContractReadRequest): Promise<unknown>;
    getTransactionReceipt(request: {
        hash: Hex;
    }): Promise<{
        status: "success" | "reverted";
    }>;
    getBlockNumber?: (() => Promise<bigint>) | undefined;
    simulateContract?: ((request: ContractReadRequest) => Promise<unknown>) | undefined;
}
export declare function createViemChainReader(client: ViemPublicClientLike): ChainReader;
export interface CommitmentInspection {
    readonly economicState: number;
    readonly economicStatus: EconomicStatus;
    readonly transportState: TransportState;
    readonly observedAt: string;
    readonly observedBlock?: bigint | undefined;
    readonly ledger: unknown;
    readonly reservation: unknown;
    readonly jobId?: bigint | undefined;
    readonly escrowStatus?: EscrowStatus | undefined;
    readonly escrowJob?: unknown | undefined;
    readonly recoveryActions: readonly RecoveryAction[];
}
export interface RefundRecoveryInspection {
    readonly commitmentId: Hex;
    readonly commitment: CommitmentInspection;
    readonly amount?: bigint | undefined;
    readonly state: "REFUNDED" | "AWAITING_ESCROW" | "READY" | "BLOCKED" | "UNKNOWN" | "NOT_APPLICABLE";
    readonly reason?: "TRANSACTION_PENDING" | "SIMULATION_UNAVAILABLE" | "SIMULATION_REVERTED" | "INVALID_EVIDENCE" | "SNAPSHOT_UNAVAILABLE" | undefined;
}
export interface VaultFundingInspection {
    readonly physicalBalance: bigint;
    readonly recordedBacking: bigint;
    readonly unassignedBalance: bigint;
    readonly backingShortfall: bigint;
    readonly observedAt: string;
    readonly observedBlock?: bigint | undefined;
}
export interface BudgetPolicyInspection {
    readonly depositCap: bigint;
    readonly maxCommitmentAmount: bigint;
    readonly maxConcurrentCommitments: bigint;
    readonly activeCommitments: bigint;
    readonly providerAllowed: boolean;
    readonly evaluatorAllowed: boolean;
    readonly observedAt: string;
}
export declare class AgentCommitmentsClient {
    readonly chainId: number;
    readonly vault: Address;
    readonly adapter: Address;
    private readonly reader?;
    readonly escrow?: Address | undefined;
    readonly token: Address;
    constructor(chainId: number, vault: Address, adapter: Address, reader?: ChainReader | undefined, escrow?: Address | undefined);
    prepareGrant(args: {
        grantId: Hex;
        parentId: Hex;
        grantee: Address;
        cap: bigint;
        expiresAt: bigint;
        providers?: readonly Address[];
        evaluators?: readonly Address[];
    }): PreparedCall;
    prepareDeposit(amount: bigint): PreparedCall;
    prepareDepositApproval(amount: bigint): PreparedCall;
    prepareSetPaused(value: boolean): PreparedCall;
    prepareRevoke(grantId: Hex): PreparedCall;
    prepareReserve(quote: Quote, providerSignature: Hex): PreparedCall;
    prepareDispatch(commitmentId: Hex): PreparedCall;
    prepareProviderBudget(jobId: bigint, amount: bigint, escrow?: Address): PreparedCall;
    prepareSubmit(jobId: bigint, deliverable: Hex, escrow?: Address): PreparedCall;
    prepareComplete(jobId: bigint, reason: Hex, escrow?: Address): PreparedCall;
    prepareReject(jobId: bigint, reason: Hex, escrow?: Address): PreparedCall;
    prepareClaimRefund(jobId: bigint, escrow?: Address): PreparedCall;
    prepareFund(commitmentId: Hex): PreparedCall;
    prepareReconcile(commitmentId: Hex): PreparedCall;
    prepareCancelReservation(commitmentId: Hex): PreparedCall;
    prepareWithdrawAvailable(recipient: Address, amount: bigint): PreparedCall;
    submit(call: PreparedCall, signer: ExternalSigner): Promise<{
        hash: Hex;
        state: "SUBMITTED";
    }>;
    inspect(commitmentId: Hex, transactionHash?: Hex): Promise<CommitmentInspection>;
    /** Read-only check: simulation success does not mean tokens have been refunded. */
    inspectRefundRecovery(commitmentId: Hex, transactionHash?: Hex): Promise<RefundRecoveryInspection>;
    /** Prepare only. Recheck before retry; retain the economic ID and never create a new payment. */
    prepareRefundReconciliation(commitmentId: Hex, transactionHash?: Hex): Promise<PreparedCall>;
    inspectVaultFunding(): Promise<VaultFundingInspection>;
    inspectPolicy(args: {
        grantId: Hex;
        provider: Address;
        evaluator: Address;
    }): Promise<BudgetPolicyInspection>;
    private call;
    private requireEscrow;
}
export declare function createArcTestnetClient(reader?: ChainReader): AgentCommitmentsClient;
/** Prepare-only factory for the limited mainnet pilot; no signer or authorization to spend is retained. */
export declare function createArcMainnetPilotClient(reader?: ChainReader): AgentCommitmentsClient;
