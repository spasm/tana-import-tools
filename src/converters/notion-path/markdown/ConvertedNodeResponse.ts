import {TanaIntermediateNode} from "../../../types/types";
import {marked} from "marked";
import Token = marked.Token;

export class ConvertedNodeResponse {

    private _tanaNodes: Array<TanaIntermediateNode> = [];

    get tanaNodes(): Array<TanaIntermediateNode> {
        return this._tanaNodes;
    }

    constructor(node?: TanaIntermediateNode, public token?: Token) {
        if (node) {
            this._tanaNodes.push(node);
        }
    }

    public addTanaNodes(nodes: TanaIntermediateNode[]): void {
        if (nodes?.length > 0) {
            this._tanaNodes.push(...nodes);
        }
    }

    public isEmpty(): boolean {
        return this._tanaNodes.length === 0;
    }

    public firstNode(): TanaIntermediateNode | undefined {
        return this._tanaNodes?.at(0);
    }

    public lastNode(): TanaIntermediateNode | undefined {
        return this._tanaNodes?.at(this._tanaNodes.length - 1);
    }

    public isHeading(): boolean {
        return this.token?.type === 'heading';
    }

}