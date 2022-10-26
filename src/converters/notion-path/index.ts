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
import {createNode, debugPrint} from "./utils";

export class NotionPathConverter {

    private tracking: Map<string, NotionExportItem> = new Map();
    private summary: TanaIntermediateSummary = { brokenRefs: 0, calendarNodes: 0, fields: 0,
        leafNodes: 0, topLevelNodes: 0, totalNodes: 0};
    private filesToSkip = ['.DS_Store'];

    public convertPath(fullPath: string): TanaIntermediateFile | undefined{

        const attrMap: Map<string, TanaIntermediateAttribute> = new Map();

        const tanaOutput: TanaIntermediateFile = {
            version: 'TanaIntermediateFile V0.1',
            summary: this.summary,
            nodes: []
        };

        this.walkPath(fullPath, tanaOutput.nodes);
        return tanaOutput;
    }

    private walkPath(dir: string, nodes: TanaIntermediateNode[]): void{

        debugPrint("ROOT SCAN:" + dir);

        const files = fs.readdirSync(dir);
        files.forEach(file => {
            if(this.filesToSkip.includes(file)){
                return;
            }

            const item = new NotionExportItem(path.join(dir, file));

            // Have we already processed this file via another branch? skip if so
            if(this.isTracking(item)){
                return;
            }

            if(item?.isMarkdownItem()){
                const processedItem = this.processMarkdownItem(item);

                if(!processedItem || !processedItem?.tanaNodeRef){
                    return;
                }
                nodes.push(processedItem.tanaNodeRef);
                this.track(item);
            }

            // directories will be hit before any files of the same name
            if(item?.isDirectoryItem()){
                // check for a csv of the same name
                if(this.csvOfSameNameExists(item.fullPath)){
                    // This means that the directory that we've landed on is the directory of
                    // Contents for an inline/embedded database in a page
                    debugPrint("csv exists!" + item.fullPath);
                    const parentNode = createNode(item.name);
                    nodes.push(parentNode);
                    this.walkPath(item.fullPath, parentNode.children!);
                    return;
                }

                // check for a markdown file of the same name
                if(this.markdownOfSameNameExists(item.fullPath)){
                    debugPrint("processing markdown early:" + item.fullPath)
                    // This means that the directory that we've landed on is the directory of
                    // contents for a page.  This might be images, this might be a database
                    // in the case of a database, once we go into this directory there's probably another
                    // directory, and a companion CSV for us to know to inspect the database
                    const nextItem = new NotionExportItem(item.fullPath + ".md");
                    const processedNextItem = this.processMarkdownItem(nextItem);

                    if(!processedNextItem || !processedNextItem?.tanaNodeRef){
                        debugPrint("return early");
                        return;
                    }
                    nodes.push(processedNextItem.tanaNodeRef);
                    this.track(processedNextItem);

                    // we've processed the markdown file, now let's walk the directory
                    // that we've just hit
                    if(processedNextItem?.tanaNodeRef?.children){
                        this.walkPath(item.fullPath, processedNextItem.tanaNodeRef.children)
                        return;
                    }
                }

                if(item?.tanaNodeRef?.children) {
                    this.walkPath(item.fullPath, item.tanaNodeRef.children);
                }
            }
        })
    }

    private isTracking(item: NotionExportItem): boolean {
        return this.tracking.has(item.id);
    }

    private track(item: NotionExportItem): void {
        this.tracking.set(item.id, item);
    }

    private processMarkdownItem(item: NotionExportItem): NotionExportItem | undefined {
        if(item.itemType !== ExportItemType.Markdown){
            debugPrint("Not a markdown file: " + item.itemType);
            return;
        }
        const converted = new NotionMarkdownConverter().convert(item.getContents());
        const node = converted![0];
        const summary = converted![1];
        item.tanaNodeRef = node;
        this.mergeSummaryWith(summary);

        return item;
    }

    private csvOfSameNameExists(fullPath: string){
        return fs.existsSync(fullPath + ".csv");
    }

    private markdownOfSameNameExists(fullPath: string){
        return fs.existsSync(fullPath + ".md");
    }

    private mergeSummaryWith(origin: TanaIntermediateSummary): void {
        this.summary.totalNodes += origin.totalNodes;
        this.summary.fields += origin.fields;
        this.summary.leafNodes += origin.leafNodes;
        this.summary.topLevelNodes += origin.topLevelNodes;
        this.summary.calendarNodes += origin.calendarNodes;
        this.summary.brokenRefs += origin.brokenRefs;
    }

}