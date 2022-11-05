import {BaseTokenStrategy} from "./BaseTokenStrategy";
import {ConvertedNodeResponse} from "./ConvertedNodeResponse";
import {idgenerator} from "../../utils/utils";
import {marked} from "marked";
import Heading = marked.Tokens.Heading;

export class HeadingTokenStrategy extends BaseTokenStrategy {
    convert(): ConvertedNodeResponse {

        const token = this._token as Heading;
        return new ConvertedNodeResponse({
            name: `**${token.text}**`,
            type: 'node',
            uid: idgenerator(),
            createdAt: 0,
            editedAt: 0,
            children: [],
            refs: []
        }, this._token);
    }
}