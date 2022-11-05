import {NotionExportItem} from "./NotionExportItem";
import {NotionDatabaseContext} from "./NotionDatabaseContext";
import os from "os";

export class NotionMarkdownItem extends NotionExportItem {

    private _title = "";
    private _fields = new Array<string>;
    private _body = "";

    public get title(): string {
        return this._title;
    }

    public get fields(): Array<string> {
        return this._fields;
    }

    public get body(): string {
        return this._body;
    }

    constructor(fullPath: string, parentDatabase: NotionDatabaseContext | undefined = undefined) {
        super(fullPath, parentDatabase);
        this.initialize();
    }

    private initialize(): void {
        const contents = this.getContents();

        if(!contents) {
            throw Error("Markdown file cannot be empty");
        }

        let pass = 0;
        let inBodyContext = false;
        let inFieldContext = false;
        let tempBody = "";
        const isField = (field: string) => {
            return this.parentDatabase?.headerRow.includes(field);
        }

        contents.split(/\r?\n/).forEach(line => {
            pass++;
            // if we're in a body context, just continue to rebuild our content body
            if(inBodyContext) {
                this._body += line + os.EOL;
                return;
            }

            // if it's the first line, and starts with #, this is our primary header
            if(pass === 1 && line.startsWith('#', 0)) {
                this._title = line;
                return;
            }

            // the format of a field, however
            // a field can wrap to many lines, so we have to keep track of
            const field = line.substring(0, line.indexOf(':', 0));

            // if we're on the third line and it's not a field, then just collect the rest as body
            if(pass === 3 && !isField(field)) {
                inFieldContext = false;
                inBodyContext = true;
                this._body += line + os.EOL;
                return;
            }

            // our very first field, pretty straight forward
            if(pass === 3 && isField(field)) {
                inFieldContext = true;
                this._fields.push(line);
                return;
            }

            // here we've already found at least one field, and we're past the third line
            if(pass > 3 && inFieldContext) {
                if(isField(field)) {

                    // first, have we been collecting from a field newline?
                    if(tempBody !== "") {
                        // yes, save this off into our previous field array entry
                        const index = this._fields.length - 1;
                        this._fields[index] = this._fields[index] + os.EOL + tempBody;
                        tempBody = "";
                    }

                    this._fields.push(line);
                    return;
                } else {
                    // this isn't a valid field, but it might be one of two things
                    // 1. A new line entry in a field text entry
                    // 2. The start of the body
                    // Let's save this off until we know for sure
                    tempBody += line + os.EOL;
                    return;
                }
            }

            // if we get here, just add it to the body
            this._body += line + os.EOL;
        });

        // if we're here with a tempBody still, it's probably just the body
        // it could also be the last "field" in the file with multi-line text
        // edge case for us to consider handling later
        if(tempBody !== "") {
            this._body = tempBody;
        }
    }
}