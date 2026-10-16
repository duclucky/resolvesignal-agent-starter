const shared = {
    usdc: "0x3600000000000000000000000000000000000000",
    usdcDecimals: 6,
    nativeGasDecimals: 18,
    sharedNetwork: true,
    transactionBroadcastEnabledByDefault: false,
    verifiedAt: "2026-10-09",
};
export const arcMainnet = {
    ...shared,
    name: "Arc Mainnet",
    chainId: 5042,
    rpcUrl: "https://rpc.mainnet.arc.io",
    explorerUrl: "https://explorer.arc.io",
};
export const arcTestnet = {
    ...shared,
    name: "Arc Testnet",
    chainId: 5_042_002,
    rpcUrl: "https://rpc.testnet.arc.io",
    explorerUrl: "https://explorer.testnet.arc.io",
};
export const arcTestnetDeployment = {
    chainId: arcTestnet.chainId,
    budgetVault: "0x0A1AbBf8b795e30F305C54C53A2404a595aF923a",
    erc8183Adapter: "0x18EF2ad61947800e9F3574b65cee4fd2b4361a4a",
    erc8183Escrow: "0x0747EEf0706327138c69792bF28Cd525089e4583",
    deployedAt: "2026-10-11",
};
export const arcMainnetCanaryDeployment = {
    chainId: arcMainnet.chainId,
    budgetVault: "0x2415a87B0b9280C1989F03ceA9DC1c3644777862",
    erc8183Adapter: null,
    erc8183Escrow: null,
    deployedAt: "2026-10-12",
    operational: false,
};
/** Bound internal pilot. The canary export above preserves the original unbound deployment snapshot. */
export const arcMainnetPilotDeployment = {
    chainId: arcMainnet.chainId,
    budgetVault: "0x2415a87B0b9280C1989F03ceA9DC1c3644777862",
    erc8183Adapter: "0x0db5f0CC38F86e60FEbe495d4fFAF2Bb0288704d",
    erc8183Escrow: "0x19E14a1006d106882D4c24584AAA6Ce1771E4151",
    deployedAt: "2026-10-12",
    bound: true,
    pilotOnly: true,
    independentSecurityReview: false,
};
export const supportedNetworks = [arcMainnet, arcTestnet];
export function networkForChain(chainId) {
    const network = supportedNetworks.find((candidate) => candidate.chainId === chainId);
    if (!network)
        throw new Error(`Unsupported chain ${chainId}`);
    return network;
}
