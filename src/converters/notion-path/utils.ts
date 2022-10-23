import {TanaIntermediateNode} from "../../types/types";
import {idgenerator} from "../../utils/utils";

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
        children: []
    }
}