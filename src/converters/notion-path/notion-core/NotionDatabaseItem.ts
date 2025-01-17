import { ExportItemType } from "./NotionExportItem";
import { NotionExportItem } from "./NotionExportItem";
import {parse} from "csv-parse/sync";
import crypto from "crypto";
import {RegExRegistry} from "../RegExRegistry";
import {logging} from "../logging";

export type NotionDbRecords = Array<Array<string>>;

export class NotionDatabaseItem extends NotionExportItem {
    private _logger = logging.getLogger(this.constructor.name);
    private _headerRow = new Array<string>;
    private _db = new Array<Array<string>>()
    private _dbSignature = "";
    private _keepCached = false;
    private _bufferLoaded = false;

    get headerRow(): Array<string> {
        return this._headerRow;
    }

    get data(): Array<Array<string>> {
        return this._db;
    }

    get signature(): string {
        return this._dbSignature;
    }

    constructor(item: NotionExportItem, keepCached = true) {
        super(item.fullPath);

        if(item.itemType !== ExportItemType.CSV){
            throw new Error("Must be a CSV");
        }

        this._keepCached = keepCached;

        this.loadBuffer();
        this.generateSignature();

        // If we don't need to keep the buffer in memory, purge it
        if(!this._keepCached) {
            this._logger.debug(`Clearing DB after load: ${this.name}`);
            this._db = [];
        }
    }

    private loadBuffer(): void {
        let pass = 0;
        const file = this.getContents() || '';
        const records = parse(file, { columns: false, bom: true });
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
        const sortedHeaders = [...this.headerRow].sort();
        const dbName = this.name;
        const headerCount = sortedHeaders.length;
        const headerBytes = sortedHeaders.join('|').length;
        const rowCount = this.data.length;
        let rowSig = 0;

        const regex = new RegExRegistry();

        // get the 1st, 2nd, 3rd columns in sorted headers, which column is that in the regular headers?
        // this is the index that we'll use to compare
        [0,1,2].forEach(i => {
            let index = 0;
            let tempRowSig = 0;
            let columnDirty = false;

            const header = sortedHeaders.at(i);

            if(header) {
                index = this.headerRow.indexOf(header);
                this.data.forEach(r => {
                    // if we've marked the column as dirty, that means we don't want
                    // to consider any part of the rows in our signature.  exit early
                    // TODO: rewrite this section so that we don't continue to loop through
                    if(columnDirty) { return; }

                    const row = r.at(index);
                    // only count the row if there are no references to other files.
                    // if these are relative paths, then it will skew our signature
                    if (row?.match(regex.internalExtensions)) {
                        columnDirty = true;
                        return;
                    }
                    tempRowSig += r.at(index)?.length ?? 0;
                });

                rowSig = !columnDirty ? rowSig += tempRowSig : rowSig;
            }
        });

        // TODO: maybe log out if rowSig is 0 here?

        // TODO: another edge case of this method is if columns 1,2,3 have a relation column to another page
        // TODO:    and that other page is elsewhere in the workspace, causing the relative link to be different
        // TODO:    a potential fix is to just look at those values, and if they appear to be .md references, don't use them

        const preHash = `${sortedHeaders}:${headerCount}:${headerBytes}:${rowCount}:${rowSig}:${dbName}`;
        this._logger.debug(`Generating DB signature based on: ${preHash}`);
        const hash = crypto.createHash('md5');
        hash.update(preHash);
        this._dbSignature = hash.digest('hex');
        this._logger.debug(`Generated DB signature: ${this._dbSignature}`);
    }
}