import {BaseTokenStrategy} from "./BaseTokenStrategy";
import {ConvertedNodeResponse} from "./ConvertedNodeResponse";
import Text = marked.Tokens.Text;
import {marked} from "marked";
import Token = marked.Token;
import {createNode} from "../utils";
import {compose} from "./TextComposer";

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