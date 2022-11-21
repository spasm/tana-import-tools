export class RegExRegistry {

    /*
        Matches all markdown link syntax.
        e.g. [xx](xx) or ![xx](xx)
     */
    get markdownLinks(): RegExp {
        return /\[([^\]]+)\]\(([^\)\[]+)\)/;
    }

    /*
        Matches multiple links with
        markdown syntax.
     */
    get markdownLinksGlobal(): RegExp {
        return /\[([^\]]+)\]\(([^\)]+)\)/g;
    }

    /*
        Any internal extensions that we may need to
        handle when converting links.
     */
    get internalExtensions(): RegExp {
        return /\.(gif|jpe?g|tiff?|png|webp|bmp|md|csv)$/i;
    }

    /*
        Matches http or https
     */
    get httpsUrl(): RegExp {
        return /^https?:\/\//;
    }
}