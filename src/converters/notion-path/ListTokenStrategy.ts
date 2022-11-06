import {BaseTokenStrategy} from "./BaseTokenStrategy";
import {ConvertedNodeResponse} from "./ConvertedNodeResponse";
import {TanaIntermediateNode} from "../../types/types";
import {TextTokenStrategy} from "./TextTokenStrategy";
import {BlockQuoteTokenStrategy} from "./BlockQuoteTokenStrategy";
import {debugPrint} from "./utils";
import {marked} from "marked";
import ListItem = marked.Tokens.ListItem;
import List = marked.Tokens.List;
import {HeadingTokenStrategy} from "./HeadingTokenStrategy";
import {ParagraphTokenStrategy} from "./ParagraphTokenStrategy";
import {CodeTokenStrategy} from "./CodeTokenStrategy";

export class ListTokenStrategy extends BaseTokenStrategy {
    convert(): ConvertedNodeResponse {

        const tempNode: TanaIntermediateNode = {
            createdAt: 0,
            editedAt: 0,
            name: "temp",
            type: "node",
            uid: "",
            children: [],
            refs: []
        };
        this.addListToNode(tempNode, this._token as List);

        const response = new ConvertedNodeResponse(undefined, this._token);
        if (tempNode.children) {
            response.addTanaNodes(tempNode.children);
        }

        return response;
    }

    private addListToNode(node: TanaIntermediateNode, token: List): void {

        token.items.forEach(t => {
            if (t.type == "list_item") {
                this.addListItemToNode(node, t);
            }
        });
    }

    private addListItemToNode(node: TanaIntermediateNode, token: ListItem): void {

        let currentNode: TanaIntermediateNode;

        token.tokens.forEach(t => {

            let newNode: TanaIntermediateNode | undefined;

            switch (t.type) {
                case "list": {
                    // if it's a list, it's the start of a new list
                    this.addListToNode(currentNode, t);
                    return;
                }
                case "text": {
                    newNode = new TextTokenStrategy(t).convert().firstNode();
                    break;
                }
                case "blockquote": {
                    newNode = new BlockQuoteTokenStrategy(t).convert().firstNode();
                    break;
                }
                case "heading": {
                    newNode = new HeadingTokenStrategy(t).convert().firstNode();
                    break;
                }
                case "paragraph": {
                    newNode = new ParagraphTokenStrategy(t).convert().firstNode();
                    break;
                }
                case "code": {
                    newNode = new CodeTokenStrategy(t).convert().firstNode();
                    break;
                }
                default: {
                    debugPrint(`Unknown type in ListTokenStrategy: ${t.type}, with content: ${t.raw}`);
                }
            }
            if(newNode) {
                currentNode = newNode;
                node.children?.push(currentNode);
            }
        });
    }
}