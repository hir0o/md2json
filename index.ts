import { parse } from "@textlint/text-to-ast";

const AST = parse("# headding");

console.log(AST);
