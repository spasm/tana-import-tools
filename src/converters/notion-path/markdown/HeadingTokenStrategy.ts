import {BaseTokenStrategy} from "./BaseTokenStrategy";
import {ConvertedNodeResponse} from "./ConvertedNodeResponse";
import {idgenerator} from "../../utils/utils";
import {marked} from "marked";
import Heading = marked.Tokens.Heading;
import {createNode} from "./utils";

export class HeadingTokenStrategy extends BaseTokenStrategy {
    convert(): ConvertedNodeResponse {

        const token = this._token as Heading;
        return new ConvertedNodeResponse(createNode(`**${token.text}**`), this._token);
        
    }
}