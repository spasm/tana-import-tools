import {NodeType, TanaIntermediateAttribute, TanaIntermediateNode} from "../../types/types";
import {idgenerator} from "../../utils/utils";
import {marked} from "marked";
import Token = marked.Token;

export function createEmptyNode(): TanaIntermediateNode {
    return createNode("");
}

export function createNode(name: string): TanaIntermediateNode {
    return createNodeOfType('node', name);
}

export function createCodeBlock(name: string): TanaIntermediateNode {
    return createNodeOfType('codeblock', name);
}

export function createField(name: string): TanaIntermediateNode {
    return createNodeOfType('field', name);
}

export function createNodeOfType(type: NodeType, name: string): TanaIntermediateNode {
    return {
        name: name,
        createdAt: new Date().getTime(),
        editedAt: new Date().getTime(),
        type: type,
        uid: idgenerator(),
        children: [],
        refs: []
    };
}

export function createAttribute(name: string): TanaIntermediateAttribute {
    return {
        name: name,
        values: [],
        count: 1
    }
}



export function debugPrint(what: any): void {
    console.log("====== DEBUG ======");
    console.log(what);
    console.log("====== DEBUG ======")
}

export function debugPrintIf(token: Token, phrase: string): void {
    const raw = token.raw;
    if(raw.toLowerCase().indexOf(phrase.toLowerCase()) > 0){
        console.log("====== DEBUG ======");
        console.log(token);
        console.log("====== DEBUG ======")
    }
}