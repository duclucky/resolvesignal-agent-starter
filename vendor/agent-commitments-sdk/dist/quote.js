import { encodeAbiParameters, hashTypedData, keccak256 } from "viem";
export const quoteTypes = {
    Quote: [
        { name: "grantId", type: "bytes32" }, { name: "operationId", type: "bytes32" },
        { name: "provider", type: "address" }, { name: "evaluator", type: "address" },
        { name: "token", type: "address" },
        { name: "adapter", type: "address" },
        { name: "amount", type: "uint256" }, { name: "quoteExpiresAt", type: "uint256" },
        { name: "jobExpiresAt", type: "uint256" }, { name: "workHash", type: "bytes32" },
        { name: "nonce", type: "bytes32" },
    ],
};
export function quoteTypedData(chainId, vault, quote) {
    return {
        domain: { name: "AgentCommitments", version: "1", chainId, verifyingContract: vault },
        types: quoteTypes,
        primaryType: "Quote",
        message: quote,
    };
}
export function quoteDigest(chainId, vault, quote) {
    return hashTypedData(quoteTypedData(chainId, vault, quote));
}
export function deriveCommitmentId(chainId, vault, grantId, operationId) {
    return keccak256(encodeAbiParameters([{ type: "uint256" }, { type: "address" }, { type: "bytes32" }, { type: "bytes32" }], [BigInt(chainId), vault, grantId, operationId]));
}
