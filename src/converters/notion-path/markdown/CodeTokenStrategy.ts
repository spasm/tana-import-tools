import {BaseTokenStrategy} from "./BaseTokenStrategy";
import {ConvertedNodeResponse} from "./ConvertedNodeResponse";
import {marked} from "marked";
import Code = marked.Tokens.Code;
import {createCodeBlock} from "../utils";

export class CodeTokenStrategy extends BaseTokenStrategy {
    convert(): ConvertedNodeResponse {
        const token = this._token as Code;
        const node = createCodeBlock(token.text);
        node.codeLanguage = token.lang; // Probably cases where this doesn't quite line up with Notion vs Tana

        return new ConvertedNodeResponse(node, this._token);
    }
}