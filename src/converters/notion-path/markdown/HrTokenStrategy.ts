import {BaseTokenStrategy} from "./BaseTokenStrategy";
import {ConvertedNodeResponse} from "./ConvertedNodeResponse";

export class HrTokenStrategy extends BaseTokenStrategy {
    convert(): ConvertedNodeResponse {
        return new ConvertedNodeResponse(undefined, this._token);
    }
}