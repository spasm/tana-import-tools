import {BaseTokenStrategy} from "./BaseTokenStrategy";
import {marked} from "marked";
import Text = marked.Tokens.Text;
import Token = marked.Token;
import {ConvertedNodeResponse} from "./ConvertedNodeResponse";
import {createTodo} from "../utils";
import {compose} from "./TextComposer";

export type NotionTask = {
    isTask: boolean,
    isTaskComplete: boolean
};

export class TodoTokenStrategy extends BaseTokenStrategy {
    private _taskInfo: NotionTask;

    constructor(token: Token, task: NotionTask) {
        super(token);
        this._taskInfo = task;
    }

    convert(): ConvertedNodeResponse {
        let text = "";
        const token = this._token as Text;
        
        token?.tokens?.forEach((t: Token) => {
            text += compose(t);
        });

        return new ConvertedNodeResponse(createTodo(text, this._taskInfo.isTaskComplete));
    }
}