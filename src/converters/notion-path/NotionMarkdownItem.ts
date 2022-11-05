import {NotionExportItem} from "./NotionExportItem";
import {NotionDatabaseContext} from "./NotionDatabaseContext";
import {marked} from "marked";
import fs from "fs";

export class NotionMarkdownItem extends NotionExportItem {

    private _header: string;

    constructor(fullPath: string, parentDatabase: NotionDatabaseContext | undefined = undefined) {
        super(fullPath, parentDatabase);
        this.initialize();
        console.log('did stuff');
    }

    private initialize(): void {
        const contents = this.getContents();

        if(!contents) {
            throw Error("Markdown file cannot be empty");
        }

        let pass = 0;
        let inFieldContext = false;
        contents.split(/\r?\n/).forEach(line => {

           if(pass === 0 && line.startsWith('#', 0)) {
               this._header = line;
           }
           if(pass === 2){ inFieldContext = true; }

           if(inFieldContext) {
               const fieldName = line.substring(0, line.indexOf(':', 0));

           }

        });

        if(this.parentDatabase) {
            // do stuff
        }
        // Get our header off the first line
        // skip next line, blank
        // Does the third line item contain a field?
            // Get line, do a substring looking for ':'
            // yes? --> extract field, does that field exist in our list of fields?
            // yes? --> get next line, has a ':'?

    }

}