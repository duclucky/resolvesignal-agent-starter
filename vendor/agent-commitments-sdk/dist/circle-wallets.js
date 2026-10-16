import { isHex } from "viem";
import { arcTestnet } from "./network-config.js";
const circleStates = new Set([
    "CANCELLED",
    "CLEARED",
    "COMPLETE",
    "CONFIRMED",
    "DENIED",
    "FAILED",
    "INITIATED",
    "QUEUED",
    "SENT",
    "STUCK",
]);
export function circleExecutionPhase(state) {
    switch (state) {
        case "INITIATED":
        case "QUEUED":
        case "CLEARED":
        case "SENT":
            return "PENDING";
        case "CONFIRMED":
            return "MINED";
        case "COMPLETE":
            return "FINALIZED";
        case "CANCELLED":
        case "DENIED":
        case "FAILED":
            return "TERMINAL_FAILURE";
        case "STUCK":
            return "UNKNOWN";
    }
}
function parseState(value) {
    if (!value || !circleStates.has(value)) {
        throw new Error(`Circle returned an unsupported transaction state: ${value ?? "missing"}`);
    }
    return value;
}
export class CircleWalletsExecutor {
    circle;
    walletId;
    feeLevel;
    constructor(circle, walletId, options = {}) {
        this.circle = circle;
        this.walletId = walletId;
        if (!walletId.trim())
            throw new Error("Circle walletId is required");
        this.feeLevel = options.feeLevel ?? "MEDIUM";
    }
    async submit(call, metadata) {
        if (call.chainId !== arcTestnet.chainId) {
            throw new Error("Circle Wallets execution is enabled only for ARC-TESTNET; Arc mainnet support is not documented");
        }
        if (call.value !== 0n)
            throw new Error("Circle Wallets executor only accepts zero-value Agent Commitments calls");
        if (!metadata.idempotencyKey.trim())
            throw new Error("Circle idempotencyKey is required");
        const response = await this.circle.createContractExecutionTransaction({
            walletId: this.walletId,
            contractAddress: call.to,
            callData: call.data,
            fee: { type: "level", config: { feeLevel: this.feeLevel } },
            idempotencyKey: metadata.idempotencyKey,
            ...(metadata.refId === undefined ? {} : { refId: metadata.refId }),
        });
        const transactionId = response.data?.id;
        const rawState = response.data?.state;
        if (!transactionId || !rawState)
            throw new Error("Circle did not return a transaction id and state");
        const circleState = parseState(rawState);
        return { transactionId, circleState, phase: circleExecutionPhase(circleState) };
    }
    async inspect(transactionId) {
        if (!transactionId.trim())
            throw new Error("Circle transaction id is required");
        const response = await this.circle.getTransaction({ id: transactionId });
        const transaction = response.data?.transaction;
        if (!transaction)
            throw new Error("Circle did not return a transaction");
        if (transaction.id !== transactionId)
            throw new Error("Circle returned a different transaction id");
        if (transaction.blockchain !== undefined && transaction.blockchain !== "ARC-TESTNET") {
            throw new Error(`Circle returned transaction for unexpected blockchain ${transaction.blockchain}`);
        }
        const circleState = parseState(transaction.state);
        const transactionHash = transaction.txHash;
        if (transactionHash !== undefined && !isHex(transactionHash)) {
            throw new Error("Circle returned an invalid transaction hash");
        }
        return {
            transactionId,
            circleState,
            phase: circleExecutionPhase(circleState),
            ...(transactionHash === undefined ? {} : { transactionHash }),
            ...(transaction.errorReason === undefined ? {} : { errorReason: transaction.errorReason }),
            ...(transaction.errorDetails === undefined ? {} : { errorDetails: transaction.errorDetails }),
        };
    }
    /**
     * Polls the transaction created earlier. This method never submits or retries
     * an onchain operation, so callers can resume it safely after a restart.
     */
    async waitForFinality(transactionId, options = {}) {
        const pollIntervalMs = options.pollIntervalMs ?? 1_000;
        const timeoutMs = options.timeoutMs ?? 120_000;
        if (!Number.isFinite(pollIntervalMs) || pollIntervalMs < 0) {
            throw new Error("Circle pollIntervalMs must be a non-negative finite number");
        }
        if (!Number.isFinite(timeoutMs) || timeoutMs < 0) {
            throw new Error("Circle timeoutMs must be a non-negative finite number");
        }
        const deadline = Date.now() + timeoutMs;
        while (true) {
            if (options.signal?.aborted)
                throw new Error("Circle transaction polling was aborted");
            const inspection = await this.inspect(transactionId);
            if (inspection.phase === "FINALIZED" ||
                inspection.phase === "TERMINAL_FAILURE" ||
                inspection.phase === "UNKNOWN") {
                return inspection;
            }
            const remainingMs = deadline - Date.now();
            if (remainingMs <= 0) {
                throw new Error(`Circle transaction ${transactionId} polling timed out`);
            }
            await abortableDelay(Math.min(pollIntervalMs, remainingMs), options.signal);
        }
    }
}
function abortableDelay(delayMs, signal) {
    if (delayMs === 0)
        return Promise.resolve();
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            signal?.removeEventListener("abort", onAbort);
            resolve();
        }, delayMs);
        const onAbort = () => {
            clearTimeout(timer);
            reject(new Error("Circle transaction polling was aborted"));
        };
        signal?.addEventListener("abort", onAbort, { once: true });
    });
}
