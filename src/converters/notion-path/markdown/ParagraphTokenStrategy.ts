import {BaseTokenStrategy} from "./BaseTokenStrategy";
import {ConvertedNodeResponse} from "./ConvertedNodeResponse";
import {marked} from "marked";
import {createNode} from "../utils";
import {compose} from "./TextComposer";

type Paragraph = marked.Tokens.Paragraph;

export class ParagraphTokenStrategy extends BaseTokenStrategy {
    convert(): ConvertedNodeResponse {

        let para = "";
        const token = this._token as Paragraph;

        token?.tokens.forEach(t => {
            para += compose(t);
        });

        return new ConvertedNodeResponse(createNode(para), this._token);
    }
}