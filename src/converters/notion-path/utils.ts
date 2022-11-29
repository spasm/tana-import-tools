import {NodeType, TanaIntermediateAttribute, TanaIntermediateNode, TanaIntermediateSupertag} from "../../types/types";
import {idgenerator} from "../../utils/utils";
import path from "path";
import {logging} from "./logging";

const _logger = logging.getLogger('Utils');

export function createEmptyNode(): TanaIntermediateNode {
    return createNode("");
}

export function createNode(name: string): TanaIntermediateNode {
    return createNodeOfType('node', name);
}

export function createTodo(name: string, isChecked: boolean): TanaIntermediateNode {
    const node = createNode(name);
    node.todoState = isChecked ? 'done' : 'todo';
    return node;
}

export function createCodeBlock(name: string, lang?: string): TanaIntermediateNode {
    const node = createNodeOfType('codeblock', name);
    node.codeLanguage = lang ?? 'unknown';
    return node;
}

export function createField(name: string): TanaIntermediateNode {
    return createNodeOfType('field', name);
}

export function createImageDescriptionField(name: string) : TanaIntermediateNode {
    const field = createField(`Image Description`);
    field.children?.push(createNode(name));
    return field;
}

export function createNodeOfType(type: NodeType, name: string): TanaIntermediateNode {
    return {
        name: name,
        createdAt: new Date().getTime(),
        editedAt: new Date().getTime(),
        type: type,
        uid: idgenerator(),
        children: [],
        refs: [],
        supertags: []
    };
}

export function createAttribute(name: string): TanaIntermediateAttribute {
    return {
        name: name,
        values: [],
        count: 1
    }
}

export function createSupertag(name: string): TanaIntermediateSupertag {
    return {
        name: name,
        uid: idgenerator()
    };
}

/*
    What we've seen here is images are usually exported into a directory
    of the same name as the page they're in.  However, in the event the
    image doesn't have a name, so it's exported as 'jpg' or '.jpg', then
    it may be placed at the root and not have a parent directory structure.
    In this event, there won't be any '/' to split on, as the image name will
    most likely match the same name as the directory, or associated MD file.
 */
export function generateIdFromInternalImage(name: string): string {
    const splitPath = name.split(path.sep);
    const notionIdLength = 32;

    if(splitPath.length === 1) {
        return splitPath[0];
    } else if(splitPath.length > 1) {
        const imageName = splitPath[splitPath.length - 1];
        const parentName = splitPath[splitPath.length - 2];

        if(parentName.length > notionIdLength) {
            const id = parentName.substring(parentName.length - notionIdLength, parentName.length).trim();
            return `${id}-${imageName}`;
        }
        return `${parentName}-${imageName}`;
    } else {
        _logger.error(`Unable to generate image ID for ${name}`);
        return name;
    }
}