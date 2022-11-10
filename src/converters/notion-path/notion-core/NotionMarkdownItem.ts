import {NotionExportItem} from "./NotionExportItem";
import {NotionDatabaseContext, NotionDbRecords} from "./NotionDatabaseContext";
import os from "os";

export type NotionMarkdownField = {
    name: string,
    body: string
}

export class NotionMarkdownItem extends NotionExportItem {

    private _title = "";
    private _fields = new Array<NotionMarkdownField>;
    private _body = "";

    public get title(): string {
        return this._title;
    }

    public get fields(): Array<NotionMarkdownField> {
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
        let fastForwardToPass = 0;
        let inBodyContext = false;
        let relatedRecords: NotionDbRecords;

        const isDbField = (field: NotionMarkdownField | undefined) => {
            if(!field){ return; }
            return this.parentDatabase?.headerRow.includes(field.name);
        }

        contents.split(/\r?\n/).forEach(line => {
            pass++;

            if(pass < fastForwardToPass) {
                console.log(`pass: ${pass} being fast forwarded`);
                return;
            }

            // if we're in a body context, just continue to rebuild our content body
            if(inBodyContext) {
                this._body += line + os.EOL;
                return;
            }

            // if it's the first line, and starts with #, this is our primary header
            if(pass === 1 && line.startsWith('#', 0)) {
                this._title = line.substring(1, line.length).trim();

                // now that we have our title, let's resolve related records
                if(this.parentDatabase) {
                    relatedRecords = this.parentDatabase.getRowsByCellText(this._title);
                }

                return;
            }

            // the format of a field, however
            // a field can wrap to many lines, so we have to keep track of
            const mdField = this.parseField(line);

            if(!mdField || !isDbField(mdField)) {
                this._body += line + os.EOL;
                return;
            }

            // if we're on the third line, and it's not a field, then just collect the rest as body
            if(pass === 3 && !isDbField(mdField)) {
                inBodyContext = true;
                this._body += line + os.EOL;
                return;
            }

            // Get our field from the database so that we can inspect it
            const dbField = this.enrichFieldFromRecords(mdField!, relatedRecords); // we won't get here if field is undefined

            // from here on forward, process as potential fields
            if(pass >= 3 && isDbField(mdField)) {

                if(dbField) {
                    // do we have an enriched field?  let's refine further
                    const dbFieldSplit = dbField?.body.split(/\r\n|\r|\n/);
                    // if we don't have any new line characters, just add to our fields
                    // and return.
                    if(dbFieldSplit?.length === 1){
                        this._fields.push(mdField!);
                        return;
                    }

                    // if we have more than 1 line, then we have newline characters to account for
                    if(dbFieldSplit?.length > 1){
                        // does the first line of our CSV field match what we parsed
                        // from the markdown file?
                            this._fields.push({name: dbField.name, body: dbField.body });
                            fastForwardToPass = pass + dbFieldSplit.length;
                            console.log(`fast forwarding to ${fastForwardToPass}`);
                            return;

                    }
                } else { // no dbfield but we have an md field?
                    this._fields.push(mdField!)
                    return;
                }
            }

            // if we get here, just add it to the body
            this._body += line + os.EOL;
        });

        // Post-processing for fields
        this.postProcessFields();
    }

    private parseField(line: string): NotionMarkdownField | undefined {
        const field = line.substring(0, line.indexOf(':', 0));
        if(field) {
            const fieldBody = line.substring(line.indexOf(':',0) + 1, line.length)
            return {
                name: field.trim(),
                body: fieldBody.trim()
            };
        }
    }

    // Notion doesn't export all fields into the markdown file
    // Go through our headers and see if we can find which fields
    // aren't in the markdown, and add them
    private postProcessFields(): void {

        // this is kind of lazy for now, just get the first row
        const relatedRecord = this.parentDatabase?.getRowsByCellText(this.title)?.at(0);

        // we can expand this routine to compare some of the fields we
        // parsed out of the markdown file, with what's in the CSV
        this.parentDatabase?.headerRow.forEach((field, index) => {
            if(!this._fields.map(x => x.name).includes(field)){
                // if we don't find one of the headerRow fields in the
                // fields we parsed out of the MD file, we need to take a look at it
                let fieldValue = "";
                if(relatedRecord){
                    fieldValue = relatedRecord[index];
                    if(fieldValue === this.title) { return ;} // this is our node title
                }
                this.fields.push({name: field, body:fieldValue});
            }
        })
    }

    private enrichFieldFromRecords(field: NotionMarkdownField, records: NotionDbRecords): NotionMarkdownField | undefined {
        // first, get the index of the field from the headers
        const index = this.parentDatabase?.headerRow.findIndex((f, idx) => f === field.name);

        if(index === undefined || index < 0) {
            console.error(`field: ${field.name} not found in enrichFieldFromDatabase: ${JSON.stringify(this.parentDatabase?.headerRow)}`);
            return;
        }

        let enrichedField: NotionMarkdownField | undefined;

        records?.forEach(r => {
            const dbFieldBody = r[index];
            if(dbFieldBody === field.body) {
                // return original body if all matches up
                enrichedField = { name: field.name, body: field.body };
                return;
            }

            // if it's a non match, perhaps it's because there are newlines
            // we want to split it up, and compare just the first lines
            const splitBody = dbFieldBody.split(/\r\n|\r|\n/);
            if(splitBody?.length > 0) {
                if(splitBody[0] === field.body) {
                    enrichedField = { name: field.name, body: dbFieldBody };
                    return;
                }
            }
        })

        return enrichedField;
    }
}