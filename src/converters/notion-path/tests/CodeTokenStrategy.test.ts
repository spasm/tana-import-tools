import { expect, test } from '@jest/globals';
import {genTokens} from "./helper";
import {CodeTokenStrategy} from "../markdown/CodeTokenStrategy";

test('Convert Code token to Node', () => {
    const md = `\
\`\`\`csharp 
    public main() { 
        Sup(); 
    } 
\`\`\``;

    const token = genTokens(`${md}`).at(0)!;
    const converted = new CodeTokenStrategy(token).convert();
    const node = converted.firstNode()!;

    expect(node.type).toEqual('codeblock');
    expect(node.uid).not.toEqual('');
    expect(node.name).not.toEqual('');
    expect(node.codeLanguage).toEqual('csharp');
});