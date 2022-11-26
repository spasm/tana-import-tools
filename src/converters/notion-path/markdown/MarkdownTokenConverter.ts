import {marked} from "marked";
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
import {logging} from "../logging";
import {HtmlTokenStrategy} from "./HtmlTokenStrategy";


export class MarkdownTokenConverter {

    private _logger = logging.getLogger(this.constructor.name);
    private _converterStrategy: ITokenStrategy | undefined;
    private readonly _token: Token;

    constructor(token: Token){
        this._token = token;
    }

    public getConverter(): ITokenStrategy | undefined {

        if(!this._token){
            return;
        }

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
            case 'html': {
                this._converterStrategy = new HtmlTokenStrategy(this._token);
                break;
            }
            default: {
                this._logger.error(`Unknown Type in MarkdownTokenConverter: ${this._token.type}, with content: ${this._token.raw}`);
                // TODO: what do we want to do in this instance?
                // Potentially put into the Audit node?
            }
        }
        return this._converterStrategy;
    }
}