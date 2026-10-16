export type Address = `0x${string}`;
export interface NetworkManifest {
    readonly name: string;
    readonly chainId: number;
    readonly rpcUrl: string;
    readonly explorerUrl: string;
    readonly usdc: Address;
    readonly usdcDecimals: 6;
    readonly nativeGasDecimals: 18;
    readonly sharedNetwork: true;
    readonly transactionBroadcastEnabledByDefault: false;
    readonly verifiedAt: string;
}
export interface AgentCommitmentsDeployment {
    readonly chainId: number;
    readonly budgetVault: Address;
    readonly erc8183Adapter: Address;
    readonly erc8183Escrow: Address;
    readonly deployedAt: string;
}
export interface AgentCommitmentsCanaryDeployment {
    readonly chainId: number;
    readonly budgetVault: Address;
    readonly erc8183Adapter: null;
    readonly erc8183Escrow: null;
    readonly deployedAt: string;
    readonly operational: false;
}
export declare const arcMainnet: NetworkManifest;
export declare const arcTestnet: NetworkManifest;
export declare const arcTestnetDeployment: AgentCommitmentsDeployment;
export declare const arcMainnetCanaryDeployment: AgentCommitmentsCanaryDeployment;
/** Bound internal pilot. The canary export above preserves the original unbound deployment snapshot. */
export declare const arcMainnetPilotDeployment: {
    readonly chainId: number;
    readonly budgetVault: "0x2415a87B0b9280C1989F03ceA9DC1c3644777862";
    readonly erc8183Adapter: "0x0db5f0CC38F86e60FEbe495d4fFAF2Bb0288704d";
    readonly erc8183Escrow: "0x19E14a1006d106882D4c24584AAA6Ce1771E4151";
    readonly deployedAt: "2026-10-12";
    readonly bound: true;
    readonly pilotOnly: true;
    readonly independentSecurityReview: false;
};
export declare const supportedNetworks: readonly [NetworkManifest, NetworkManifest];
export declare function networkForChain(chainId: number): NetworkManifest;
