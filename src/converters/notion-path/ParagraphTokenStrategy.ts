import {BaseTokenStrategy} from "./BaseTokenStrategy";
import {ConvertedNodeResponse} from "./ConvertedNodeResponse";
import {idgenerator} from "../../utils/utils";
import {marked} from "marked";
import Paragraph = marked.Tokens.Paragraph;

export class ParagraphTokenStrategy extends BaseTokenStrategy {
    convert(): ConvertedNodeResponse {

        let para = "";
        const token = this._token as Paragraph;

        token?.tokens.forEach(t => {
            switch (t.type) {
                case 'text':
                    para += t.text;
                    return;
                case 'em':
                    para += `__${t.text}__`;
                    return;
                case 'strong':
                    para += `**${t.text}**`;
                    return;
                case 'codespan':
                    para += `^^${t.text}^^`;
                    return;
                case 'link':
                    para += `${t.raw}`;
                    return;
                default:
                    para += `${t.raw}`;
                    return;
            }
        });

        return new ConvertedNodeResponse({
            name: para,
            type: 'node',
            uid: idgenerator(),
            createdAt: 0,
            editedAt: 0,
            children: []
        });
    }
}