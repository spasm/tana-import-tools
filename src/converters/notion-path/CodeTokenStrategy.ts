import {BaseTokenStrategy} from "./BaseTokenStrategy";
import {ConvertedNodeResponse} from "./ConvertedNodeResponse";
import {idgenerator} from "../../utils/utils";
import {marked} from "marked";
import Code = marked.Tokens.Code;

export class CodeTokenStrategy extends BaseTokenStrategy {
    convert(): ConvertedNodeResponse {
        const token = this._token as Code;
        return new ConvertedNodeResponse({
            name: token.text,
            createdAt: 0,
            editedAt: 0,
            type: 'codeblock',
            uid: idgenerator(),
            children: [],
            refs: []
        }, this._token);
    }
}