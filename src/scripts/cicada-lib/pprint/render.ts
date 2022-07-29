import { Doc, SimpleDoc, STag, Tag, RestoreFormat, beside, empty, flatAlt,
         nest, union, column, columns, nesting, sFail, sEmpty, sText, sLine,
         sFormat } from "./primitives";
import { spaces } from "./combinators";
import * as Fmt from "../fmt-code";

/** Removes all colorisation, emboldening and underlining from a
 * document.
 */
export function plain(d: Doc): Doc {
    switch (d.tag) {
        case Tag.Fail:          return d;
        case Tag.Empty:         return d;
        case Tag.Text:          return d;
        case Tag.Line:          return d;
        case Tag.FlatAlt:       return flatAlt(plain(d.fst), plain(d.snd));
        case Tag.Cat:           return beside(plain(d.fst), plain(d.snd));
        case Tag.Nest:          return nest(d.level, plain(d.doc));
        case Tag.Line:          return d;
        case Tag.Union:         return union(() => plain(d.fst), () => plain(d.snd));
        case Tag.Column:        return column(n => plain(d.f(n)));
        case Tag.Columns:       return columns(n => plain(d.f(n)));
        case Tag.Nesting:       return nesting(n => plain(d.f(n)));
        case Tag.Colour:        return plain(d.doc);
        case Tag.Obfuscate:     return plain(d.doc);
        case Tag.Bold:          return plain(d.doc);
        case Tag.Strikethrough: return plain(d.doc);
        case Tag.Underline:     return plain(d.doc);
        case Tag.Italicise:     return plain(d.doc);
        case Tag.RestoreFormat: return empty;
    }
}

enum DocsTag {
    DNil,
    DCons
}
interface DNil {
    tag: DocsTag.DNil
}
interface DCons {
    tag:    DocsTag.DCons
    indent: number,
    doc:    Doc,
    docs:   Docs
}
/** List of indentation/document pairs; saves an indirection over [[number,
 * Doc)].
 */
type Docs = DNil | DCons;

const dNil: Docs = {
    tag: DocsTag.DNil
};

function dCons(indent: number, doc: Doc, docs: Docs): Docs {
    return {
        tag: DocsTag.DCons,
        indent,
        doc,
        docs
    };
}

/** This is the default pretty printer. `renderPretty(ribbonFrac, width, d)`
 * renders document `d` with a page width of `width` and a ribbon width
 * of `ribbonFrac * width` characters. The ribbon width is the maximal
 * amount of non-indentation characters on a line. The parameter
 * `ribbonFrac` should be between `0.0` and `1.0`. If it is lower or
 * higher, the ribbon width will be 0 or `width` respectively.
 */
export function renderPretty(ribbonFrac: number, width: number, d: Doc): SimpleDoc {
    return renderFits(fits1, ribbonFrac, width, d);
}

/** A slightly smarter rendering algorithm with more lookahead. It provides
 * provide earlier breaking on deeply nested structures For example,
 * consider this python-ish pseudocode: `fun(fun(fun(fun(fun([abcdefg,
 * abcdefg])))))`. If we put a softbreak (+ nesting 2) after each open
 * parenthesis, and align the elements of the list to match the opening
 * brackets, this will render with @renderPretty@ and a page width of 20
 * as:
 *
 * ``
 * fun(fun(fun(fun(fun([
 *                     | abcdef,
 *                     | abcdef,
 *                     ]
 *   )))))             |
 * ``
 *
 * Where the 20c. boundary has been marked with |.  Because {@link
 * renderPretty} only uses one-line lookahead, it sees that the first line
 * fits, and is stuck putting the second and third lines after the 20-c
 * mark. In contrast, `renderSmart` will continue to check that the
 * potential document up to the end of the indentation level. Thus, it will
 * format the document as:
 *
 * ``
 * fun(                |
 *   fun(              |
 *     fun(            |
 *       fun(          |
 *         fun([       |
 *               abcdef,
 *               abcdef,
 *             ]       |
 *   )))))             |
 * ``
 *
 * Which fits within the 20c. boundary.
 */
export function renderSmart(ribbonFrac: number, width: number, d: Doc): SimpleDoc {
    return renderFits(fitsR, ribbonFrac, width, d);
}

function renderFits(fits: (p: number, m: number, w: number, sd: SimpleDoc) => boolean,
                    rFrac: number, w: number, d: Doc): SimpleDoc {

    // The ribbon width in characters.
    const r = Math.max(0, Math.min(w, Math.round(w * rFrac)));

    // n = indentation of current line
    // k = current column
    // (ie. (k >= n) && (k - n == count of inserted characters)
    function best(n: number, k: number, rf: RestoreFormat, dlist: Docs): SimpleDoc {
        switch (dlist.tag) {
            case DocsTag.DNil:
                return sEmpty;

            case DocsTag.DCons:
                const i  = dlist.indent;
                const d  = dlist.doc;
                const ds = dlist.docs;
                switch (d.tag) {
                    case Tag.Fail:          return sFail;
                    case Tag.Empty:         return best(n, k, rf, ds);
                    case Tag.Text:          return sText(d.text, best(n, k + d.text.length, rf, ds));
                    case Tag.Line:          return sLine(i, best(i, i, rf, ds));
                    case Tag.FlatAlt:       return best(n, k, rf, dCons(i, d.fst, ds));
                    case Tag.Cat:           return best(n, k, rf, dCons(i, d.fst, dCons(i, d.snd, ds)));
                    case Tag.Nest:          return best(n, k, rf, dCons(i + d.level, d.doc, ds));
                    case Tag.Union:         return nicest(n, k,
                                                          best(n, k, rf, dCons(i, d.fst, ds)),
                                                          best(n, k, rf, dCons(i, d.snd, ds)));
                    case Tag.Column:        return best(n, k, rf, dCons(i, d.f(k), ds));
                    case Tag.Columns:       return best(n, k, rf, dCons(i, d.f(w), ds));
                    case Tag.Nesting:       return best(n, k, rf, dCons(i, d.f(i), ds));
                    case Tag.Colour:        return sFormat([Fmt.setColour(d.colour)],
                                                           best(n, k, {...rf, colour: d.colour},
                                                                dCons(i, d.doc, dCons(i, rf, ds))));
                    case Tag.Obfuscate:     return sFormat([Fmt.obfuscate],
                                                           best(n, k, {...rf, obfuscate: true},
                                                                dCons(i, d.doc, dCons(i, rf, ds))));
                    case Tag.Bold:          return sFormat([Fmt.bold],
                                                           best(n, k, {...rf, bold: true},
                                                                dCons(i, d.doc, dCons(i, rf, ds))));
                    case Tag.Strikethrough: return sFormat([Fmt.strikethrough],
                                                           best(n, k, {...rf, strikethrough: true},
                                                                dCons(i, d.doc, dCons(i, rf, ds))));
                    case Tag.Underline:     return sFormat([Fmt.underline],
                                                           best(n, k, {...rf, underline: true},
                                                                dCons(i, d.doc, dCons(i, rf, ds))));
                    case Tag.Italicise:     return sFormat([Fmt.italicise],
                                                           best(n, k, {...rf, italicise: true},
                                                                dCons(i, d.doc, dCons(i, rf, ds))));
                    case Tag.RestoreFormat:
                        return sFormat(
                            [ Fmt.reset,
                              ...(d.colour != null ? [Fmt.setColour(d.colour)] : []),
                              ...(d.obfuscate      ? [Fmt.obfuscate          ] : []),
                              ...(d.bold           ? [Fmt.bold               ] : []),
                              ...(d.strikethrough  ? [Fmt.strikethrough      ] : []),
                              ...(d.underline      ? [Fmt.underline          ] : []),
                              ...(d.italicise      ? [Fmt.italicise          ] : []) ],
                            best(n, k, d, ds));
                }
        }
    }

    // nicest :: r = ribbon width, w = page width,
    //           n = indentation of the current line, k = current column
    //           x and y, the (simple) documents to choose from.
    //           precondition: first lines of x are longer than the first lines of y.
    function nicest(n: number, k: number, x: SimpleDoc, y: SimpleDoc): SimpleDoc {
        const width = Math.min(w - k, r - k + n);
        return fits(w, Math.min(n, k), width, x) ? x : y;
    }

    const initialFmt: RestoreFormat = {
        tag:           Tag.RestoreFormat,
        colour:        null,
        obfuscate:     false,
        bold:          false,
        strikethrough: false,
        underline:     false,
        italicise:     false
    };
    return sFormat([Fmt.reset], best(0, 0, initialFmt, dCons(0, d, dNil)));
}

// fits1 does 1 line lookahead.
function fits1(p: number, m: number, w: number, sd: SimpleDoc): boolean {
    if (w < 0) {
        return false;
    }
    else {
        switch (sd.tag) {
            case STag.SFail:   return false;
            case STag.SEmpty:  return true;
            case STag.SText:   return fits1(p, m, w - sd.text.length, sd.succ);
            case STag.SLine:   return true;
            case STag.SFormat: return fits1(p, m, w, sd.content);
        }
    }
}

// fitsR has a little more lookahead: assuming that nesting roughly
// corresponds to syntactic depth, fitsR checks that not only the current
// line fits, but the entire syntactic structure being formatted at this
// level of indentation fits. If we were to remove the second case for
// SLine, we would check that not only the current structure fits, but also
// the rest of the document, which would be slightly more intelligent but
// would have exponential runtime (and is prohibitively expensive in
// practice).
//
// p = pagewidth
// m = minimum nesting level to fit in
// w = the width in which to fit the first line
function fitsR(p: number, m: number, w: number, sd: SimpleDoc): boolean {
    if (w < 0) {
        return false;
    }
    else {
        switch (sd.tag) {
            case STag.SFail:   return false;
            case STag.SEmpty:  return true;
            case STag.SText:   return fitsR(p, m, w - sd.text.length, sd.succ);
            case STag.SLine:   return m < sd.indent ? fitsR(p, m, p - sd.indent, sd.content) : true;
            case STag.SFormat: return fits1(p, m, w, sd.content);
        }
    }
}

/** `renderCompact(x)` renders document `x` without adding any
 * indentation. Since no "pretty" printing is involved, this renderer is
 * very fast. The resulting output contains fewer characters than a pretty
 * printed version and can be used for output that is read by other
 * programs.
 *
 * This rendering function does not add any colorisation information.
 */
export function renderCompact(x: Doc): SimpleDoc {
    function scan(k: number, docs: Doc[]): SimpleDoc {
        if (docs.length == 0) {
            return sEmpty;
        }
        else {
            const d  = docs[0]!;
            const ds = docs.slice(1);
            switch (d.tag) {
                case Tag.Fail:          return sFail;
                case Tag.Empty:         return scan(k, ds);
                case Tag.Text:          return sText(d.text, scan(k + d.text.length, ds));
                case Tag.FlatAlt:       return scan(k, [d.fst, ...ds]);
                case Tag.Line:          return sLine(0, scan(0, ds));
                case Tag.Cat:           return scan(k, [d.fst, d.snd, ...ds]);
                case Tag.Nest:          return scan(k, [d.doc, ...ds]);
                case Tag.Union:         return scan(k, [d.snd, ...ds]);
                case Tag.Column:        return scan(k, [d.f(k), ...ds]);
                case Tag.Columns:       return scan(k, [d.f(null), ...ds]);
                case Tag.Nesting:       return scan(k, [d.f(0), ...ds]);
                case Tag.Colour:        return scan(k, [d.doc, ...ds]);
                case Tag.Obfuscate:     return scan(k, [d.doc, ...ds]);
                case Tag.Bold:          return scan(k, [d.doc, ...ds]);
                case Tag.Strikethrough: return scan(k, [d.doc, ...ds]);
                case Tag.Underline:     return scan(k, [d.doc, ...ds]);
                case Tag.Italicise:     return scan(k, [d.doc, ...ds]);
                case Tag.RestoreFormat: return scan(k, ds);
            }
        }
    }
    return scan(0, [x]);
}

/** `displayS(simpleDoc)` takes the output `simpleDoc` from a
 * rendering function and transforms it to a `string` type.
 *
 * ``javascript
 * function showWidth(w: number, x: Doc): string {
 *     return displayS(renderPretty(0.4, w, x));
 * ``
 */
export function displayS(d: SimpleDoc): string {
    function scan(d: SimpleDoc, s: string): string {
        switch (d.tag) {
            case STag.SFail:   throw Error("SFail can not appear uncaught in a rendered SimpleDoc");
            case STag.SEmpty:  return s;
            case STag.SText:   return scan(d.succ, s + d.text);
            case STag.SLine:   return scan(d.content, s + "\n" + spaces(d.indent));
            case STag.SFormat: return scan(d.content, s + Fmt.toString(d.codes));
        }
    }
    return scan(d, "");
}
