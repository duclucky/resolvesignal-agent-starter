import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { delimiter, join } from "node:path";
import { RESOLVESIGNAL_SELLER, validateResolveSignalAdmission } from "./resolvesignal.js";
export { FileResolveSignalSessionStore } from "./resolvesignal-node-store.js";
/** Uses an already installed/authenticated Circle CLI. Does not log in, fund or deploy. */
export class CircleCliResolveSignalWallet {
    options;
    run;
    constructor(options = {}) {
        this.options = options;
        this.run = options.run ?? runCircle;
    }
    async command(args) {
        const response = await this.run([...args, "--output", "json"]);
        if (!response || typeof response !== "object" || response.error || response.success === false)
            throw Error("resolvesignal_circle_command_failed_use_recover");
        const data = response.data ?? response;
        if (!data || typeof data !== "object" || Array.isArray(data))
            throw Error("resolvesignal_circle_response_invalid");
        return data;
    }
    /** Read-only mainnet readiness; account email/session material never leaves this method. */
    async checkWallet(payer) {
        if (!/^0x[0-9a-fA-F]{40}$/.test(payer) || /^0x0{40}$/i.test(payer))
            throw Error("resolvesignal_circle_payer_invalid");
        const status = await this.command(["wallet", "status", "--type", "agent"]);
        if (status.mainnet?.tokenStatus !== "VALID")
            throw Error("resolvesignal_circle_mainnet_session_required");
        const listed = await this.command(["wallet", "list", "--chain", "ARC", "--type", "agent"]);
        if (!Array.isArray(listed.wallets) || !listed.wallets.some((w) => w.address?.toLowerCase() === payer.toLowerCase()))
            throw Error("resolvesignal_circle_wallet_not_in_session");
        return { ready: true, chainId: 5042, payer };
    }
    async signAdmission(typed, payer) {
        validateResolveSignalAdmission(typed, payer, this.options.factory ?? RESOLVESIGNAL_SELLER.factory, (this.options.now ?? (() => Math.floor(Date.now() / 1000)))());
        const data = await this.command(["wallet", "sign", "typed-data", JSON.stringify(typed), "--address", payer, "--chain", "ARC"]);
        if (typeof data.signature !== "string" || !/^0x(?:[0-9a-fA-F]{2}){1,8192}$/.test(data.signature))
            throw Error("resolvesignal_circle_signature_invalid");
        return data.signature;
    }
    common(p) {
        const url = new URL(p.url);
        if ((url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) ||
            url.username || url.password || url.search || url.hash || !/^\/v2\/requests\/call_[A-Za-z0-9_-]{1,128}\/pay$/.test(url.pathname) ||
            !/^[0-9a-f]{64}$/.test(p.requestKey) || !/^[0-9a-f]{64}$/.test(p.inputHash) ||
            !/^0x[0-9a-fA-F]{40}$/.test(p.payer) || /^0x0{40}$/i.test(p.payer) || p.maxAmountAtomic <= 0n)
            throw Error("resolvesignal_circle_payment_scope_invalid");
        return [url.href, "-X", "POST", "--data", JSON.stringify({ input_hash: p.inputHash }), "-H", `X-Request-Key: ${p.requestKey}`];
    }
    async inspect(p) {
        return await this.command(["services", "inspect", ...this.common(p)]);
    }
    async pay(p) {
        const cap = `${p.maxAmountAtomic / 1000000n}.${(p.maxAmountAtomic % 1000000n).toString().padStart(6, "0")}`;
        const data = await this.command(["services", "pay", ...this.common(p), "--address", p.payer, "--chain", "ARC", "--max-amount", cap, "--timeout", "120"]);
        let value = data.response;
        if (typeof value === "string") {
            try {
                value = JSON.parse(value);
            }
            catch {
                throw Error("resolvesignal_circle_paid_response_invalid_use_recover");
            }
        }
        if (!value || typeof value !== "object" || Array.isArray(value))
            throw Error("resolvesignal_circle_paid_response_invalid_use_recover");
        return value;
    }
}
async function commandPath() {
    for (const directory of (process.env.PATH ?? "").split(delimiter)) {
        if (!directory)
            continue;
        if (process.platform === "win32") {
            const entry = join(directory, "node_modules", "@circle-fin", "cli", "dist", "index.js");
            try {
                await access(entry, constants.R_OK);
                return { file: process.execPath, prefix: [entry] };
            }
            catch { }
        }
        else {
            const entry = join(directory, "circle");
            try {
                await access(entry, constants.X_OK);
                return { file: entry, prefix: [] };
            }
            catch { }
        }
    }
    throw Error("resolvesignal_circle_cli_not_installed");
}
async function runCircle(args) {
    const command = await commandPath();
    return new Promise((resolve, reject) => {
        const child = spawn(command.file, [...command.prefix, ...args], { shell: false, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
        let stdout = "", size = 0, failed = false;
        const fail = (code) => { if (failed)
            return; failed = true; child.kill(); reject(Error(code)); };
        const timer = setTimeout(() => fail("resolvesignal_circle_timeout_use_recover"), 150_000);
        child.stdout.setEncoding("utf8");
        child.stdout.on("data", (chunk) => { size += Buffer.byteLength(chunk, "utf8"); if (size > 2_000_000)
            fail("resolvesignal_circle_output_limit_use_recover");
        else
            stdout += chunk; });
        child.stderr.on("data", () => { }); // Provider errors can contain signatures; never reflect them.
        child.on("error", () => { clearTimeout(timer); fail("resolvesignal_circle_process_failed_use_recover"); });
        child.on("close", code => {
            clearTimeout(timer);
            if (failed)
                return;
            if (code !== 0) {
                failed = true;
                reject(Error("resolvesignal_circle_command_failed_use_recover"));
                return;
            }
            try {
                resolve(JSON.parse(stdout));
            }
            catch {
                reject(Error("resolvesignal_circle_response_invalid_use_recover"));
            }
        });
    });
}
