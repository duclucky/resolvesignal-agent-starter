import { type Address, type Hex } from "viem";
import type { ContractReadRequest } from "./client.js";
export declare const RESOLVESIGNAL_USDC: "0x3600000000000000000000000000000000000000";
/** Existing seller deployment, verified read-only on 2026-10-16. No new contracts. */
export declare const RESOLVESIGNAL_SELLER: {
    readonly factory: "0xB2b41f3e45AEe1Da3D8756bd087277f1194bf3C7";
    readonly factoryCodeHash: "0x810f2d5ff8788a4d9ef58ad3446369c7e635deeacd0b6fd120f7287bbd633cd9";
    readonly operator: "0xCd71c60Eb4E0C180CeBB8359606E402255d9C407";
    readonly treasury: "0x8B26F57Ac95619887B7281573CF10764B95869CD";
};
export interface ResolveSignalSeller {
    factory: Address;
    factoryCodeHash: Hex;
    operator: Address;
    treasury: Address;
}
export interface ResolveSignalBinding {
    payer: Address;
    escrow: Address;
    factory: Address;
    token: Address;
    operator: Address;
    treasury: Address;
    amount: bigint;
    validBefore: bigint;
    completeBy: bigint;
    status: number;
    factoryVault: Address;
}
export interface ResolveSignalRequirement {
    scheme: "exact";
    network: "eip155:5042";
    asset: Address;
    amount: string;
    payTo: Address;
    maxTimeoutSeconds: number;
    extra: {
        name: string;
        version: string;
        assetTransferMethod: string;
    };
}
export interface ResolveSignalQuote {
    call_id: string;
    input_hash: string;
    quote_until: number;
    payment_allowed: boolean;
    escrow: {
        vault: Address;
        state: string;
    };
    payment_required: {
        x402Version: number;
        resource: {
            url: string;
        };
        accepts: ResolveSignalRequirement[];
    };
}
export interface ResolveSignalQuotePolicy {
    baseUrl: string;
    factory: Address;
    operator: Address;
    treasury: Address;
    payer: Address;
    amount: bigint;
    maxFeeAtomic: bigint;
    now: number;
}
export declare function validateResolveSignalQuote(q: ResolveSignalQuote, b: ResolveSignalBinding, p: ResolveSignalQuotePolicy): ResolveSignalRequirement;
export interface ResolveSignalReader {
    getChainId(): Promise<number>;
    getBlockNumber(options?: {
        cacheTime?: number;
    }): Promise<bigint>;
    getBytecode(args: {
        address: Address;
        blockNumber?: bigint;
    }): Promise<Hex | undefined>;
    readContract(args: ContractReadRequest): Promise<unknown>;
}
export declare function verifyResolveSignalSeller(reader: ResolveSignalReader, seller: ResolveSignalSeller): Promise<bigint>;
/** Read-only inspection of the seller's existing escrow; never creates a contract. */
export declare function readResolveSignalBinding(reader: ResolveSignalReader, seller: ResolveSignalSeller, escrow: Address): Promise<ResolveSignalBinding>;
export declare function validateResolveSignalAdmission(typed: Record<string, any>, payer: Address, factory: Address, now: number): void;
export declare function resolveSignalWorkHash(request: unknown, salt: Hex): Hex;
export declare function canonicalRequest(value: unknown): string;
