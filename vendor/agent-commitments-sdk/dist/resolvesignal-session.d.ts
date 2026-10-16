import { type Address, type Hex } from "viem";
import { type ResolveSignalQuote, type ResolveSignalReader, type ResolveSignalSeller } from "./resolvesignal.js";
export interface ResolveSignalPaymentRequest {
    url: string;
    requestKey: string;
    inputHash: string;
    payer: Address;
    maxAmountAtomic: bigint;
}
export interface ResolveSignalWalletInspection {
    status: string;
    price?: {
        amount: string;
    };
    chains?: string[];
    seller?: string;
    scheme?: string;
}
/** Existing wallet custody/signing boundary. No vault funding or contract execution. */
export interface ResolveSignalWallet {
    signAdmission(typedData: Record<string, any>, payer: Address): Promise<Hex>;
    inspect(request: ResolveSignalPaymentRequest): Promise<ResolveSignalWalletInspection>;
    pay(request: ResolveSignalPaymentRequest): Promise<Record<string, any>>;
}
export interface ResolveSignalSession {
    version: 2;
    revision: number;
    operationId: Hex;
    configHash: Hex;
    payer: Address;
    salt: Hex;
    workHash: Hex;
    requestKey: string;
    idempotencyKey: string;
    challenge?: {
        typed_data: Record<string, any>;
        challenge_token: string;
    };
    admissionSignature?: Hex;
    quoteAttempted?: boolean;
    quote?: ResolveSignalQuote;
    paymentAttempted?: boolean;
}
/** Private durable atomic create/CAS. Never store business input or result here. */
export interface ResolveSignalSessionStore {
    load(key: string): Promise<ResolveSignalSession | undefined>;
    create(key: string, value: ResolveSignalSession): Promise<boolean>;
    compareAndSwap(key: string, revision: number, value: ResolveSignalSession): Promise<boolean>;
}
export interface ResolveSignalSessionOptions {
    payer: Address;
    operationId: Hex;
    wallet: ResolveSignalWallet;
    store: ResolveSignalSessionStore;
    reader: ResolveSignalReader;
    seller?: ResolveSignalSeller;
    baseUrl?: string;
    fetch?: typeof fetch;
    now?: () => number;
}
export declare class ResolveSignalX402Session {
    readonly options: ResolveSignalSessionOptions;
    readonly baseUrl: string;
    readonly key: string;
    readonly seller: ResolveSignalSeller;
    private readonly configHash;
    private readonly fetcher;
    private readonly now;
    constructor(options: ResolveSignalSessionOptions);
    private save;
    private load;
    private headers;
    private http;
    call(input: unknown, opts: {
        salt: Hex;
        maxFeeAtomic: bigint;
        confirmPaidCall: boolean;
        resumeQuote?: boolean;
    }): Promise<Record<string, any>>;
    private checkQuote;
    /** Read-only: retrieves the original call and seller escrow. Never signs, pays or deploys. */
    recover(): Promise<{
        operationId: `0x${string}`;
        callId: string | undefined;
        paymentAttempted: boolean;
        service: Record<string, any> | undefined;
        serviceHttpStatus: number | undefined;
        escrow: import("./resolvesignal.js").ResolveSignalBinding | undefined;
        next: string;
    }>;
}
