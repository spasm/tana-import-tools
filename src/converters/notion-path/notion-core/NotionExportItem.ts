import path, {ParsedPath} from "path";
import fs from "fs";
import {TanaIntermediateNode} from "../../../types/types";
import {NotionDatabaseContext} from "./NotionDatabaseContext";
import {generateIdFromInternalImage} from "../utils";

export enum ExportItemType {
    Unknown,
    Directory,
    Markdown,
    CSV,
    Image
}

export class NotionExportItem {

    public tanaNodeRef: TanaIntermediateNode | undefined;

    public readonly itemType: ExportItemType = ExportItemType.Unknown;
    public readonly id: string;
    public readonly name: string;
    public readonly parsedPath: ParsedPath | undefined;
    public readonly fullPath: string;
    public readonly parentDatabase: NotionDatabaseContext | undefined;

    constructor(fullPath: string, parentDatabase: NotionDatabaseContext | undefined = undefined) {
        this.parsedPath = path.parse(fullPath);
        this.fullPath = fullPath;
        this.parentDatabase = parentDatabase;
        this.itemType = this.getItemType();
        this.id = this.getNotionId();
        this.name = this.getItemName();
    }

    // if it's a file, just return the id
    // if it's a directory, suffix with '-d'
    private getNotionId(): string {
        const name = this.parsedPath!.name;
        let returnId = "";

        switch (this.itemType) {
            case ExportItemType.Image: {
                returnId = generateIdFromInternalImage(this.fullPath);
                break;
            }
            case ExportItemType.Directory:
            case ExportItemType.Markdown: {
                const id = name.substring(name.length - 32, name.length).trim();
                returnId = this.itemType == ExportItemType.Directory ? id + '-d' : id;
                break;
            }
        }
        return returnId;
    }

    private getItemName(): string {
        const name = this.parsedPath!.name;

        // images don't have 32-digit ids
        if(this.itemType === ExportItemType.Image) {
            return name;
        }
        return name.substring(0, name.length - 32).trim();
    }

    private getItemType(): ExportItemType {
        const stat = fs.statSync(this.fullPath!)
        const imageMatch = /\.(gif|jpe?g|tiff?|png|webp|bmp)$/i;

        if (stat.isDirectory())
            {return ExportItemType.Directory;}

        const ext = this.parsedPath?.ext;

        if (ext === ".md")
            { return ExportItemType.Markdown; }
        else if (ext === ".csv")
            { return ExportItemType.CSV; }
        else if (ext?.match(imageMatch))
            { return ExportItemType.Image; }
        else
            { return ExportItemType.Unknown; }
    }

    public getContents(): string | undefined {
        if(this.fullPath)
            {return fs.readFileSync(this.fullPath, 'utf-8');}
    }

    public isMarkdownItem(): boolean {
        return this.itemType === ExportItemType.Markdown;
    }

    public isDirectoryItem(): boolean {
        return this.itemType === ExportItemType.Directory;
    }

    public isImageItem(): boolean {
        return this.itemType === ExportItemType.Image;
    }

    public isCsvItem(): boolean {
        return this.itemType === ExportItemType.CSV;
    }

    public hasParentDatabase(): boolean {
        return this.parentDatabase !== undefined;
    }
}