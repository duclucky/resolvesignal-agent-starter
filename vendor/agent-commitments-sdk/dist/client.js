import { encodeFunctionData } from "viem";
import { arcTestnet, arcTestnetDeployment, arcMainnetPilotDeployment, networkForChain } from "./network-config.js";
import { adapterAbi, agenticCommerceAbi, budgetVaultAbi, erc20Abi } from "./abi.js";
export function createViemChainReader(client) {
    return {
        readContract: (request) => client.readContract(request),
        getBlockNumber: client.getBlockNumber ? () => client.getBlockNumber() : undefined,
        simulateContract: client.simulateContract ? (request) => client.simulateContract(request) : undefined,
        getTransactionReceipt: async (request) => {
            try {
                const receipt = await client.getTransactionReceipt(request);
                return { status: receipt.status };
            }
            catch (error) {
                if (error instanceof Error && error.name === "TransactionReceiptNotFoundError")
                    return undefined;
                throw error;
            }
        },
    };
}
export class AgentCommitmentsClient {
    chainId;
    vault;
    adapter;
    reader;
    escrow;
    token;
    constructor(chainId, vault, adapter, reader, escrow) {
        this.chainId = chainId;
        this.vault = vault;
        this.adapter = adapter;
        this.reader = reader;
        this.escrow = escrow;
        this.token = networkForChain(chainId).usdc;
    }
    prepareGrant(args) {
        return this.call(this.vault, budgetVaultAbi, "createGrant", [
            args.grantId,
            args.parentId,
            args.grantee,
            args.cap,
            args.expiresAt,
            args.providers ?? [],
            args.evaluators ?? [],
        ]);
    }
    prepareDeposit(amount) { return this.call(this.vault, budgetVaultAbi, "deposit", [amount]); }
    prepareDepositApproval(amount) { return this.call(this.token, erc20Abi, "approve", [this.vault, amount]); }
    prepareSetPaused(value) { return this.call(this.vault, budgetVaultAbi, "setPaused", [value]); }
    prepareRevoke(grantId) { return this.call(this.vault, budgetVaultAbi, "revokeGrant", [grantId]); }
    prepareReserve(quote, providerSignature) {
        return this.call(this.vault, budgetVaultAbi, "reserve", [quote, providerSignature]);
    }
    prepareDispatch(commitmentId) { return this.call(this.adapter, adapterAbi, "dispatch", [commitmentId]); }
    prepareProviderBudget(jobId, amount, escrow) {
        return this.call(this.requireEscrow(escrow), agenticCommerceAbi, "setBudget", [jobId, amount, "0x"]);
    }
    prepareSubmit(jobId, deliverable, escrow) {
        return this.call(this.requireEscrow(escrow), agenticCommerceAbi, "submit", [jobId, deliverable, "0x"]);
    }
    prepareComplete(jobId, reason, escrow) {
        return this.call(this.requireEscrow(escrow), agenticCommerceAbi, "complete", [jobId, reason, "0x"]);
    }
    prepareReject(jobId, reason, escrow) {
        return this.call(this.requireEscrow(escrow), agenticCommerceAbi, "reject", [jobId, reason, "0x"]);
    }
    prepareClaimRefund(jobId, escrow) {
        return this.call(this.requireEscrow(escrow), agenticCommerceAbi, "claimRefund", [jobId]);
    }
    prepareFund(commitmentId) { return this.call(this.adapter, adapterAbi, "fund", [commitmentId]); }
    prepareReconcile(commitmentId) { return this.call(this.adapter, adapterAbi, "reconcile", [commitmentId]); }
    prepareCancelReservation(commitmentId) { return this.call(this.vault, budgetVaultAbi, "cancelReservation", [commitmentId]); }
    prepareWithdrawAvailable(recipient, amount) { return this.call(this.vault, budgetVaultAbi, "withdrawAvailable", [recipient, amount]); }
    async submit(call, signer) {
        if (call.chainId !== this.chainId)
            throw new Error("Prepared call chain mismatch");
        return { hash: await signer.sendTransaction(call), state: "SUBMITTED" };
    }
    async inspect(commitmentId, transactionHash) {
        if (!this.reader)
            throw new Error("A chain reader is required for inspect");
        const blockNumber = await this.reader.getBlockNumber?.();
        const [ledger, reservation, rawJobId, receipt] = await Promise.all([
            this.reader.readContract({ address: this.vault, abi: budgetVaultAbi, functionName: "ledger", blockNumber }),
            this.reader.readContract({ address: this.vault, abi: budgetVaultAbi, functionName: "reservations", args: [commitmentId], blockNumber }),
            this.reader.readContract({ address: this.adapter, abi: adapterAbi, functionName: "jobs", args: [commitmentId], blockNumber }),
            transactionHash ? this.reader.getTransactionReceipt({ hash: transactionHash }) : Promise.resolve(undefined),
        ]);
        const record = reservation;
        const economicState = Number(record.status ?? 0);
        const economicStatus = economicStatusFor(economicState);
        const jobId = typeof rawJobId === "bigint" && rawJobId > 0n ? rawJobId : undefined;
        const escrowJob = jobId && this.escrow
            ? await this.reader.readContract({ address: this.escrow, abi: agenticCommerceAbi, functionName: "getJob", args: [jobId], blockNumber })
            : undefined;
        const escrowRecord = escrowJob;
        const escrowStatus = escrowRecord?.status === undefined ? undefined : escrowStatusFor(Number(escrowRecord.status));
        const transportState = transactionHash
            ? (receipt ? (receipt.status === "success" ? "CONFIRMED" : "REVERTED") : "UNKNOWN")
            : "PREPARED";
        return {
            economicState,
            economicStatus,
            transportState,
            observedAt: new Date().toISOString(),
            observedBlock: blockNumber,
            ledger,
            reservation,
            jobId,
            escrowStatus,
            escrowJob,
            recoveryActions: recoveryActionsFor({ economicStatus, jobId, escrowStatus, budget: escrowRecord?.budget, transactionPending: Boolean(transactionHash && !receipt) }),
        };
    }
    /** Read-only check: simulation success does not mean tokens have been refunded. */
    async inspectRefundRecovery(commitmentId, transactionHash) {
        const commitment = await this.inspect(commitmentId, transactionHash);
        const amount = commitment.reservation.amount;
        const result = { commitmentId, commitment, amount };
        if (commitment.economicStatus === "REFUNDED")
            return { ...result, state: "REFUNDED" };
        if (commitment.economicStatus !== "FUNDED")
            return { ...result, state: "NOT_APPLICABLE" };
        if (transactionHash && commitment.transportState === "UNKNOWN") {
            return { ...result, state: "UNKNOWN", reason: "TRANSACTION_PENDING" };
        }
        if (commitment.escrowStatus === "FUNDED" || commitment.escrowStatus === "SUBMITTED") {
            return { ...result, state: "AWAITING_ESCROW" };
        }
        if (commitment.escrowStatus === "COMPLETED")
            return { ...result, state: "NOT_APPLICABLE" };
        if ((commitment.escrowStatus !== "REJECTED" && commitment.escrowStatus !== "EXPIRED")
            || typeof amount !== "bigint" || amount <= 0n) {
            return { ...result, state: "UNKNOWN", reason: "INVALID_EVIDENCE" };
        }
        if (commitment.observedBlock === undefined)
            return { ...result, state: "UNKNOWN", reason: "SNAPSHOT_UNAVAILABLE" };
        if (!this.reader?.simulateContract)
            return { ...result, state: "UNKNOWN", reason: "SIMULATION_UNAVAILABLE" };
        try {
            await this.reader.simulateContract({
                address: this.adapter, abi: adapterAbi, functionName: "reconcile", args: [commitmentId],
                blockNumber: commitment.observedBlock,
            });
            return { ...result, state: "READY" };
        }
        catch (error) {
            return contractReverted(error)
                ? { ...result, state: "BLOCKED", reason: "SIMULATION_REVERTED" }
                : { ...result, state: "UNKNOWN", reason: "SIMULATION_UNAVAILABLE" };
        }
    }
    /** Prepare only. Recheck before retry; retain the economic ID and never create a new payment. */
    async prepareRefundReconciliation(commitmentId, transactionHash) {
        const recovery = await this.inspectRefundRecovery(commitmentId, transactionHash);
        if (recovery.state !== "READY")
            throw new Error(`Refund is not ready: ${recovery.reason ?? recovery.state}`);
        return this.prepareReconcile(commitmentId);
    }
    async inspectVaultFunding() {
        if (!this.reader)
            throw new Error("A chain reader is required for inspectVaultFunding");
        const blockNumber = await this.reader.getBlockNumber?.();
        if (blockNumber === undefined)
            throw new Error("Funding inspection requires a pinned block number");
        const [rawLedger, balance, decimals, token] = await Promise.all([
            this.reader.readContract({ address: this.vault, abi: budgetVaultAbi, functionName: "ledger", blockNumber }),
            this.reader.readContract({ address: this.token, abi: erc20Abi, functionName: "balanceOf", args: [this.vault], blockNumber }),
            this.reader.readContract({ address: this.token, abi: erc20Abi, functionName: "decimals", blockNumber }),
            this.reader.readContract({ address: this.vault, abi: budgetVaultAbi, functionName: "token", blockNumber }),
        ]);
        if (decimals !== 6 && decimals !== 6n)
            throw new Error("Funding inspection requires ERC-20 USDC with 6 decimals");
        if (typeof token !== "string" || token.toLowerCase() !== this.token.toLowerCase())
            throw new Error("Vault token binding mismatch");
        const ledger = rawLedger;
        const values = ["deposited", "available", "reserved", "inEscrow", "settled", "withdrawn"].map((key) => ledger?.[key]);
        if (typeof balance !== "bigint" || balance < 0n || values.some((value) => typeof value !== "bigint" || value < 0n)) {
            throw new Error("Invalid funding evidence");
        }
        const [deposited, available, reserved, inEscrow, settled, withdrawn] = values;
        if (deposited !== available + reserved + inEscrow + settled + withdrawn)
            throw new Error("Ledger conservation mismatch");
        // E has left the vault; it must not be subtracted again from the vault's physical balance.
        const recordedBacking = available + reserved;
        return {
            physicalBalance: balance, recordedBacking,
            unassignedBalance: balance > recordedBacking ? balance - recordedBacking : 0n,
            backingShortfall: balance < recordedBacking ? recordedBacking - balance : 0n,
            observedAt: new Date().toISOString(), observedBlock: blockNumber,
        };
    }
    async inspectPolicy(args) {
        if (!this.reader)
            throw new Error("A chain reader is required for inspectPolicy");
        const [depositCap, maxCommitmentAmount, maxConcurrentCommitments, activeCommitments, providerAllowed, evaluatorAllowed] = await Promise.all([
            this.reader.readContract({ address: this.vault, abi: budgetVaultAbi, functionName: "depositCap" }),
            this.reader.readContract({ address: this.vault, abi: budgetVaultAbi, functionName: "maxCommitmentAmount" }),
            this.reader.readContract({ address: this.vault, abi: budgetVaultAbi, functionName: "maxConcurrentCommitments" }),
            this.reader.readContract({ address: this.vault, abi: budgetVaultAbi, functionName: "activeCommitments" }),
            this.reader.readContract({
                address: this.vault,
                abi: budgetVaultAbi,
                functionName: "isProviderAllowed",
                args: [args.grantId, args.provider],
            }),
            this.reader.readContract({
                address: this.vault,
                abi: budgetVaultAbi,
                functionName: "isEvaluatorAllowed",
                args: [args.grantId, args.evaluator],
            }),
        ]);
        if (typeof depositCap !== "bigint"
            || typeof maxCommitmentAmount !== "bigint"
            || typeof maxConcurrentCommitments !== "bigint"
            || typeof activeCommitments !== "bigint"
            || typeof providerAllowed !== "boolean"
            || typeof evaluatorAllowed !== "boolean")
            throw new Error("Vault returned an invalid budget policy");
        return {
            depositCap,
            maxCommitmentAmount,
            maxConcurrentCommitments,
            activeCommitments,
            providerAllowed,
            evaluatorAllowed,
            observedAt: new Date().toISOString(),
        };
    }
    call(to, abi, functionName, args) {
        return { chainId: this.chainId, to, data: encodeFunctionData({ abi, functionName, args }), value: 0n };
    }
    requireEscrow(override) {
        const target = override ?? this.escrow
            ?? (this.chainId === arcTestnet.chainId ? arcTestnetDeployment.erc8183Escrow : undefined);
        if (!target)
            throw new Error("An ERC-8183 escrow address is required for this chain");
        return target;
    }
}
function contractReverted(error) {
    let current = error;
    for (let depth = 0; current && typeof current === "object" && depth < 16; depth++) {
        const detail = current;
        if (detail.name === "ContractFunctionRevertedError" || detail.name === "ExecutionRevertedError")
            return true;
        current = detail.cause;
    }
    return false;
}
export function createArcTestnetClient(reader) {
    return new AgentCommitmentsClient(arcTestnet.chainId, arcTestnetDeployment.budgetVault, arcTestnetDeployment.erc8183Adapter, reader, arcTestnetDeployment.erc8183Escrow);
}
/** Prepare-only factory for the limited mainnet pilot; no signer or authorization to spend is retained. */
export function createArcMainnetPilotClient(reader) {
    return new AgentCommitmentsClient(arcMainnetPilotDeployment.chainId, arcMainnetPilotDeployment.budgetVault, arcMainnetPilotDeployment.erc8183Adapter, reader, arcMainnetPilotDeployment.erc8183Escrow);
}
function economicStatusFor(value) {
    return ["NONE", "RESERVED", "FUNDED", "SETTLED", "REFUNDED", "CANCELLED"][value] ?? "UNKNOWN";
}
function escrowStatusFor(value) {
    return ["OPEN", "FUNDED", "SUBMITTED", "COMPLETED", "REJECTED", "EXPIRED"][value] ?? "UNKNOWN";
}
function recoveryActionsFor(state) {
    const actions = [];
    if (state.economicStatus === "RESERVED") {
        if (!state.jobId)
            actions.push("DISPATCH", "CANCEL_RESERVATION");
        else if (!state.escrowStatus)
            actions.push("INSPECT_ESCROW");
        else if (state.escrowStatus === "OPEN" && state.budget === 0n)
            actions.push("SET_PROVIDER_BUDGET", "CANCEL_RESERVATION");
        else if (state.escrowStatus === "OPEN")
            actions.push("FUND");
        else
            actions.push("INSPECT_ESCROW");
    }
    else if (state.economicStatus === "FUNDED") {
        if (state.escrowStatus === "COMPLETED" || state.escrowStatus === "REJECTED" || state.escrowStatus === "EXPIRED") {
            actions.push("RECONCILE");
        }
        else
            actions.push("WAIT_FOR_ESCROW");
    }
    if (state.transactionPending)
        actions.push("CHECK_TRANSACTION");
    return actions;
}
