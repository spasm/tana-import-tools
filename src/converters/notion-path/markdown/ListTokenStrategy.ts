import {BaseTokenStrategy} from "./BaseTokenStrategy";
import {ConvertedNodeResponse} from "./ConvertedNodeResponse";
import {TanaIntermediateNode} from "../../../types/types";
import {TextTokenStrategy} from "./TextTokenStrategy";
import {BlockQuoteTokenStrategy} from "./BlockQuoteTokenStrategy";
import {debugPrint} from "../utils";
import {marked} from "marked";
import ListItem = marked.Tokens.ListItem;
import List = marked.Tokens.List;
import {HeadingTokenStrategy} from "./HeadingTokenStrategy";
import {ParagraphTokenStrategy} from "./ParagraphTokenStrategy";
import {CodeTokenStrategy} from "./CodeTokenStrategy";
import {SpaceTokenStrategy} from "./SpaceTokenStrategy";
import {NotionTask, TodoTokenStrategy} from "./TodoTokenStrategy";



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
                let task: NotionTask | undefined;
                if(t.task) {
                    task = { isTask: t.task, isTaskComplete: t.checked ?? false };
                }
                this.addListItemToNode(node, t, task);
            }
        });
    }

    private addListItemToNode(node: TanaIntermediateNode, token: ListItem, task?: NotionTask): void {

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
                    // A notion _todo is actually a list-item with the task state, however we
                    // process a list-item's child nodes and not the actual node itself.  therefore,
                    // we're receiving the task state from the parent list-item
                    if(task) {
                        newNode = new TodoTokenStrategy(t, task).convert().firstNode();
                        break;
                    }
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
                case "space": {
                    newNode = new SpaceTokenStrategy(t).convert().firstNode();
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