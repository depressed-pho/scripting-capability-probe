/** See https://minecraft.fandom.com/wiki/Raw_JSON_text_format */

abstract class RawTextElement {}

class TextElement extends RawTextElement {
    public text: string;

    constructor(text: string) {
        super();
        this.text = text;
    }
}

class TranslateElement extends RawTextElement {
    public translate: string;
    public with?: string[] | RawText;

    constructor(translate: string, subst?: string[] | RawText) {
        super();
        this.translate = translate;
        this.with      = subst;
    }

    public addSubst(subst: string | RawText): this {
        if (this.with === undefined) {
            this.with = typeof subst === "string" ? [subst] : subst;
        }
        else if (Array.isArray(this.with)) {
            if (typeof subst === "string") {
                this.with.push(subst);
            }
            else {
                throw new TypeError("The `with' parameter already has an array of texts.");
            }
        }
        else {
            throw new TypeError("The `with' parameter already has a RawText object.");
        }
        return this;
    }
}

class ScoreElement extends RawTextElement {
    public name: string;
    public objective: string;
    public value?: number;

    constructor(name: string, objective: string, value?: number) {
        super();
        this.name      = name;
        this.objective = objective;
        this.value     = value;
    }
}

class SelectorElement extends RawTextElement {
    public selector: string;

    constructor(selector: string) {
        super();
        this.selector = selector;
    }
}

export class RawText {
    #elems: RawTextElement[];

    /** Construct a new `RawText` object. The optional argument `text`
     * specifies the initial content of the object.
     */
    public constructor(text?: string) {
        this.#elems = [];

        if (text != null) {
            this.#elems.push(new TextElement(text));
        }
    }

    /** Append a plain text to `RawText`. It may contain formatting codes.
     */
    public text(text: string): this {
        if (this.#elems.length > 0 && this.#elems.at(-1) instanceof TextElement) {
            // The last element is a text too. Merge them.
            (this.#elems.at(-1) as TextElement).text += text;
        }
        else {
            this.#elems.push(new TextElement(text));
        }
        return this;
    }

    /** Append a translation key to `RawText`. The optional argument
     * `substs` is either a list of plain strings or a `RawText`
     * object. They can be also be supplied later with {@link with}.
     */
    public translate(translationKey: string, substs: string[] | RawText): this {
        this.#elems.push(new TranslateElement(translationKey, substs));
        return this;
    }

    /** Append a substitution text or a `RawText` object if the last
     * element is a `translate`, otherwise throws a `TypeError`. Note that
     * substitution plain texts and a `RawText` object are mutually
     * exclusive. Attempts to mix them also throws a `TypeError`. */
    public with(subst: string | RawText): this {
        if (this.#elems.length == 0) {
            throw new TypeError("The RawText object is empty.");
        }
        else {
            const last = this.#elems[this.#elems.length - 1];
            if (last instanceof TranslateElement) {
                last.addSubst(subst);
            }
            else {
                throw new TypeError("The last element of RawText isn't a translated text.");
            }
        }
        return this;
    }

    /** Append a scoreboard reference to `RawText`.
     */
    public score(name: string, objective: string, value?: number): this {
        this.#elems.push(new ScoreElement(name, objective, value));
        return this;
    }

    /** Append an element name reference to `RawText`.
     */
    public selector(selector: string): this {
        this.#elems.push(new SelectorElement(selector));
        return this;
    }

    /** Called by `JSON.stringify()`. */
    public toJSON(): any {
        return {rawtext: this.#elems};
    }

    /** Override `Object.prototype.toString`. */
    public toString(): string {
        return JSON.stringify(this);
    }
}
