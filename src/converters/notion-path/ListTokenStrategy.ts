import {BaseTokenStrategy} from "./BaseTokenStrategy";
import {ConvertedNodeResponse} from "./ConvertedNodeResponse";
import {TanaIntermediateNode} from "../../types/types";
import {TextTokenStrategy} from "./TextTokenStrategy";
import {BlockQuoteTokenStrategy} from "./BlockQuoteTokenStrategy";
import {debugPrint} from "./utils";
import {marked} from "marked";
import ListItem = marked.Tokens.ListItem;
import List = marked.Tokens.List;

export class ListTokenStrategy extends BaseTokenStrategy {
    convert(): ConvertedNodeResponse {

        const tempNode: TanaIntermediateNode = {
            createdAt: 0,
            editedAt: 0,
            name: "temp",
            type: "node",
            uid: "",
            children: []
        };
        this.addListToNode(tempNode, this._token as List);

        const response = new ConvertedNodeResponse();
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
            switch (t.type) {
                case "list": {
                    // if it's a list, it's the start of a new list
                    this.addListToNode(currentNode, t);
                    return;
                }
                case "text": {
                    const textNode = new TextTokenStrategy(t).convert().firstNode();
                    if (textNode) {
                        currentNode = textNode;
                        node.children?.push(currentNode);
                    }
                    return;
                }
                case "blockquote": {
                    const blockQuoteNode = new BlockQuoteTokenStrategy(t).convert().firstNode();
                    if (blockQuoteNode) {
                        currentNode = blockQuoteNode;
                        node.children?.push(currentNode);
                    }
                    return;
                }
                default: {
                    debugPrint("Unknown type: " + t.type + "text: " + t.raw);
                    return;
                }
            }
        });
    }
}