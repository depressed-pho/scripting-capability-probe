import * as PP from "./pprint";

export interface InspectOptions {
    indentationWidth?: number,
    showHidden?: boolean,
    depth?: number,
    colors?: boolean,
    maxArrayLength?: number,
    maxStringLength?: number,
    breakLength?: number,
    compact?: boolean,
    sorted?: boolean | ((x: any, y: any) => number),
    getters?: boolean | "get" | "set"
}

const defaultOpts: Required<InspectOptions> = {
    indentationWidth: 2,
    showHidden: false,
    depth: 2,
    colors: false,
    maxArrayLength: 100,
    maxStringLength: 10000,
    breakLength: 80,
    compact: false,
    sorted: false,
    getters: false
};

enum TokenType {
    Name,
    Special,
    String,
    Symbol,
    Undefined,
    Null
}

interface Context {
    opts: Required<InspectOptions>,
    propFilter: (desc: PropertyDescriptor) => boolean,
    stylise: (token: PP.Doc, type: TokenType) => PP.Doc,
    currentDepth: number,
    seen: Set<any>,
    circular: Map<any, number>
}

export function inspect(obj: any, opts: InspectOptions = {}): string {
    const ctx: Context = {
        opts:           {...defaultOpts, ...opts},
        propFilter:     opts.showHidden ? pAllProperties : pOnlyEnumerable,
        stylise:        opts.colors ? styliseNoColor : styliseWithColor,
        currentDepth:   0,
        seen:           new Set<any>(),
        circular:       new Map<any, number>()
    };
    const doc  = inspectValue(obj, ctx);
    const sDoc = opts.compact
        ? PP.renderCompact(doc)
        : PP.renderSmart(0.4, ctx.opts.breakLength, doc);
    return PP.displayS(sDoc);
}

function styliseNoColor(token: PP.Doc, _type: TokenType): PP.Doc {
    return token;
}

function styliseWithColor(token: PP.Doc, type: TokenType): PP.Doc {
    // FIXME: Implement this properly.
    return styliseNoColor(token, type);
}

function pAllProperties(_desc: PropertyDescriptor): boolean {
    return true;
}

function pOnlyEnumerable(desc: PropertyDescriptor): boolean {
    return !!desc.enumerable;
}

function inspectValue(obj: any, ctx: Context): PP.Doc {
    switch (typeof obj) {
        case "string":
            return inspectString(obj, ctx);
        case "object":
            if (obj === null) {
                return ctx.stylise(PP.text("null"), TokenType.Null);
            }
            else {
                return inspectObject(obj, ctx);
            }
        default:
            // FIXME: Detect more types.
            return PP.text(String(obj));
    }
}

function inspectString(str: string, ctx: Context): PP.Doc {
    let trailer = PP.empty;
    if (str.length > ctx.opts.maxStringLength) {
        const remaining = str.length - ctx.opts.maxStringLength;
        str     = str.slice(0, ctx.opts.maxStringLength);
        trailer = PP.fillSep(
            `... ${remaining} more character${remaining > 1 ? "s" : ""}`.split(" ").map(PP.text));
    }
    return PP.beside(
        PP.nest(
            ctx.opts.indentationWidth,
            PP.vsep(
                PP.punctuate(
                    PP.text(" +"),
                    str.split(/(?<=\n)/)
                        .map(line => ctx.stylise(PP.text(JSON.stringify(line)), TokenType.String))))),
        trailer);
}

function inspectObject(obj: any, ctx: Context): PP.Doc {
    /* NOTE: We don't think we can tell proxies from their targets from
     * within JavaScript. Node.js "util.inspect" uses an internal API of
     * the interpreter which we can't do the same. */

    // Detect circular references.
    if (ctx.seen.has(obj)) {
        let idx = ctx.circular.get(obj);
        if (idx == null) {
            idx = ctx.circular.size + 1;
            ctx.circular.set(obj, idx);
        }
        return ctx.stylise(PP.text(`[Circular *${idx}]`), TokenType.Special);
    }

    const ctorName = constructorNameOf(obj);
    // Only list the tag in case it's non-enumerable / not an own property,
    // otherwise we'd print this twice.
    const tag      = ctx.opts.showHidden
        ? (Object.hasOwn(obj, Symbol.toStringTag)       ? obj[Symbol.toStringTag] : null)
        : (obj.propertyIsEnumerable(Symbol.toStringTag) ? obj[Symbol.toStringTag] : null);

    // If we have recursed too many times, only show the name of
    // constructor and exit.
    if (ctx.currentDepth > ctx.opts.depth) {
        const prefix = mkPrefix(ctorName, tag, "Object");
        return ctx.stylise(PP.brackets(prefix), TokenType.Special);
    }

    let props: [PropertyKey, PropertyDescriptor][];
    let braces: [PP.Doc, PP.Doc];
    let inspector: (obj: any, ctx: Context) => PP.Doc[];
    if (Array.isArray(obj)) {
        // Only show the constructor for non-ordinary ("Foo [...]") arrays.
        const prefix = (ctorName !== "Array" || tag !== null)
            ? PP.beside(mkPrefix(ctorName, tag, "Array", obj.length), PP.space)
            : PP.empty;
        props     = Object.entries(Object.getOwnPropertyDescriptors(obj))
                          .filter(([key, desc]) => !isIndex(key) && ctx.propFilter(desc));
        braces    = [PP.beside(prefix, PP.lbracket), PP.rbracket];
        inspector = inspectArray;
    }
    // FIXME: Detect more containers
    else {
        braces = [PP.lbrace, PP.rbrace];
        inspector = () => [PP.text("FIXME")];
    }

    ctx.seen.add(obj);
    ctx.currentDepth++;
    const doc = PP.softlineCat(
        PP.nest(
            ctx.opts.indentationWidth,
            PP.softlineCat(
                braces[0],
                PP.fillSep(
                    PP.punctuate(
                        PP.comma, inspector(obj, ctx))))),
        braces[1]);
    ctx.currentDepth--;
    ctx.seen.delete(obj);
/*
    doc = inspector(obj, ctx);
    for (const [key, desc] of props) {
        tokens.push(inspectProperty(obj, key, desc, ctx));
    }
    if (ctx.opts.showHidden) {
        for (const [key, desc] of getPrototypeProperties(obj)) {
            tokens.push(
        }
    }
*/
    return doc;
}

function inspectArray(obj: any[], ctx: Context): PP.Doc[] {
    const numElemsToShow = Math.min(obj.length, ctx.opts.maxArrayLength);
    const numHidden      = obj.length - numElemsToShow;
    const elems          = [];
    for (let i = 0; i < numElemsToShow; i++) {
        const key  = String(i);
        const desc = Object.getOwnPropertyDescriptor(obj, key);
        if (desc) {
            elems.push(inspectProperty(obj, key, desc, ctx, true));
        }
        else {
            // Missing index: this is a sparse array.
            return inspectSparseArray(obj, ctx);
        }
    }
    if (numHidden > 0) {
        elems.push(remainingText(numHidden));
    }
    return elems;
}

function inspectSparseArray(obj: any[], ctx: Context): PP.Doc[] {
    const numElemsToShow = Math.min(obj.length, ctx.opts.maxArrayLength);
    const props          = Object.entries(Object.getOwnPropertyDescriptors(obj));
    const elems          = [];

    let expectedIdx = 0;
    for (const [key, desc] of props) {
        if (elems.length > numElemsToShow) {
            break;
        }
        if (String(expectedIdx) !== key) {
            if (!isIndex(key)) {
                break;
            }
            const actualIdx = Number(key);
            const numHoles  = actualIdx - expectedIdx;
            elems.push(
                ctx.stylise(
                    PP.text(`<${numHoles} empty item${numHoles > 1 ? "s" : ""}>`),
                    TokenType.Undefined));
            expectedIdx = actualIdx;
        }
        elems.push(inspectProperty(obj, key, desc, ctx, true));
        expectedIdx++;
    }

    const numHidden = obj.length - expectedIdx;
    if (numHidden > 0) {
        elems.push(remainingText(numHidden));
    }
    return elems;
}

function inspectProperty(obj: any, key: PropertyKey, desc: PropertyDescriptor,
                        ctx: Context, valueOnly = false): PP.Doc {
    let value: PP.Doc;
    if (desc.value !== undefined) {
        value = inspectValue(desc.value, ctx);
    }
    else if (desc.get !== undefined) {
        const label = desc.set !== undefined
            ? ctx.stylise(PP.text("[Getter/Setter]"), TokenType.Special)
            : ctx.stylise(PP.text("[Getter]"       ), TokenType.Special)
        if (ctx.opts.getters === true ||
            (ctx.opts.getters === "get" && desc.set === undefined) ||
            (ctx.opts.getters === "set" && desc.set !== undefined)) {
            try {
                const v = desc.get.call(obj);
                value = PP.spaceCat(label, inspectValue(v, ctx));
            }
            catch (err) {
                value = PP.spaceCat(
                    label,
                    ctx.stylise(PP.text(`<Inspection threw: ${err}>`), TokenType.Special));
            }
        }
        else {
            value = label;
        }
    }
    else if (desc.set !== undefined) {
        value = ctx.stylise(PP.text("[Setter]"), TokenType.Special);
    }
    else {
        value = ctx.stylise(PP.text("undefined"), TokenType.Undefined);
    }

    if (valueOnly) {
        return value;
    }
    else {
        let name: PP.Doc;
        if (typeof key === "symbol") {
            name = ctx.stylise(PP.text(key.toString()), TokenType.Symbol);
        }
        else if (!desc.enumerable) {
            name = ctx.stylise(PP.brackets(PP.text(String(key))), TokenType.Name);
        }
        else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(String(key))) {
            name = ctx.stylise(PP.text(String(key)), TokenType.Name);
        }
        else {
            name = ctx.stylise(PP.text(JSON.stringify(key)), TokenType.String);
        }

        return PP.softlineCat(PP.beside(name, PP.comma), value);
    }
}

function remainingText(numHidden: number): PP.Doc {
    return PP.fillSep(
        `... ${numHidden} more item${numHidden > 1 ? "s" : ""}`.split(" ").map(PP.text));
}

function constructorNameOf(obj: any): string|null {
    while (obj) {
        const desc = Object.getOwnPropertyDescriptor(obj, "constructor");
        if (desc) {
            return desc.value.name;
        }
        obj = Object.getPrototypeOf(obj);
    }
    return null;
}

function mkPrefix(ctorName: string|null, tag: string|null, fallback: string, size?: number): PP.Doc {
    const sizeStr = size != null ? `(${size})` : "";

    if (ctorName != null) {
        if (tag != null && tag != ctorName) {
            return PP.text(`${ctorName}${sizeStr} [${tag}]`);
        }
        else {
            return PP.text(`${ctorName}${sizeStr}`);
        }
    }
    else {
        if (tag != null && tag != fallback) {
            return PP.text(`[${fallback}${sizeStr}] [${tag}]`);
        }
        else {
            return PP.text(`[${fallback}${sizeStr}]`);
        }
    }
}

function isIndex(key: string|Symbol): boolean {
    if (typeof key === "string") {
        return /^[0-9]+$/.test(key);
    }
    else {
        return false;
    }
}
