import {BaseTokenStrategy} from "./BaseTokenStrategy";
import {marked} from "marked";
import Text = marked.Tokens.Text;
import Token = marked.Token;
import {ConvertedNodeResponse} from "./ConvertedNodeResponse";
import {createTodo} from "../utils";

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
        // TODO: merge up how we're handling this sequence with what's in the Text & Para strategy
        token?.tokens?.forEach((t: Token) => {
            switch (t.type) {
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
                    text += `\`${t.text}\``;
                    return;
                case 'link':
                    text += `${t.raw}`;
                    return;
                default:
                    text += `${t.raw}`;
                    return;
            }
        });

        return new ConvertedNodeResponse(createTodo(text, this._taskInfo.isTaskComplete));
    }
}