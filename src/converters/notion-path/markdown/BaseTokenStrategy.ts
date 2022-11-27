import {marked} from "marked";
import {ConvertedNodeResponse} from "./ConvertedNodeResponse";
type Token = marked.Token;

export interface ITokenStrategy {
    convert(): ConvertedNodeResponse
}

export abstract class BaseTokenStrategy implements ITokenStrategy {
    protected _token: Token;

    constructor(token: Token) {
        this._token = token;
    }

    convert(): ConvertedNodeResponse {
        throw new Error("Not implemented.");
    }
}