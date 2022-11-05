import {TanaIntermediateAttribute, TanaIntermediateNode} from "../../types/types";
import {idgenerator} from "../../utils/utils";
import {marked} from "marked";
import Token = marked.Token;

export function createEmptyNode(): TanaIntermediateNode {
    return createNode("");
}

export function createNode(name: string): TanaIntermediateNode {
    return {
        name: name,
        createdAt: 0,
        editedAt: 0,
        type: 'node',
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

export function createField(name: string): TanaIntermediateNode {
    return {
        name: name,
        createdAt: 0,
        editedAt: 0,
        type: 'field',
        uid: idgenerator(),
        children: [],
        refs: []
    };
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