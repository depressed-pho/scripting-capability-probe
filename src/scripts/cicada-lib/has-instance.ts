/** This is a workaround for
 * https://github.com/MicrosoftDocs/minecraft-creator/issues/353 which
 * makes "instanceof" fragile for any user-defined classes.
 */
export function hasInstance(obj: any, ctor: Function): boolean {
    // The fast path: the whole point of this workaround is that this often
    // gives us false negatives.
    if (obj.constructor === ctor) {
        return true;
    }

    // The problem is that obj.constructor or its ancestors aren't always
    // the same object as ctor (===) even if they should be. So we resort
    // to compare their names in hope of no accidental name conflicts
    // occur.
    while (obj) {
        if (obj.constructor.name === ctor.name) {
            return true;
        }
        else {
            obj = Object.getPrototypeOf(obj);
        }
    }
    return false;
}
