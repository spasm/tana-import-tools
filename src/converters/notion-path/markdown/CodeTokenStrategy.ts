import {BaseTokenStrategy} from "./BaseTokenStrategy";
import {ConvertedNodeResponse} from "./ConvertedNodeResponse";
import {marked} from "marked";
import {createCodeBlock} from "../utils";

type Code = marked.Tokens.Code;

export class CodeTokenStrategy extends BaseTokenStrategy {
    convert(): ConvertedNodeResponse {
        const token = this._token as Code;
        const node = createCodeBlock(token.text, token.lang);
        node.codeLanguage = token.lang; // Probably cases where this doesn't quite line up with Notion vs Tana

        return new ConvertedNodeResponse(node, this._token);
    }
}