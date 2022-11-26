import {marked} from "marked";
import Token = marked.Token;

export const compose = (t: Token): string => {

    switch (t.type) {
        case 'text':
            return t.text;
        case 'em':
            return `__${t.text}__`;
        case 'strong':
            return `**${t.text}**`;
        case 'codespan':
            return `\`${t.text}\``;
        case 'link':
            return`${t.raw}`;
        default:
            return `${t.raw}`;
    }
}