import {TanaIntermediateNode} from "../../types/types";
import {debugPrint} from "./utils";

export class ConverterContext {

    get previousHeadingLevel(): number {
        return this._previousHeadingLevel;
    }

    get currentHeadingLevel(): number {
        return this._currentHeadingLevel;
    }

    set currentHeadingLevel(value: number) {
        this._previousHeadingLevel = this._currentHeadingLevel;
        this._currentHeadingLevel = value;
    }

    set rootNode(value: TanaIntermediateNode | undefined) {
        if (this._rootNode) {
            throw new Error("Root node cannot be reset.");
        }

        if (!value) {
            throw new Error("No root node was passed.");
        }

        debugPrint("assigning root node: " + JSON.stringify(value));
        this._rootNode = value;
        this.currentNode = this._rootNode;
        this.nodeMap.set(this.currentNodeLevel, this._rootNode);
    }

    get rootNode(): TanaIntermediateNode | undefined {
        return this._rootNode;
    }

    private _currentHeadingLevel = 0;
    private _previousHeadingLevel = 0;

    public currentNode: TanaIntermediateNode | undefined;
    public currentNodeLevel = 0;
    public nodeMap = new Map<number, TanaIntermediateNode>();

    private _passCount = 0;
    private _rootNode: TanaIntermediateNode | undefined;

    public incrementPassCount(): void {
        this._passCount++;
    }

    public isFirstPass(): boolean {
        debugPrint("pass count: " + this._passCount);
        return this._passCount === 1;
    }
}