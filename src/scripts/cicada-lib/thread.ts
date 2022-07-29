import { console } from "./console";

enum ThreadState {
    Running     = "Running",
    Finished    = "Finished",
    Joined      = "Joined",
    RaisedError = "RaisedError"
}

export class Thread {
    readonly #task: AsyncGenerator<void, any, boolean>;
    readonly id: number;
    name: string;
    #state: ThreadState;
    #result: Promise<IteratorResult<void, any>>;
    #isCancelRequested: boolean;

    /** The ID of the next thread to be created. */
    static #nextThreadID: number = 0;

    public constructor(task: () => AsyncGenerator<void, any, boolean>, name?: string) {
        this.#task              = task();
        this.id                 = Thread.#nextThreadID++;
        this.name               = name != null ? name : `thread-${this.id}`;
        this.#state             = ThreadState.Running;
        this.#isCancelRequested = false;

        /* Since this.#task is an async generator and we haven't called its
         * .next() even once, the generator isn't yet running even
         * asynchronously. Schedule its execution before returning from the
         * constructor.
         *
         * And when the promise is fulfilled or rejected, we should
         * continue the execution of the task until it finishes or raises
         * an error.
         */
        this.#result = this.#task.next()
            .then(res => this.#onSuspended(res),
                  e   => this.#onError(e));
    }

    #onSuspended(res: IteratorResult<void, any>): Promise<IteratorResult<void, any>> {
        if (res.done) {
            this.#state = ThreadState.Finished;
            return Promise.resolve(res);
        }
        else {
            return this.#task.next(this.#isCancelRequested)
                .then(res => this.#onSuspended(res),
                      e   => this.#onError(e));
        }
    }

    #onError(e: any): Promise<IteratorResult<void, any>> {
        this.#state = ThreadState.RaisedError;
        console.error(e);

        // NOTE: Returning a rejected promise here will make join() reject,
        // which is not desirable for us.
        return Promise.resolve({value: undefined, done: true});
    }

    public async join(): Promise<void> {
        switch (this.#state) {
            case ThreadState.Joined:
                throw Error(`The thread has already been joined: ${this.name}`);

            case ThreadState.RaisedError:
                /* We shouldn't raise an error here, because it's not the
                 * caller's fault. Pretend as if the thread had finished
                 * normally. */
                this.#state = ThreadState.Joined;
                break;

            default:
                /* We really want to prevent deadlocks by attempting to
                 * join a thread from within itself. But the exact moment
                 * when the interpreter evaluates the generator isn't under
                 * our control so we can't detect deadlocks. */
                this.#state = ThreadState.Joined;
                await this.#result;
        }
    }

    public async cancel(): Promise<void> {
        this.#isCancelRequested = true;
        await this.join();
    }
}
