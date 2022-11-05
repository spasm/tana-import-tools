import {ExportItemType, NotionExportItem} from "./NotionExportItem";
import {parse} from "csv-parse/sync";
import fs from "fs";
import {debugPrint} from "./utils";

export class NotionDatabaseContext {

    private _item: NotionExportItem;
    private _headerRow = new Array<string>;
    private _db = new Array<Array<string>>()

    get headerRow(): Array<string> {
        return this._headerRow;
    }

    get data(): Array<Array<string>> {
        return this._db;
    }

    constructor(item: NotionExportItem) {
        if(item.itemType !== ExportItemType.CSV){
            throw new Error("Must be a CSV");
        }
        this._item = item;
        this.loadBuffer();
        console.log('after loadbuffer -> ' + JSON.stringify(this._headerRow));
    }

    private loadBuffer(): void {
        console.log('loadbuffer');
        let pass = 0;
        const file =fs.readFileSync(this._item.fullPath, 'utf-8');
        const records = parse(file, {columns:false});
        records.forEach((record: Array<string>) => {
            pass++;
            if(pass === 1) {
                this._headerRow.push(...record);
                return;
            }
            this._db.push(record);
            console.log(record);
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
}