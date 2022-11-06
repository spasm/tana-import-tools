import {BaseTokenStrategy} from "./BaseTokenStrategy";
import {ConvertedNodeResponse} from "./ConvertedNodeResponse";
import {idgenerator} from "../../utils/utils";
import Text = marked.Tokens.Text;
import {marked} from "marked";
import Token = marked.Token;
import {createNode} from "./utils";

export class TextTokenStrategy extends BaseTokenStrategy {
    convert(): ConvertedNodeResponse {

        let text = "";
        const token = this._token as Text;

        token?.tokens?.forEach((t: Token) => {
            switch (t.type) {
                case 'text':
                    text += t.text;
                    return;
                case 'em':
                    text += `__${t.text}__`;
                    return;
                case 'strong':
                    text += `**${t.text}**`;
                    return;
                case 'codespan':
                    text += `\`${t.text}\``;
                    return;
                case 'link':
                    text += `${t.raw}`;
                    return;
                default:
                    text += `${t.raw}`;
                    return;
            }
        });

        return new ConvertedNodeResponse(createNode(text), this._token);
    }
}