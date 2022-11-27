import {BaseTokenStrategy} from "./BaseTokenStrategy";
import {ConvertedNodeResponse} from "./ConvertedNodeResponse";
import {marked} from "marked";
import {createNode} from "../utils";
import {compose} from "./TextComposer";

type Text = marked.Tokens.Text;
type Token = marked.Token;

export class TextTokenStrategy extends BaseTokenStrategy {
    convert(): ConvertedNodeResponse {

        let text = "";
        const token = this._token as Text;

        token?.tokens?.forEach((t: Token) => {
            text += compose(t);
        });

        return new ConvertedNodeResponse(createNode(text), this._token);
    }
}