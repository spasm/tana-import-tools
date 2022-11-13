import {
    TanaIntermediateAttribute,
    TanaIntermediateFile,
    TanaIntermediateNode,
    TanaIntermediateSummary, TanaIntermediateSupertag
} from "../../types/types";
import {ExportItemType, NotionExportItem} from "./notion-core/NotionExportItem";
import fs from "fs";
import path from "path";
import {NotionMarkdownConverter} from "./markdown/NotionMarkdownConverter";
import {
    createAttribute,
    createImageDescriptionField,
    createNode,
    createSupertag,
    debugPrint,
    generateIdFromInternalImage
} from "./utils";
import {NotionDatabaseContext} from "./notion-core/NotionDatabaseContext";
import {NotionMarkdownItem} from "./notion-core/NotionMarkdownItem";
import os from "os";
import urlJoin from "url-join";
import Conf from "conf";

export class NotionPathConverter {

    private tracking: Map<string, NotionExportItem> = new Map();
    private summary: TanaIntermediateSummary = { brokenRefs: 0, calendarNodes: 0, fields: 0,
        leafNodes: 0, topLevelNodes: 0, totalNodes: 0};
    private _attributes = new Array<TanaIntermediateAttribute>();
    private _supertags = new Array<TanaIntermediateSupertag>();

    private _rootPath = "";
    private _uploadPath = "https://no.host.set";

    private filesToSkip = ['.DS_Store'];

    public convertPath(fullPath: string): TanaIntermediateFile | undefined{
        this._rootPath = fullPath;

        const tanaOutput: TanaIntermediateFile = {
            version: 'TanaIntermediateFile V0.1',
            summary: this.summary,
            nodes: [],
            attributes: this._attributes,
            supertags: this._supertags
        };

        this.setImageUploadPath();
        this.initSupertags();
        this.initDefaultFields();
        this.walkPath(fullPath, tanaOutput.nodes);
        this.performPostProcessing(tanaOutput);
        return tanaOutput;
    }

    private walkPath(dir: string, nodes: TanaIntermediateNode[],
                     dbContext: NotionDatabaseContext | undefined = undefined): void{

        debugPrint("Entering Path: " + dir);

        const files = fs.readdirSync(dir);
        files.forEach(file => {
            if(this.filesToSkip.includes(file)){
                return;
            }

            const item = new NotionExportItem(path.join(dir, file), dbContext);

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

            if(item?.isImageItem()) {
                const imagePath = `${this._rootPath}-images`;
                if(!fs.existsSync(imagePath)) {
                    fs.mkdirSync(imagePath);
                }
                // save a copy off to an export directory?
                const targetFile = path.join(imagePath, item.id);
                fs.copyFileSync(item.fullPath, targetFile);
                console.log(`name: ${item.name}, id:${item.id}`);
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
                    const csvItem = new NotionExportItem(item.fullPath + ".csv");
                    this.walkPath(item.fullPath, parentNode.children!, new NotionDatabaseContext(csvItem));
                    return;
                }

                // check for a markdown file of the same name
                if(this.markdownOfSameNameExists(item.fullPath)){
                    debugPrint("processing markdown early:" + item.fullPath)
                    // This means that the directory that we've landed on is the directory of
                    // contents for a page.  This might be images, this might be a database
                    // in the case of a database, once we go into this directory there's probably another
                    // directory, and a companion CSV for us to then inspect the database
                    const nextItem = new NotionExportItem(item.fullPath + ".md", dbContext);
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
            return;
        }
        const mdItem = new NotionMarkdownItem(item.fullPath, item.parentDatabase);
        const converted = new NotionMarkdownConverter(mdItem).convert();
        if(converted){
            const [node, summary, attributes] = converted;
            item.tanaNodeRef = node;
            this.mergeSummaryWith(summary);
            this.mergeAttributesWith(attributes);
            return item;
        }
    }

    private csvOfSameNameExists(fullPath: string){
        return fs.existsSync(fullPath + ".csv");
    }

    private markdownOfSameNameExists(fullPath: string){
        return fs.existsSync(fullPath + ".md");
    }

    private mergeAttributesWith(source: Array<TanaIntermediateAttribute>): void {
        const existing = this._attributes.map(a => a.name);

        source.forEach(attr => {
            if(!existing.includes(attr.name)){
                this._attributes.push(attr);
            }
        })
    }

    private mergeSummaryWith(origin: TanaIntermediateSummary): void {
        this.summary.totalNodes += origin.totalNodes;
        this.summary.fields += origin.fields;
        this.summary.leafNodes += origin.leafNodes;
        this.summary.topLevelNodes += origin.topLevelNodes;
        this.summary.calendarNodes += origin.calendarNodes;
        this.summary.brokenRefs += origin.brokenRefs;
    }

    private performPostProcessing(tanaOutput: TanaIntermediateFile): void {
        const nodeTypesToCount = ['node', 'field'];
        const walkNodes = (nodes: Array<TanaIntermediateNode>, level = 0) => {
            level++;
            nodes.forEach(node => {

                this.fixLinkReferences(node);

                if(!nodeTypesToCount.includes(node.type)) {
                    return;
                }
                if(level === 1 && node.type === 'node') {
                    tanaOutput.summary.topLevelNodes++;
                }
                if(level > 1 && node.type === 'node') {
                    tanaOutput.summary.leafNodes++;
                }
                if(node.children){
                    walkNodes(node.children, level)
                }
            });
        };

        walkNodes(tanaOutput.nodes);
        tanaOutput.summary.totalNodes = tanaOutput.summary.topLevelNodes + tanaOutput.summary.leafNodes;
        tanaOutput.summary.fields = tanaOutput.attributes?.length ?? 0;
    }

    private fixLinkReferences(node: TanaIntermediateNode): void {
        const mdLinkRegex = /\[([^\]]+)\]\(([^\)]+)\)/;
        const internalExtRegex = /\.(gif|jpe?g|tiff?|png|webp|bmp|md|csv)$/i;
        const httpRegex = /^https?:\/\//;
        const idLength = 32;

        // matches the common MD link format -- e.g. []() or ![]()
        const mdLinkMatch = node.name.match(mdLinkRegex);
        if(mdLinkMatch) {
            const alias = mdLinkMatch?.at(1);
            const url = mdLinkMatch?.at(2);
            const extensionMatch = url?.match(internalExtRegex);
            const httpMatch = url?.match(httpRegex);

            if(!extensionMatch || !url){ return; } // do nothing, leave the link as is
            // TODO: we should probably log something out, or capture something here

            if(node.name.startsWith('![')) {
                // is an image link
                if(!httpMatch) {
                    // no http/s match, so let's assume it's an image link to a file on disk
                    // we'll need to inspect the URL, split it and extract the id and name
                    // look up the image
                    const imageId = generateIdFromInternalImage(decodeURI(url));
                    const notionItem = this.tracking.get(imageId);
                    if(notionItem) {
                        node.name = alias ?? url;
                        node.mediaUrl = urlJoin(this._uploadPath, encodeURI(notionItem.id));
                        node.type = 'image';
                        node.supertags?.push(this.imageSupertagId);
                        node.children?.push(createImageDescriptionField(`${alias ?? url}`));
                    }

                } else {
                    // is an http/s match, so let's just convert to an image node and move on
                    node.name = alias ?? url;
                    node.mediaUrl = url;
                    node.type = 'image';
                }
                // bail early, we did what we needed to do
                return;
            }

            // process this like a normal internal file
            const totalLength = idLength + extensionMatch[0]?.length;
            const id = url.substring(url.length - totalLength, url.length - (totalLength - idLength));
            const item = this.tracking.get(id);

            if(item) {
                const uid = item.tanaNodeRef?.uid;
                if(!uid){ return;}

                node.name = node.name.replace(mdLinkRegex, `[${alias}]([[${uid}]])`)
                node.refs?.push(uid);
            }
        } else {
            // does the name end with .md?
            if(!node.name.endsWith('.md')){ return; }

            // if we're here, this is probably a field with one or more md files
            // split!
            const files = node.name.split(',');
            const totalLength = idLength + 3;
            let tempNodeName = "";
            const tempNodeRefs = new Array<string>;
            files.forEach(file => {
                const id = file.substring(file.length - totalLength, file.length - 3);
                const item = this.tracking.get(id);
                if(item) {
                    const uid = item.tanaNodeRef?.uid;
                    if(!uid){ return;}
                    tempNodeName += `[${item.tanaNodeRef?.name}]([[${uid}]])${os.EOL}`;
                    tempNodeRefs.push(uid);
                }
            });

            if(tempNodeName !== "") {
                node.name = tempNodeName.trim();
                node.refs?.push(...tempNodeRefs);
            }
        }
    }

    private get imageSupertagId(): string {
        return this._supertags.find(f => f.name === `image`)!.uid;
    }

    private initDefaultFields() {
        this._attributes.push(createAttribute(`Image Description`));
    }

    private initSupertags() {
        this._supertags.push(createSupertag(`image`));
        this._supertags.push(createSupertag(`notion-page`));
        this._supertags.push(createSupertag(`notion-pagelink`));
        this._supertags.push(createSupertag(`notion-db`));
        this._supertags.push(createSupertag(`notion-dblink`));
        this._supertags.push(createSupertag(`notion-dbview`));
    }

    private setImageUploadPath(): void {
        const url = new Conf().get(`imageUploadBaseUrl`) as string;
        console.log(`Setting image host to: ${url}`);
        if(url?.length > 0) {
            this._uploadPath = url;
        }
    }
}