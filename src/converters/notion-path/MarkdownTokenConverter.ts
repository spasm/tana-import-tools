import {marked} from "marked";
import {debugPrint} from "./utils";
import {ITokenStrategy} from "./BaseTokenStrategy";
import {SpaceTokenStrategy} from "./SpaceTokenStrategy";
import {HeadingTokenStrategy} from "./HeadingTokenStrategy";
import {ParagraphTokenStrategy} from "./ParagraphTokenStrategy";
import {BlockQuoteTokenStrategy} from "./BlockQuoteTokenStrategy";
import {ListTokenStrategy} from "./ListTokenStrategy";
import {CodeTokenStrategy} from "./CodeTokenStrategy";
import {TableTokenStrategy} from "./TableTokenStrategy";
import {HrTokenStrategy} from "./HrTokenStrategy";
import Token = marked.Token;


export class MarkdownTokenConverter {

    private _converterStrategy: ITokenStrategy | undefined;
    private readonly _token: Token;

    constructor(token: Token){
        this._token = token;
    }

    public getConverter(): ITokenStrategy | undefined {

        if(!this._token){
            return;
        }

        debugPrint(`Choosing strategy for: ${this._token?.type}`);
        switch(this._token.type){
            case 'space':{
                this._converterStrategy = new SpaceTokenStrategy(this._token);
                break;
            }
            case 'table': {
                this._converterStrategy = new TableTokenStrategy(this._token);
                break;
            }
            case 'hr': {
                this._converterStrategy = new HrTokenStrategy(this._token);
                break;
            }
            case 'heading': {
                this._converterStrategy = new HeadingTokenStrategy(this._token);
                break;
            }
            case 'paragraph': {
                this._converterStrategy = new ParagraphTokenStrategy(this._token);
                break;
            }
            case 'list': {
                this._converterStrategy = new ListTokenStrategy(this._token);
                break;
            }
            case 'blockquote': {
                this._converterStrategy = new BlockQuoteTokenStrategy(this._token);
                break;
            }
            case 'code': {
                this._converterStrategy = new CodeTokenStrategy(this._token);
                break;
            }
            default: {
                debugPrint(`UNKNOWN TYPE: ${this._token.type}, with content: ${this._token.raw}`)
                // TODO: what do we want to do in this instance?
                // Potentially put into the Audit node?
            }
        }
        return this._converterStrategy;
    }
}