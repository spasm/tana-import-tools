import { expect, test } from '@jest/globals';
import {genTokens, getFixture, log} from "./helper";
import {ListTokenStrategy} from "../markdown/ListTokenStrategy";

test('Convert Standard MD List to Nodes', () => {

    const md = getFixture('standard_md_list.md');
    /*
    - First
        - Second
            - Third
        - Fourth
    - Fifth
     */
    const tokens = genTokens(md).at(0)!;
    const nodes = new ListTokenStrategy(tokens).convert().tanaNodes;

    const first = nodes[0]!;
    const second = first.children![0]!;
    const third = second.children![0]!;
    const fourth = first.children![1]!;
    const fifth = nodes[1]!;

    expect(nodes.length).toEqual(2);
    expect(first.name).toEqual('First');
    expect(second.name).toEqual('Second');
    expect(third.name).toEqual('Third');
    expect(fourth.name).toEqual('Fourth');
    expect(fifth.name).toEqual('Fifth');

});

