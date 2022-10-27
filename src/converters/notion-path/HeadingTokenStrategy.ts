import {BaseTokenStrategy} from "./BaseTokenStrategy";
import {ConvertedNodeResponse} from "./ConvertedNodeResponse";
import {idgenerator} from "../../utils/utils";

export class HeadingTokenStrategy extends BaseTokenStrategy {
    convert(): ConvertedNodeResponse {
        return new ConvertedNodeResponse({
            name: `**${this._token}**`,
            type: 'node',
            uid: idgenerator(),
            createdAt: 0,
            editedAt: 0,
            children: []
        });
    }
}