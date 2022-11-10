import {marked} from "marked";
import Token = marked.Token;
import {ConvertedNodeResponse} from "./ConvertedNodeResponse";

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