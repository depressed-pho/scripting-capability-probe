import { Doc, Tag, beside, nest, fail, column, columns,
         nesting, union } from "./primitives";
import { colour } from "./colours"
import { obfuscate, deobfuscate, bold, debold, strikethrough,
         unstrikethrough, underline, deunderline,
         italicise, deitalicise } from "./styles"

/** The `group` combinator is used to specify alternative layouts. The
 * document `group(d)` undoes all line breaks in document `d`. The
 * resulting line is added to the current line if that fits the
 * page. Otherwise, the document `d` is rendered without any changes.
 */
export function group(d: Doc): Doc {
    return union(() => flatten(d), d);
}

export function flatten(d: Doc): Doc {
    switch (d.tag) {
        case Tag.Fail:          return d;
        case Tag.Empty:         return d;
        case Tag.Text:          return d;
        case Tag.FlatAlt:       return d.snd;
        case Tag.Cat:           return beside(flatten(d.fst), flatten(d.snd));
        case Tag.Nest:          return nest(d.level, flatten(d.doc));
        case Tag.Line:          return fail;
        case Tag.Union:         return flatten(d.fst);
        case Tag.Column:        return column(n => flatten(d.f(n)));
        case Tag.Columns:       return columns(n => flatten(d.f(n)));
        case Tag.Nesting:       return nesting(n => flatten(d.f(n)));
        case Tag.Colour:        return colour(d.colour, flatten(d.doc));
        case Tag.Obfuscate:     return d.enabled ? obfuscate(flatten(d.doc)) : deobfuscate(flatten(d.doc));
        case Tag.Bold:          return d.enabled ? bold(flatten(d.doc)) : debold(flatten(d.doc));
        case Tag.Strikethrough: return d.enabled ? strikethrough(flatten(d.doc)) : unstrikethrough(flatten(d.doc));
        case Tag.Underline:     return d.enabled ? underline(flatten(d.doc)) : deunderline(flatten(d.doc));
        case Tag.Italicise:     return d.enabled ? italicise(flatten(d.doc)) : deitalicise(flatten(d.doc));
        case Tag.RestoreFormat: return d;
    }
}
