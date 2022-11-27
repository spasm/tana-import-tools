import { expect, test } from '@jest/globals';
import {BlockQuoteTokenStrategy} from "../markdown/BlockQuoteTokenStrategy";
import {genTokens} from "./helper";

test('Convert BlockQuote token to Node', () => {

    const md = `> This is a block quote`;
    const token = genTokens(`${md}`).at(0)!;
    const converted = new BlockQuoteTokenStrategy(token).convert();
    const node = converted.firstNode()!;

    expect(node.type).toEqual('node');
    expect(node.uid).not.toEqual('');
    expect(node.name).toContain(md);
    expect(converted.tanaNodes.length).toEqual(1);
});