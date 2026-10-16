import { mkdir, open, readFile, rename, unlink } from "node:fs/promises";
import { join } from "node:path";
import { keccak256, stringToHex } from "viem";
/** Private durable recovery state. A crash-held lock fails closed and requires operator recovery. */
export class FileResolveSignalSessionStore {
    directory;
    constructor(directory) {
        this.directory = directory;
    }
    path(key) { return join(this.directory, keccak256(stringToHex(key)) + ".json"); }
    async load(key) {
        try {
            return JSON.parse(await readFile(this.path(key), "utf8"));
        }
        catch (error) {
            if (error.code === "ENOENT")
                return undefined;
            throw error;
        }
    }
    async locked(key, action) {
        await mkdir(this.directory, { recursive: true, mode: 0o700 });
        const lockPath = this.path(key) + ".lock";
        const lock = await open(lockPath, "wx", 0o600);
        try {
            return await action();
        }
        finally {
            await lock.close();
            await unlink(lockPath);
        }
    }
    async write(key, state) {
        const target = this.path(key), temp = target + ".new";
        const file = await open(temp, "w", 0o600);
        try {
            await file.writeFile(JSON.stringify(state) + "\n");
            await file.sync();
        }
        finally {
            await file.close();
        }
        await rename(temp, target);
        if (process.platform !== "win32") {
            const directory = await open(this.directory, "r");
            try {
                await directory.sync();
            }
            finally {
                await directory.close();
            }
        }
    }
    async create(key, state) {
        return this.locked(key, async () => {
            if (await this.load(key))
                return false;
            await this.write(key, state);
            return true;
        });
    }
    async compareAndSwap(key, revision, state) {
        return this.locked(key, async () => {
            const prior = await this.load(key);
            if (!prior || prior.revision !== revision || state.revision !== revision + 1)
                return false;
            await this.write(key, state);
            return true;
        });
    }
}
