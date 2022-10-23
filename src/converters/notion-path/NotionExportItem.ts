import path, {ParsedPath} from "path";
import fs from "fs";
import {TanaIntermediateNode} from "../../types/types";

export enum ExportItemType {
    Unknown,
    Directory,
    Markdown,
    CSV
}

export class NotionExportItem {

    public tanaNodeRef: TanaIntermediateNode | undefined;

    public readonly itemType: ExportItemType = ExportItemType.Unknown;
    public readonly id: string;
    public readonly name: string;
    private readonly parsedPath: ParsedPath | undefined;
    public readonly fullPath: string;

    constructor(fullPath: string) {
        this.parsedPath = path.parse(fullPath);
        this.fullPath = fullPath;

        this.itemType = this.getItemType();
        this.id = this.getNotionId();
        this.name = this.getItemName();
    }

    private getNotionId(): string {
        const name = this.parsedPath!.name;
        return name.substring(name.length - 32, name.length).trim();
    }

    private getItemName(): string {
        const name = this.parsedPath!.name;
        return name.substring(0, name.length - 32).trim();
    }

    private getItemType(): ExportItemType {
        const stat = fs.statSync(this.fullPath!)

        if (stat.isDirectory())
            {return ExportItemType.Directory;}

        const ext = this.parsedPath?.ext;

        if (ext === ".md")
            {return ExportItemType.Markdown;}
        else if (ext === ".csv")
            {return ExportItemType.CSV;}
        else
            {return ExportItemType.Unknown;}
    }

    public getContents(): string | undefined {
        if(this.fullPath)
            {return fs.readFileSync(this.fullPath, 'utf-8');}
    }
}