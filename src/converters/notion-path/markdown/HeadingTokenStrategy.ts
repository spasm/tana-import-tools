import {BaseTokenStrategy} from "./BaseTokenStrategy";
import {ConvertedNodeResponse} from "./ConvertedNodeResponse";
import {marked} from "marked";
import {createNode} from "../utils";

type Heading = marked.Tokens.Heading;

export class HeadingTokenStrategy extends BaseTokenStrategy {
    convert(): ConvertedNodeResponse {

        const token = this._token as Heading;
        return new ConvertedNodeResponse(createNode(`**${token.text}**`), this._token);
        
    }
}