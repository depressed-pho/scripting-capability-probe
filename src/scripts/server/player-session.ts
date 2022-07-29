import { Thread } from "../cicada-lib/thread";

export class Session {
    public probingThread: Thread|null;

    /** Do not call this directly. */
    public constructor() {
        this.probingThread = null;
    }
}

export class SessionManager {
    readonly #sessions: Map<string, Session>;

    /** Do not call this directly. */
    public constructor() {
        this.#sessions = new Map<string, Session>();
    }

    public create(playerName: string): Session {
        if (this.#sessions.has(playerName)) {
            throw Error(`Duplicate session for player: ${playerName}`);
        }
        else {
            const s = new Session();
            this.#sessions.set(playerName, s);
            return s;
        }
    }

    public destroy(playerName: string): this {
        if (this.#sessions.delete(playerName)) {
            return this;
        }
        else {
            throw Error(`Session not found for player: ${playerName}`);
        }
    }

    public get(playerName: string): Session {
        const session = this.#sessions.get(playerName);
        if (session) {
            return session;
        }
        else {
            throw Error(`Session not found for player: ${playerName}`);
        }
    }
}

export const sessionManager = new SessionManager();
