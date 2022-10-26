import { exit } from 'process';
import * as fs from 'fs';

import { RoamConverter } from './converters/roam/index';
import { TanaIntermediateFile } from './types/types';
import { WorkflowyConverter } from './converters/workflowy';
import {NotionPathConverter} from "./converters/notion-path";

const importType = process.argv[2];
const source = process.argv[3];

if (!importType) {
  console.log('No file type provided');
  exit(0);
}

if (!source) {
  console.log('No file provided');
  exit(0);
}
const directoryImportTypes = ['notion-path'];
const supportedImportTypes = ['roam', 'workflowy', ...directoryImportTypes];
const isDirectoryType = (t: string) => directoryImportTypes.includes(t);

if (!supportedImportTypes.includes(importType)) {
  console.log(`Import type: ${importType} is not supported`);
  exit(0);
}

let contents = "", fullPath = "";

if(isDirectoryType(importType)){

  console.log(`\n\nProcessing directory: ${source} for import as: ${importType}`);
  fullPath = source;

}
else {

  console.log(`\n\nReading file: ${source} for import as: ${importType}`);

  contents = fs.readFileSync(source, 'utf8');
  console.log('File length:', contents.length);

}

function saveFile(fileName: string, tanaIntermediteNodes: TanaIntermediateFile) {
  const targetFileName = `${fileName}.tif.json`;
  fs.writeFileSync(targetFileName, JSON.stringify(tanaIntermediteNodes, null, 2));
  console.log(`Tana Intermediate Nodes written to : ${targetFileName}`);
}

let tanaIntermediteFile = undefined;
switch (importType) {
  case 'roam':
    tanaIntermediteFile = new RoamConverter().convert(contents);
    break;
  case 'workflowy':
    tanaIntermediteFile = new WorkflowyConverter().convert(contents);
    break;
  case 'notion-path':
    tanaIntermediteFile = new NotionPathConverter().convertPath(fullPath);
    break;
  default:
    console.log(`File type ${importType} is not supported`);
    exit(0);
}

if (!tanaIntermediteFile) {
  console.log('No nodes found');
  exit(0);
}

console.dir(tanaIntermediteFile.summary);

saveFile(source, tanaIntermediteFile);
