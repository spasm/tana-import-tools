import {
    TanaIntermediateAttribute,
    TanaIntermediateFile,
    TanaIntermediateNode,
    TanaIntermediateSummary,
    TanaIntermediateSupertag
} from "../../types/types";

import fs from "fs";
import path from "path";
import {NotionMarkdownConverter} from "./markdown/NotionMarkdownConverter";
import {
    createAttribute,
    createImageDescriptionField,
    createNode,
    createSupertag,
    generateIdFromInternalImage
} from "./utils";
import {ExportItemType, NotionExportItem} from "./notion-core/NotionExportItem";
import {NotionDatabaseItem} from "./notion-core/NotionDatabaseItem";
import {NotionMarkdownItem} from "./notion-core/NotionMarkdownItem";
import os from "os";
import urlJoin from "url-join";
import Conf from "conf";
import {RegExRegistry} from "./RegExRegistry";
import {logging, LogLevel} from "./logging";

export class NotionPathConverter {

    private _logger = logging.getLogger(this.constructor.name);
    private _tracking: Map<string, NotionExportItem> = new Map();
    private _dbTracking: Map<string, string | undefined> = new Map();

    private _summary: TanaIntermediateSummary = { brokenRefs: 0, calendarNodes: 0, fields: 0,
        leafNodes: 0, topLevelNodes: 0, totalNodes: 0};
    private _attributes = new Array<TanaIntermediateAttribute>();
    private _supertags = new Array<TanaIntermediateSupertag>();

    private _rootPath = "";
    private _uploadPath = "https://no.host.set";
    private _filesToSkip = ['.DS_Store'];

    constructor() {
        logging.configure({
            minLevels: {
                '': LogLevel.Info,
                'NotionMarkdownConverter': LogLevel.Info
            }
        }).registerConsoleLogger();
    }

    public convertPath(fullPath: string): TanaIntermediateFile | undefined{
        this._rootPath = fullPath;

        const tanaOutput: TanaIntermediateFile = {
            version: 'TanaIntermediateFile V0.1',
            summary: this._summary,
            nodes: [],
            attributes: this._attributes,
            supertags: this._supertags
        };

        this.setImageUploadPath();
        this.initDefaultSupertags();
        this.initDefaultFields();

        this.walkPath(fullPath, tanaOutput.nodes);

        if(this._logger.isTraceSet) {
            this._logger.trace(`Listing all tracked items.  DB Views: ${this._dbTracking.size}, Items: ${this._tracking.size}`);
            this._dbTracking.forEach((v, k) => this._logger.trace(`value: ${v}, key: ${k}`));
            this._tracking.forEach((v, k) => this._logger.trace(`value: ${v.tanaNodeRef?.uid}, key: ${k}`));
        }

        this.performPostProcessing(tanaOutput);
        return tanaOutput;
    }

    private walkPath(dir: string, nodes: TanaIntermediateNode[],
                     dbContext?: NotionDatabaseItem | undefined): void{

        const files = fs.readdirSync(dir);
        files.forEach(file => {
            if(this._filesToSkip.includes(file)){
                return;
            }

            const item = this.getResolvedItem(new NotionExportItem(path.join(dir, file)), dbContext);
            const pageSuperTagId = dbContext === undefined ? this.notionPageSupertagId : this.notionDbPageSupertagId;

            // Have we already processed this file via another branch? skip if so
            if(this.isTracking(item)){
                return;
            }

            /*
                if we hit a CSV file via
                this entry point, it's most likely just a view.  We will keep a reference of it
                to replace any associated links.
             */
            if(item instanceof NotionDatabaseItem) {
                this._dbTracking.set(item.id, item.signature);
            }

            if(item instanceof NotionMarkdownItem) {
                const processedItem = this.processMarkdownItem(item);

                if(!processedItem || !processedItem?.tanaNodeRef){
                    return;
                }

                processedItem.tanaNodeRef.supertags?.push(pageSuperTagId);
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
                this.track(item);
            }

            // directories will be hit before any files of the same name
            if(item?.isDirectoryItem()){
                // check for a csv of the same name
                if(this.csvOfSameNameExists(item.fullPath)){
                    // This means that the directory that we've landed on is the directory of
                    // Contents for an inline/embedded database in a page
                    // ** This means it's a SOURCE database, not a view/link! **
                    const parentNode = createNode(item.name);
                    parentNode.supertags?.push(this.notionDbSupertagId);
                    nodes.push(parentNode);
                    const csvItem = this.getResolvedItem(new NotionExportItem(item.fullPath + '.csv'), dbContext) as NotionDatabaseItem;
                    csvItem.tanaNodeRef = parentNode;
                    this.track(csvItem);
                    this.walkPath(item.fullPath, parentNode.children!, csvItem);
                    return;
                }

                // check for a markdown file of the same name
                if(this.markdownOfSameNameExists(item.fullPath)){
                    // This means that the directory that we've landed on is the directory of
                    // contents for a page.  This might be images, this might be a database
                    // in the case of a database, once we go into this directory there's probably another
                    // directory, and a companion CSV for us to then inspect the database
                    const nextItem = this.getResolvedItem(new NotionExportItem(item.fullPath + '.md'), dbContext) as NotionMarkdownItem;
                    const processedNextItem = this.processMarkdownItem(nextItem);

                    if(!processedNextItem || !processedNextItem?.tanaNodeRef){
                        this._logger.error(`No Notion or Tana item for: ${item.name},\n returning early.`);
                        return;
                    }

                    processedNextItem.tanaNodeRef.supertags?.push(pageSuperTagId);

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
        return this._tracking.has(item.id);
    }

    private track(item: NotionExportItem): void {
        this._tracking.set(item.id, item);
    }

    private processMarkdownItem(item: NotionMarkdownItem): NotionMarkdownItem | undefined {
        if(item.itemType !== ExportItemType.Markdown){
            return;
        }
        const converted = new NotionMarkdownConverter(item).convert();
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
        this._summary.totalNodes += origin.totalNodes;
        this._summary.fields += origin.fields;
        this._summary.leafNodes += origin.leafNodes;
        this._summary.topLevelNodes += origin.topLevelNodes;
        this._summary.calendarNodes += origin.calendarNodes;
        this._summary.brokenRefs += origin.brokenRefs;
    }

    private performPostProcessing(tanaOutput: TanaIntermediateFile): void {
        this._logger.debug(`Starting post-processing...`);

        const nodeTypesToCount = ['node', 'field'];
        const walkNodes = (nodes: Array<TanaIntermediateNode>, level = 0) => {
            level++;
            nodes.forEach(node => {
                this.fixLinkReferences(node);

                if(level === 1 && nodeTypesToCount.includes(node.type)) {
                    tanaOutput.summary.topLevelNodes++;
                }
                if(level > 1 && nodeTypesToCount.includes(node.type)) {
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
        this._logger.debug(`Fixing link references for: ${node.name}`);

        const regex = new RegExRegistry();
        const idLength = 32;

        // Matches the common MD link format -- e.g. []() or ![]()
        // Matches all instances of them, and then we iterate through them
        const mdLinkMatches = node.name.matchAll(regex.markdownLinksGlobal);

        for (const mdLinkMatch of mdLinkMatches) {
            const alias = mdLinkMatch?.at(1);
            const url = mdLinkMatch?.at(2);
            const extensionMatch = url?.match(regex.internalExtensions);
            const httpMatch = url?.match(regex.httpsUrl);

            if(!extensionMatch || !url) {
                return;
            } // do nothing, leave the link as is
            // TODO: we should probably log something out, or capture something here

            if(node.name.startsWith('![')) {
                // is an image link
                if(!httpMatch) {
                    // no http/s match, so let's assume it's an image link to a file on disk
                    // we'll need to inspect the URL, split it and extract the id and name
                    // look up the image
                    const imageId = generateIdFromInternalImage(decodeURI(url));
                    const notionItem = this._tracking.get(imageId);
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

            let item = this._tracking.get(id);

            if(!item && extensionMatch[0] === '.csv') {
                const dbSig = this._dbTracking.get(id);

                if(dbSig) {
                    const found = new Array<NotionExportItem>();
                    this._tracking.forEach((v) => {
                        if(v instanceof NotionDatabaseItem && v.signature === dbSig) {
                            found.push(v);
                        }
                    })
                    if(found?.length === 0) {
                        this._logger.error(`Couldn't find a source database to link to: id:${id}, sig:${dbSig}`);
                    }
                    else if(found?.length > 1) {
                        item = found[0];
                        this._logger.warn(`Found ${found.length} source databases to link to, choosing the first: ${item.name} for ${item.fullPath}`);
                    }
                    else {
                        item = found[0];
                    }
                }
            }

            if(item) {
                const uid = item.tanaNodeRef?.uid;

                if(!uid) {
                    this._logger.error(`Found item, however no Tana UID for: ${item.name}, id: ${item.id}`);
                    return;
                }

                this._logger.debug(`Node name before replacement: ${node.name}`);
                node.name = node.name.replace(regex.markdownLinks, `[${alias}]([[${uid}]])`)
                this._logger.debug(`Node name after replacement: ${node.name}`);
                node.refs?.push(uid);
            }
        }

        // TODO: consider adding a check for a node of type 'field' here, since fields
        // seem to be the only area where Notion doesn't use a full MD link to indicate
        // a link out to a file
        if(Array.from(mdLinkMatches).length === 0) {
            // if we didn't have any md links, doesn't mean we don't have files to still resolve
            if(!node.name.endsWith('.md')){ return; }

            // if we're here, this is probably a field with one or more md files
            // split!
            const files = node.name.split(',');
            const totalLength = idLength + 3;
            let tempNodeName = "";
            const tempNodeRefs = new Array<string>;
            files.forEach(file => {
                const id = file.substring(file.length - totalLength, file.length - 3);
                const item = this._tracking.get(id);
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

    private get notionPageSupertagId(): string {
        return this._supertags.find(f => f.name === `notion-page`)!.uid;
    }

    private get notionDbSupertagId(): string {
        return this._supertags.find(f => f.name === `notion-db`)!.uid;
    }

    private get notionDbPageSupertagId(): string {
        return this._supertags.find(f => f.name === `notion-dbpage`)!.uid;
    }

    private initDefaultFields() {
        this._attributes.push(createAttribute(`Image Description`));
    }

    private initDefaultSupertags() {
        this._supertags.push(createSupertag(`image`));
        this._supertags.push(createSupertag(`notion-page`));
        this._supertags.push(createSupertag(`notion-pagelink`));
        this._supertags.push(createSupertag(`notion-db`));
        this._supertags.push(createSupertag(`notion-dblink`));
        this._supertags.push(createSupertag(`notion-dbview`));
        this._supertags.push(createSupertag(`notion-dbpage`));
    }

    private setImageUploadPath(): void {
        const url = new Conf().get(`imageUploadBaseUrl`) as string;
        this._logger.info(`Setting image host to: ${url}`);
        if(url?.length > 0) {
            this._uploadPath = url;
        }
    }

    private getResolvedItem(item: NotionExportItem, dbContext?: NotionDatabaseItem): NotionExportItem {
        switch(item.itemType) {
            case ExportItemType.CSV: {
                return new NotionDatabaseItem(item);
            }
            case ExportItemType.Markdown: {
                return new NotionMarkdownItem(item, dbContext);
            }
            default:
                return item;
        }
    }
}