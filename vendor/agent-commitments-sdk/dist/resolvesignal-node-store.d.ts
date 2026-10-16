import type { ResolveSignalSession, ResolveSignalSessionStore } from "./resolvesignal-session.js";
/** Private durable recovery state. A crash-held lock fails closed and requires operator recovery. */
export declare class FileResolveSignalSessionStore implements ResolveSignalSessionStore {
    readonly directory: string;
    constructor(directory: string);
    private path;
    load(key: string): Promise<ResolveSignalSession | undefined>;
    private locked;
    private write;
    create(key: string, state: ResolveSignalSession): Promise<boolean>;
    compareAndSwap(key: string, revision: number, state: ResolveSignalSession): Promise<boolean>;
}
