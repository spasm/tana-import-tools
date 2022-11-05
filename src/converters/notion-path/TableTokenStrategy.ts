import {BaseTokenStrategy} from "./BaseTokenStrategy";
import {ConvertedNodeResponse} from "./ConvertedNodeResponse";
import {idgenerator} from "../../utils/utils";

export class TableTokenStrategy extends BaseTokenStrategy {
    convert(): ConvertedNodeResponse {
        return new ConvertedNodeResponse({
            name: this._token.raw,
            createdAt: 0,
            editedAt: 0,
            type: 'node',
            uid: idgenerator(),
            children: [],
            refs: []
        }, this._token);
    }
}