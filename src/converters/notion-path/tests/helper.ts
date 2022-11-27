import {marked} from "marked";
import Token = marked.Token;
import TokensList = marked.TokensList;
import fs from "fs";
import path from "path";

const fixturePath = './fixtures'

export const genToken = (md: string): Token => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return marked.lexer(md).at(0)!;
}

export const genTokens = (md: string): TokensList => {
    return marked.lexer(md);
}

export const getFixture = (file: string): string => {
    return fs.readFileSync(path.resolve(__dirname, `${fixturePath}/${file}`), 'utf-8');
};

export const log = (what: any): void => {
    console.log(JSON.stringify(what, null, 2));
}