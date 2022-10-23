import {
    TanaIntermediateAttribute,
    TanaIntermediateFile,
    TanaIntermediateNode,
    TanaIntermediateSummary
} from "../../types/types";
import {ExportItemType, NotionExportItem} from "./NotionExportItem";
import fs from "fs";
import path from "path";
import {NotionMarkdownConverter} from "./NotionMarkdownConverter";
import {createNode} from "./utils";

export class NotionPathConverter {

    private tracking: Map<string, NotionExportItem> = new Map();

    public convertPath(fullPath: string): TanaIntermediateFile | undefined{

        const attrMap: Map<string, TanaIntermediateAttribute> = new Map();
        const summary: TanaIntermediateSummary = {
            brokenRefs: 0,
            calendarNodes: 0,
            fields: 0,
            leafNodes: 0,
            topLevelNodes: 0,
            totalNodes: 0
        };
        const tanaOutput: TanaIntermediateFile = {
            version: 'TanaIntermediateFile V0.1',
            summary: summary,
            nodes: []
        };

        this.walkPath(fullPath, tanaOutput.nodes);
        return tanaOutput;
    }

    private walkPath(dir: string, nodes: TanaIntermediateNode[]): void{

        const files = fs.readdirSync(dir);
        files.forEach(file => {

            if(file === ".DS_Store") // skip
                {return;}

            const item = new NotionExportItem(path.join(dir, file));

            if(item && item.itemType == ExportItemType.Markdown){
                const contents = item.getContents() ?? '';
                item.tanaNodeRef = new NotionMarkdownConverter().convert(contents);
                nodes.push(item.tanaNodeRef!);
                this.tracking.set(item.id, item);
            }

            if(item && item.itemType == ExportItemType.Directory){
                item.tanaNodeRef = createNode(item.name + ' (Subpages)');
                this.tracking.set(item.id, item);
                nodes.push(item.tanaNodeRef);
                this.walkPath(item.fullPath, item.tanaNodeRef.children!);
            }
        })
    }

}