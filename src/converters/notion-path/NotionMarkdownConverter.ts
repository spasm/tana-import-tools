import {TanaIntermediateNode, TanaIntermediateSummary} from "../../types/types";
import {marked} from "marked";
import {idgenerator} from "../../utils/utils";
import Heading = marked.Tokens.Heading;
import Paragraph = marked.Tokens.Paragraph;
import Blockquote = marked.Tokens.Blockquote;
import ListItem = marked.Tokens.ListItem;
import List = marked.Tokens.List;
import Code = marked.Tokens.Code;
import TokensList = marked.TokensList;
import Token = marked.Token;
import Text = marked.Tokens.Text;
import {createEmptyNode, debugPrint, debugPrintIf} from "./utils";
import Table = marked.Tokens.Table;

type ConvertedNodeResponse = {
    tanaNodes: TanaIntermediateNode[]
};

export class NotionMarkdownConverter{

    private summary: TanaIntermediateSummary = {
        leafNodes: 0,
        topLevelNodes: 0,
        totalNodes: 0,
        calendarNodes: 0,
        fields: 0,
        brokenRefs: 0
    };

    public convert(content: string | undefined) : [tanaNode: TanaIntermediateNode, tanaSummary: TanaIntermediateSummary] | undefined {
        if(!content){
            return;
        }
        const lexed = marked.lexer(content);
        const nodes = this.processMarkdownTokens(lexed);
        return [nodes, this.summary];
    }

    private processMarkdownTokens(list: TokensList | Token[] | undefined): TanaIntermediateNode
    {
        // in notion, the first line, first header will always be the "name" of the node
        // if the page belongs to a database with properties, there will be fiends starting at line 3
        //  structured like: Field: <value>
        let pass = 0;
        let rootNode: TanaIntermediateNode = {createdAt: 0, editedAt: 0, name: "", type: "node", uid: ""};
        const nodeMap = new Map<number, TanaIntermediateNode>();

        let currentNode: TanaIntermediateNode;
        let currentNodeLevel = 0;

        let currentHeadingLevel = 0;
        let previousHeadingLevel = 0;

        list?.forEach((token) => {
            pass++;

            switch(token.type){
                case 'space': {
                    // at this point we don't care about spaces, so
                    // we'll just skip them
                    return;
                }
                case 'table': {
                    const table = this.tableToNode(token);
                    this.attach(table, currentNode);
                    return;
                }
                case 'hr': {
                    return;
                }
                case 'heading': {
                    // process heading
                    previousHeadingLevel = currentHeadingLevel;
                    currentHeadingLevel = token.depth;

                    if (pass == 1) {
                        // our first pass through
                        // for Notion exports, this is always an h1
                        rootNode = this.headingToNode(token).tanaNodes[0];
                        //nodes.push(rootNode);
                        nodeMap.set(currentNodeLevel, rootNode);
                        currentNode = rootNode;
                        return;
                    }

                    const node = this.headingToNode(token).tanaNodes[0];
                    const headingParentLevel = currentHeadingLevel - 1; // a header should be a child of a previous heading level

                    if (currentHeadingLevel < previousHeadingLevel) {
                        //our indents have moved back inward, so we need to clear previous nodes
                        for (let i = previousHeadingLevel; i > currentHeadingLevel; i--) {
                            nodeMap.delete(i);
                        }
                    }

                    if (nodeMap.has(headingParentLevel)) {

                        nodeMap.get(headingParentLevel)?.children?.push(node);
                        currentNode = node;
                        nodeMap.set(currentHeadingLevel, node);
                    } else {
                        const emptyNode = createEmptyNode();

                        if (nodeMap.has(headingParentLevel - 1)) {
                            // attach our empty node to a parent
                            nodeMap.get(headingParentLevel - 1)?.children?.push(emptyNode);
                        } else {
                            if (nodeMap.has(headingParentLevel - 2)) {
                                const topNode = nodeMap.get(headingParentLevel - 2);
                                const parentEmptyNode = createEmptyNode();
                                topNode?.children?.push(parentEmptyNode);
                                nodeMap.set(headingParentLevel - 1, parentEmptyNode);
                                parentEmptyNode.children?.push(emptyNode);
                            }
                        }

                        nodeMap.set(headingParentLevel, emptyNode);
                        emptyNode.children?.push(node);
                        currentNode = node;
                        nodeMap.set(currentHeadingLevel, node);
                    }

                    // get node currentHeadingLevel - 1 -- this is our parent node the header belongs to
                    // add header node to previous retrieved node
                    // check map, does it already have this heading level node?
                    // if no, add it, current node == this node
                    // if yes, replace it, current node == this node

                    // everytime you go back indent, you need to reset the parent structure!!!

                    return;
                }
                case 'paragraph': {
                    // process top level paragraph
                    const para = this.paragraphToNode(token);
                    this.attach(para, currentNode);
                    nodeMap.set(currentHeadingLevel, para.tanaNodes[0]);
                    return;
                }
                case 'list': {
                    // process top level starting list
                    this.attach(this.listToNodes(token), currentNode);
                    return;
                }
                case 'blockquote': {
                    this.attach(this.blockQuoteToNode(token), currentNode);
                    return;
                }
                case 'code': {
                    // we're going to attach a code block as a child of the current level
                    const targetNode = nodeMap.get(currentHeadingLevel);
                    this.attach(this.codeToNode(token), targetNode!);
                    return;
                }
                default: {
                    // in the case where we don't know what kind of node, then just
                    // add to a default node and we'll add an attribute of how it was imported?
                    console.log(`==UNKNOWN TYPE: ${token.type}, with text: ${token.raw}==`)
                }
            }
        });

        return rootNode;
    }

    private attach(source: ConvertedNodeResponse, dest: TanaIntermediateNode): void {
        source.tanaNodes.forEach(n => {
            dest.children?.push(n);
        });
    }

    private tableToNode(token: Table): ConvertedNodeResponse {
        return {
            tanaNodes: [{
                name: token.raw,
                createdAt: 0,
                editedAt: 0,
                type: 'node',
                uid: idgenerator(),
                children: []
            }]
        };
    }

    private codeToNode(token: Code): ConvertedNodeResponse {
        return {
            tanaNodes: [{
                name: token.text,
                createdAt: 0,
                editedAt: 0,
                type: 'codeblock',
                uid: idgenerator(),
                children: []
            }]
        };
    }

    private listToNodes(token: List): ConvertedNodeResponse {

        const tempNode: TanaIntermediateNode = { createdAt: 0, editedAt: 0, name: "temp", type: "node", uid: "", children:[] };
        this.addListToNode(tempNode, token);

        const response: ConvertedNodeResponse = {tanaNodes: []};
        tempNode.children?.forEach(t => response.tanaNodes.push(t));
        return response;
    }

// Takes an existing tana node, and adds a list hierarchy to it
    private addListToNode(node: TanaIntermediateNode, token: List): void {

        token.items.forEach(t => {
            if(t.type == "list_item") {
                this.addListItemToNode(node, t);
            }
        });
    }

    private addListItemToNode(node: TanaIntermediateNode, token: ListItem): void {
        let currentNode: TanaIntermediateNode;

        token.tokens.forEach(t => {
            switch(t.type){
                case "list":
                    // if it's a list, it's the start of a new list
                    this.addListToNode(currentNode, t);
                    return;
                case "text":
                    currentNode = this.textToNode((t as Text)).tanaNodes[0];
                    node.children?.push(currentNode);
                    return;
                // if text, we can start parsing it out to create the node with
                case "blockquote":
                    currentNode = this.blockQuoteToNode(t).tanaNodes[0];
                    node.children?.push(currentNode);
                    return;
                default:
                    return;
            }
        });
    }

    private blockQuoteToNode(token: Blockquote): ConvertedNodeResponse {
        return {
            tanaNodes: [{
                name: token.raw,
                createdAt: 0,
                editedAt: 0,
                type: 'node',
                uid: idgenerator(),
                children: []
            }]
        };
    }

    private textToNode(token: Text): ConvertedNodeResponse {
        let text = "";

        token?.tokens?.forEach((t: Token) => {
            switch(t.type){
                case 'text':
                    text += t.text;
                    return;
                case 'em':
                    text += `__${t.text}__`;
                    return;
                case 'strong':
                    text += `**${t.text}**`;
                    return;
                case 'codespan':
                    text += `^^${t.text}^^`;
                    return;
                case 'link':
                    text += `${t.raw}`;
                    return;
                default:
                    text += `${t.raw}`;
                    return;
            }
        });

        return {
            tanaNodes: [{
                name: text,
                type: 'node',
                uid: idgenerator(),
                createdAt: 0,
                editedAt: 0,
                children: []
            }]
        };
    }

    private paragraphToNode(token: Paragraph): ConvertedNodeResponse {
        let para = "";

        token?.tokens.forEach(t => {
            switch(t.type){
                case 'text':
                    para += t.text;
                    return;
                case 'em':
                    para += `__${t.text}__`;
                    return;
                case 'strong':
                    para += `**${t.text}**`;
                    return;
                case 'codespan':
                    para += `^^${t.text}^^`;
                    return;
                case 'link':
                    para += `${t.raw}`;
                    return;
                default:
                    para += `${t.raw}`;
                    return;
            }
        });

        return {
            tanaNodes: [{
                name: para,
                type: 'node',
                uid: idgenerator(),
                createdAt: 0,
                editedAt: 0,
                children: []
            }]
        };
    }

    private headingToNode(token: Heading): ConvertedNodeResponse {

        return {
            tanaNodes:[{
                name: `**${token.text}**`,
                type: 'node',
                uid: idgenerator(),
                createdAt: 0,
                editedAt: 0,
                children: []
            }]
        };

    }

}