import {TanaIntermediateNode} from "../../../types/types";

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

        this._rootNode = value;
        this.currentNode = this._rootNode;
        this.nodeMap.set(this.currentNodeLevel, this._rootNode);
    }

    get rootNode(): TanaIntermediateNode | undefined {
        return this._rootNode;
    }

    private _currentHeadingLevel = 0;
    private _previousHeadingLevel = 0;

    private _currentNode: TanaIntermediateNode | undefined;
    public set currentNode(value: TanaIntermediateNode | undefined) {
        this._currentNode = value;
    }
    public get currentNode():TanaIntermediateNode | undefined {
        return this._currentNode;
    }

    public previousNode: TanaIntermediateNode | undefined;
    public previousTokenType: string | undefined = "";

    public currentNodeLevel = 0;
    public nodeMap = new Map<number, TanaIntermediateNode>();

    private _passCount = 0;
    private _rootNode: TanaIntermediateNode | undefined;

    public incrementPassCount(): void {
        this._passCount++;
    }

    public isFirstPass(): boolean {
        return this._passCount === 1;
    }

    public isSecondPass(): boolean {
        return this._passCount === 2;
    }
}