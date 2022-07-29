/** The Wadler/Leijen Pretty Printer based on
 * https://hackage.haskell.org/package/ansi-wl-pprint
 */

export { Doc, SimpleDoc, empty, text, space, hardline, line, linebreak,
         beside, nest, flatAlt } from "./pprint/primitives";
export * from "./pprint/colours";
export * from "./pprint/styles";
export { group } from "./pprint/flatten";
export * from "./pprint/combinators";
export * from "./pprint/lists";
export * from "./pprint/render";
