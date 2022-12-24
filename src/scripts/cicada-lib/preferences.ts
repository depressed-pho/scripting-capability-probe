/** Preferences in an arbitrary data structure that can be expressed in
 * Protocol Buffers proto3. They come in two flavours: per-player and
 * per-world preferences. Note that this module isn't meant for direct use.
 */
import "./shims/text-decoder";
import "./shims/text-encoder";
import { MessageType } from "@protobuf-ts/runtime";
import { decodeOctets, encodeOctets } from "./octet-stream";

export function decodeOrCreate<T extends object>(ty: MessageType<T>,
                                                 prefs: string|undefined,
                                                 onChange: (prefs: string) => unknown): T {
    const raw = (() => {
        if (prefs === undefined) {
            return ty.create();
        }
        else {
            try {
                const bin = decodeOctets(prefs);
                return ty.fromBinary(bin);
            }
            catch (e) {
                console.error("Preference corrupted. Resetting: %o", e);
                return ty.create();
            }
        }
    })();

    // Because we don't want to deal with defineProperty and the like.
    Object.seal(raw);

    return new Proxy(raw, {
        set(_target: T, prop: PropertyKey, value: any): boolean {
            (raw as any)[prop] = value;

            const bin = ty.toBinary(raw);
            onChange(encodeOctets(bin));

            return true;
        }
    });
}
