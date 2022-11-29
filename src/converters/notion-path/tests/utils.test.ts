import { expect, test } from '@jest/globals';
import {generateIdFromInternalImage} from "../utils";

const imageName = 'image.png';
const uuid = '10d9f9a1f48446b1b529414e0875a94b';
const parentFolder = `Export-${uuid}`;

test('Generate image ID from Full Mac Path', () => {

    const path = `/Users/user_name/${parentFolder}/${imageName}`;
    expect(generateIdFromInternalImage(path)).toEqual(`${uuid}-${imageName}`);

});

test('Generate image ID from Partial Mac Path', () => {
   const path = `../${parentFolder}/${imageName}`;
   expect(generateIdFromInternalImage(path)).toEqual(`${uuid}-${imageName}`);
});

test('Generate image ID from Image Name Only', () => {
   const path = `${parentFolder}-${uuid}.jpg`;
   expect(generateIdFromInternalImage(path)).toEqual(`${path}`);
});

test('Generate image ID, error, return nothing', () => {
    const path = ``;
    expect(generateIdFromInternalImage(path)).toEqual(``);
})

test('Generate image ID, parent folder < 32', () => {
    const parent = `ParentFolder`;
    const path = `${parent}-${imageName}`;
    expect(generateIdFromInternalImage(path)).toEqual(`${path}`);
});