import type { Address, Hex } from "viem";
import type { ResolveSignalPaymentRequest, ResolveSignalWallet, ResolveSignalWalletInspection } from "./resolvesignal-session.js";
export { FileResolveSignalSessionStore } from "./resolvesignal-node-store.js";
export type CircleCommandRunner = (args: readonly string[]) => Promise<unknown>;
/** Uses an already installed/authenticated Circle CLI. Does not log in, fund or deploy. */
export declare class CircleCliResolveSignalWallet implements ResolveSignalWallet {
    readonly options: {
        run?: CircleCommandRunner;
        factory?: Address;
        now?: () => number;
    };
    private readonly run;
    constructor(options?: {
        run?: CircleCommandRunner;
        factory?: Address;
        now?: () => number;
    });
    private command;
    /** Read-only mainnet readiness; account email/session material never leaves this method. */
    checkWallet(payer: Address): Promise<{
        ready: true;
        chainId: number;
        payer: `0x${string}`;
    }>;
    signAdmission(typed: Record<string, any>, payer: Address): Promise<Hex>;
    private common;
    inspect(p: ResolveSignalPaymentRequest): Promise<ResolveSignalWalletInspection>;
    pay(p: ResolveSignalPaymentRequest): Promise<Record<string, any>>;
}
