import {TanaIntermediateAttribute, TanaIntermediateNode, TanaIntermediateSummary} from "../../../types/types";
import {marked} from "marked";
import {createAttribute, createEmptyNode, createField, createNode} from "../utils";
import {MarkdownTokenConverter} from "./MarkdownTokenConverter";
import {ConvertedNodeResponse} from "./ConvertedNodeResponse";
import {ConverterContext} from "./ConverterContext";
import Heading = marked.Tokens.Heading;
import {NotionMarkdownItem} from "../notion-core/NotionMarkdownItem";
import {logging} from "../logging";

export class NotionMarkdownConverter{
    private _logger = logging.getLogger(this.constructor.name);
    private _context = new ConverterContext();
    private _summary: TanaIntermediateSummary = {
        leafNodes: 0,
        topLevelNodes: 0,
        totalNodes: 0,
        calendarNodes: 0,
        fields: 0,
        brokenRefs: 0
    };
    private _attributes= new Array<TanaIntermediateAttribute>();
    private _item: NotionMarkdownItem;
    
    constructor(item: NotionMarkdownItem){
        if(!item){ throw new Error("Must pass a NotionMarkdownItem"); }
        this._item = item;
    }

    public convert() : [tanaNode: TanaIntermediateNode,
        tanaSummary: TanaIntermediateSummary,
        attributes: Array<TanaIntermediateAttribute>] | undefined {

        const tokens = marked.lexer(this._item.body);
        this._logger.debug(`Markdown Tokens for ${this._item.name}: ${JSON.stringify(tokens, null, 2)}`);

        this._context.rootNode = createNode(this._item.title);
        this.attachPageFields();

        tokens.forEach( token => {

            this._context.incrementPassCount();
            let convertedNode: ConvertedNodeResponse | undefined;

            try {
                convertedNode = new MarkdownTokenConverter(token).getConverter()?.convert();
            }
            catch (e) {
                this._logger.error(`Error while processing: ${this._item.name}, id: ${this._item.id}, md: ${token.raw}`);
                this._logger.error(`Error: ${(e as Error).stack}`)
            }

            let targetNode = this._context.currentNode;

            if(!convertedNode) {
                this._logger.error(`No ConvertedNodeRespose for: ${this._item.name}, id: ${this._item.id}`);
                return;
            }

            // skip spaces
            if(convertedNode.token?.type === 'space') { return; }

            // headings have special rules since they drive structure
            if(convertedNode.token?.type === 'heading') {
                this.attachHeading(convertedNode);
                this._context.previousNode = convertedNode?.lastNode();
                this._context.previousTokenType = convertedNode?.token?.type;
                return;
            }

            // a new list, or codeblock, and we'll nest it under the previous node
            // sometimes this is the right thing to do, sometimes not
            if((convertedNode.token?.type === 'list' || convertedNode.token?.type === 'code') &&
                this._context.previousTokenType === 'paragraph' || this._context.previousTokenType === 'heading') {
                targetNode = this._context.previousNode;
            }

            // everything else, generic attachment
            if(targetNode){
                this.attach(convertedNode, targetNode);
            }

            this._context.previousNode = convertedNode?.lastNode();
            this._context.previousTokenType = convertedNode?.token?.type;
        });

        return [this._context.rootNode!, this._summary, this._attributes];
    }

    private attachPageFields(): void {
        this._item.fields.forEach(field => {
            const tanaField = createField(field.name);
            const tanaAttr = createAttribute(field.name);

            this._context.rootNode?.children?.push(tanaField);
            tanaField.children?.push(createNode(field.body));

            this._attributes.push(tanaAttr);
        })
    }

    private attach(source: ConvertedNodeResponse, dest: TanaIntermediateNode): void {
        source.tanaNodes.forEach(n => {
            dest.children?.push(n);
        });
    }

    private attachHeading(source: ConvertedNodeResponse): void {

        if(source.token?.type !== 'heading'){
            return;
        }

        const context = this._context;
        const token = source.token as Heading
        const node = source.firstNode();

        if(!node){
            return;
        }

        context.currentHeadingLevel = token.depth;

        // we have a header, and it's not the first pass
        const headingParentLevel = context.currentHeadingLevel - 1; // a header should be a child of a previous heading level
        if(context.currentHeadingLevel < context.previousHeadingLevel){
            for (let i = context.previousHeadingLevel; i > context.currentHeadingLevel; i--){
                context.nodeMap.delete(i);
            }
        }

        if(context.nodeMap.has(headingParentLevel)){
            context.nodeMap.get(headingParentLevel)?.children?.push(node);
            context.currentNode = node;
            context.nodeMap.set(context.currentHeadingLevel, node);
        } else {
            //const emptyNode = createEmptyNode(); // experimenting with > vs empty
            const emptyNode = createNode(">");
            if(context.nodeMap.has(headingParentLevel - 1)){
                context.nodeMap.get(headingParentLevel - 1)?.children?.push(emptyNode);
            } else {
                if(context.nodeMap.has(headingParentLevel - 2)){
                    const topNode = context.nodeMap.get(headingParentLevel - 2);
                    //const parentEmptyNode = createEmptyNode(); // experimenting with > instead of empty
                    const parentEmptyNode = createNode(">");
                    topNode?.children?.push(parentEmptyNode);
                    context.nodeMap.set(headingParentLevel - 1, parentEmptyNode);
                    parentEmptyNode.children?.push(emptyNode);
                }
            }
            context.nodeMap.set(headingParentLevel, emptyNode);
            emptyNode.children?.push(node);
            context.currentNode = node;
            context.nodeMap.set(context.currentHeadingLevel, node);
        }
    }
}