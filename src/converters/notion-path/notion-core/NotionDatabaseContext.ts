import {ExportItemType, NotionExportItem} from "./NotionExportItem";
import {parse} from "csv-parse/sync";
import fs from "fs";
import crypto from "crypto";
import {debugPrint} from "../utils";

export type NotionDbRecords = Array<Array<string>>;

export class NotionDatabaseContext {

    private _item: NotionExportItem;
    private _headerRow = new Array<string>;
    private _db = new Array<Array<string>>()
    private _dbSignature: string = "";

    get headerRow(): Array<string> {
        return this._headerRow;
    }

    get data(): Array<Array<string>> {
        return this._db;
    }

    get signature(): string {
        return this._dbSignature;
    }

    constructor(item: NotionExportItem) {
        if(item.itemType !== ExportItemType.CSV){
            throw new Error("Must be a CSV");
        }
        this._item = item;
        this.loadBuffer();
        this.generateSignature();
        console.log(`DB: ${this._item.name}, Hash: ${this._dbSignature}`);
    }

    private loadBuffer(): void {
        let pass = 0;
        const file =fs.readFileSync(this._item.fullPath, 'utf-8');
        const records = parse(file, {columns:false});
        records.forEach((record: Array<string>) => {
            pass++;
            if(pass === 1) {
                const trimmed = record.map(f => f.trim());
                this._headerRow.push(...trimmed);
                return;
            }
            this._db.push(record);
        });
    }

    public getRowsByCellText(text: string): Array<Array<string>> {

        const resultingRows = new Array<Array<string>>();
        this._db.forEach(row => {
           row.forEach(field => {
               if(field.length > 0 && field === text){
                   resultingRows.push(row);
               }
           })
        });

        return resultingRows;
    }

    /*
        Generates a generic signature based on the contents of the database.  This gives us a
        loose idea if the Notion CSV file is a clone of an existing database that is elsewhere
        in the workspace.
     */
    private generateSignature() {
        const sortedHeaders = this.headerRow.sort();
        const headerCount = sortedHeaders.length;
        const headerBytes = sortedHeaders.join('|').length;
        const rowCount = this.data.length;
        let rowSig = 0;

        // get the 1st, 2nd, 3rd columns in sorted headers, which column is that in the regular headers?
        // this is the index that we'll use to compare
        [0,1,2].forEach(i => {
            let index = 0;
            const header = sortedHeaders.at(i);

            if(header) {
                index = this.headerRow.indexOf(header);
                this.data.forEach(r => {
                    rowSig += r.at(index)?.length ?? 0;
                });
            }
        });

        // TODO: maybe log out if rowSig is 0 here?

        // TODO: another edge case of this method is if columns 1,2,3 have a relation column to another page
        // TODO:    and that other page is elsewhere in the workspace, causing the relative link to be different
        // TODO:    a potential fix is to just look at those values, and if they appear to be .md references, don't use them

        const preHash = `${sortedHeaders}:${headerCount}:${headerBytes}:${rowCount}:${rowSig}`;
        console.log(`Prehash: ${preHash}`);

        const hash = crypto.createHash('md5');
        hash.update(preHash);
        this._dbSignature = hash.digest('hex');
    }
}