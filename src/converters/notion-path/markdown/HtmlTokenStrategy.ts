import {BaseTokenStrategy} from "./BaseTokenStrategy";
import {ConvertedNodeResponse} from "./ConvertedNodeResponse";
import {marked} from "marked";
import HTML = marked.Tokens.HTML;
import {createNode} from "../utils";

export class HtmlTokenStrategy extends BaseTokenStrategy {
    convert(): ConvertedNodeResponse {
        let html = (this._token as HTML).text;
        const aside = '<aside>';

        // This is the 'admonition' in Notion.  There's not a ton we can do here?
        // TODO: maybe toss a super tag on it?
        if(html.startsWith('<aside>')) {
            html = html.replace(aside, '');
            html = html.replace(/\r?\n/, '');
            return new ConvertedNodeResponse(createNode(html.trim()), this._token);
        }

        // Everything else, including if it's </aside>
        return new ConvertedNodeResponse(undefined, this._token);
    }
}