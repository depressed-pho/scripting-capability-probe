import { Thread } from "cicada-lib/thread";

export class Session {
    public probingThread: Thread|null;

    /** Do not call this directly. */
    public constructor() {
        this.probingThread = null;
    }

    /** Do not call this directly. */
    public finalise(): void {
        if (this.probingThread) {
            this.probingThread.cancel();
        }
    }
}

export class SessionManager {
    /** A map from player ID to Session. */
    readonly #sessions: Map<string, Session>;

    /** Do not call this directly. */
    public constructor() {
        this.#sessions = new Map<string, Session>();
    }

    public create(playerId: string): Session {
        if (this.#sessions.has(playerId)) {
            throw Error(`Duplicate session for player: ${playerId}`);
        }
        else {
            const s = new Session();
            this.#sessions.set(playerId, s);
            return s;
        }
    }

    public destroy(playerId: string): this {
        const s = this.#sessions.get(playerId);
        if (s) {
            s.finalise();
            this.#sessions.delete(playerId);
            return this;
        }
        else {
            throw Error(`Session not found for player: ${playerId}`);
        }
    }

    public get(playerId: string): Session {
        const session = this.#sessions.get(playerId);
        if (session) {
            return session;
        }
        else {
            throw Error(`Session not found for player: ${playerId}`);
        }
    }
}

export const sessionManager = new SessionManager();
