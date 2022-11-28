import { expect, test } from '@jest/globals';
import {generateIdFromInternalImage} from "../utils";

const imageName = 'image.png';
const uuid = '10d9f9a1f48446b1b529414e0875a94b';
const parentFolder = `Export-${uuid}`;

test('Generate ID from Full Mac Path', () => {

    const path = `/Users/user_name/${parentFolder}/${imageName}`;
    expect(generateIdFromInternalImage(path)).toEqual(`${uuid}-${imageName}`);

});

test('Generate ID from Partial Mac Path', () => {
   const path = `../${parentFolder}/${imageName}`;
   expect(generateIdFromInternalImage(path)).toEqual(`${uuid}-${imageName}`);
});

test('Generate ID from Image Name Only', () => {
   const path = `${parentFolder}-${uuid}.jpg`;
   expect(generateIdFromInternalImage(path)).toEqual(`${path}`);
});

test('GenerateId, error, return nothing', () => {
    const path = ``;
    expect(generateIdFromInternalImage(path)).toEqual(``);
})