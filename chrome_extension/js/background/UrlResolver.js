//callbackTracker = {}
UrlResolver = function(siteInfo, tabId){
    console.log("in url resolver")
    var oldAbsoluteTo = URI.prototype.absoluteTo;
    URI.prototype.absoluteTo = function(url) {
        try {
            return URI(oldAbsoluteTo.call(this,url));
        } catch(e) {
            console.log("caught error with absoluteTo while parsing this uri: ", url);
            console.log("error is", e);
            return URI(url);
        }
    };

    AWSBase = "https://s3.amazonaws.com/FlashArchives";

    var stylesheetHrefs         = siteInfo.stylesheetHrefs;
    var stylesheetContents      = siteInfo.stylsheetContents;

    var styleSheetsLeft          = stylesheetHrefs.length;

    var processedStyleSheets    = {};
    var originalToAwsUrlMap     = {};

    var baseURI                 = siteInfo.baseUri;
    var currentLocation         = siteInfo.currentLocation;
    var unprocessedHtml         = siteInfo.html
    var processedHtml           = false;
    var isIframe                = !!siteInfo.iframe;
    var htmlAttributes          = siteInfo.htmlAttributes;
    var shallowSave             = siteInfo.shallowSave;
    var noteId                  = siteInfo.noteId;
    var tabId                   = tabId;
    var clientSideId            = siteInfo.clientSideId;

//    var callbackTracker = {
//        siteID: currentSiteID,
//        trailID: currentTrailID,
//        currentSite: currentLocation,
//        baseURI: baseURI,
//        styleSheetsLeft: stylesheetHrefs.length,
//        styleSheets:{},
//        originalToAwsUrlMap: {},
//        html: false,
//        isIframe: !!isIframe,
//        shallowSave: shallowSave,
//        revision: revision,
//        isBaseRevision: isBaseRevision,
//        characterEncoding: characterEncoding,
//        noteId: siteInfo.note_id,
//        tabId: tabId,
//        clientSideId: siteInfo.client_side_id
//    };

    this.resolve = function() {
        $.each(stylesheetHrefs, function(i,href){
            getCssAndParse(href)
        })

        parseHtmlAndResolveUrls();
    }

    function parseHtmlAndResolveUrls() {
        var newDoc = document.implementation.createHTMLDocument().documentElement;
        newDoc.innerHTML = unprocessedHtml;
        var $html = $(newDoc);

        $.each(htmlAttributes,function(attributeName,attributeValue){
            $html.attr(attributeName, attributeValue);
        })

        $html.find("style").each(function(i,styleElement){
            styleElement.innerHTML = parseCSSAndReplaceUrls(styleElement.innerHTML, "");
        })

        $html.find("img[src]").each(function(i,imageElement){
            var imageUrl = imageElement.getAttribute("src");
            if (imageUrl && !imageUrl.match(/^data:/)){
                var newUrlAndFilePath = generateAwsUrl(imageUrl);
                var newUrl = newUrlAndFilePath.fullUrl;
                var filePath = newUrlAndFilePath.awsPath;
                var absoluteUrl = URI(imageUrl).absoluteTo(baseURI).href();

                if (originalToAwsUrlMap[absoluteUrl]){
                    newUrl = generateAwsUrlFromAwsPath(originalToAwsUrlMap[absoluteUrl]);
                } else {
                    originalToAwsUrlMap[absoluteUrl] = filePath;
                }

                imageElement.setAttribute('src',newUrl);
            }
        })

        $html.find("base").remove();

        $html.find("a[href]").each(function(i,aref){
            var href = aref.getAttribute("href");
            if (href && !href.match(/^\s*javascript:/)){
                aref.setAttribute("target","_blank");
                aref.setAttribute("href", URI(href).absoluteTo(baseURI).href());
            }
        });

        $html.find("link[href]").each(function(i,link){
            var href = link.getAttribute("href");
            if (href && !href.match(/^\s*javascript:/)){
                var absoluteUrl = URI(href).absoluteTo(baseURI).href();
                link.setAttribute("href", generateAwsUrl(absoluteUrl).fullUrl);
            }
        })

        $html.find("iframe[src]").each(function(i,iframe){
            var src = iframe.getAttribute("src");
            if (src && !src.match(/^\s*javascript:/)){
                iframe.innerHTML = "";
                iframe.setAttribute("src", generateAwsUrl(src).fullUrl);
            }
        })

        $html.find("[style]").each(function(i,element){
            var css = element.getAttribute("style");
            var parsedCSS = parseCSSAndReplaceUrls(css, "");
            element.setAttribute("style", parsedCSS);
        })

        // we want to include the note id in this path, so the html won't get overridden by other people taking
        // notes on the same page.
        var escapedHtmlAwsPath = generateAwsUrl(currentLocation, true).awsPath;

        processedHtml = {awsPath: escapedHtmlAwsPath, html: newDoc.outerHTML};
        checkIfAllResourcesAreParsed()
    }

    function parseCSSAndReplaceUrls(css, resourceLocation){
        var importOrUrlRegex = generateImportOrUrlRegex();
        var newCss = css.replace(importOrUrlRegex, function(matchedGroup, capturedImportUrl, capturedUrl){
            if (capturedImportUrl){
                var absoluteUrl = URI(capturedImportUrl).absoluteTo(resourceLocation).absoluteTo(baseURI).href();
                styleSheetsLeft += 1
                getCssAndParse(absoluteUrl);
                return "@import url('" + generateAwsUrl(capturedImportUrl).fullUrl + "')";
            }else{
                // get rid of spaces, just in case
                capturedUrl = capturedUrl.replace(" ","");
                // ignore data urls
                if (capturedUrl.match(/^data:/)){
                    return matchedGroup
                }
                var newUrlAndFilePath = generateAwsUrl(capturedUrl);
                var newUrl = newUrlAndFilePath.fullUrl;
                var filePath = newUrlAndFilePath.awsPath;
                var absoluteUrl = URI(capturedUrl).absoluteTo(resourceLocation).absoluteTo(baseURI).href();
                if (originalToAwsUrlMap[absoluteUrl]){
                    newUrl = generateAwsUrlFromAwsPath(originalToAwsUrlMap[absoluteUrl]);
                } else {
                    originalToAwsUrlMap[absoluteUrl] = filePath;
                }
                return "url("+newUrl+")";
            }
        });
        if (resourceLocation != "") {
            resourceLocation = URI(resourceLocation).absoluteTo(baseURI).href();
        }

        var awsPathForCss = generateAwsUrl(resourceLocation).awsPath

        if (awsPathForCss){
            processedStyleSheets[awsPathForCss] = newCss;
            styleSheetsLeft -= 1;
            console.log(styleSheetsLeft, "requests left");
            checkIfAllResourcesAreParsed();
        } else{
            // it's a style attribute or style tag, just return the new css
            return newCss
        }
    }

    function getCssAndParse(cssLocation){
        BackgroundRequests.getCss(cssLocation)
        .then(function(resp){
            parseCSSAndReplaceUrls(resp, cssLocation);
        })
        .fail(function(){
            console.log("error loading resource");
            checkIfAllResourcesAreParsed();
        })
    }

    function checkIfAllResourcesAreParsed(){
        if ((styleSheetsLeft == 0) && processedHtml){
            BackgroundRequests.sendSiteData({
                html: processedHtml,
                isIframe: isIframe,
                processedStylesheets: processedStyleSheets,
                originalToAwsUrlMap: originalToAwsUrlMap,
                noteId: noteId
            })
            .then(function(resp){
                if (!isIframe && resp.archiveLocation) {
//                    new DownloadStatusChecker(
//                        resp.archiveLocation,
//                        tabId,
//                        noteId,
//                        clientSideId
//                    );
                }
            })
            .fail(function(){
                console.log("server broke!");
            })
        }
    }

    function generateAwsUrl(url, includeNoteId){
        if (url == ""){
            return false
        }
        // get rid of leading httpX://
        path = url.replace(/^\w+:\/\//,"");
        // get rid of leading slashes
        path = path.replace(/^\/+/,"");
        // convert colons and such to underscores
        path = path.replace(/[^-_.\/[:alnum:]]/g,"_");
        // get rid of hash
        path = path.replace(/#/g,"");

        var pathInParts = path.split(".");
        var extensionWithQuery = pathInParts.slice(1).pop() || "";
        var query = extensionWithQuery.split("?")[1] || "";
        var extension = extensionWithQuery.split("?")[0];

        if (extension.indexOf("/") > -1) {
            extension = ""
        }

        var hostWithUnderscores = (new URI(baseURI)).host().replace(/\./, "_");

        pathInParts.pop();
        var path_wo_extension = pathInParts.join(".");
        var shortPathWoExtension = path_wo_extension.slice(0,90) +  "_" + query.slice(0,10);
        shortPathWoExtension = shortPathWoExtension.replace(/\/+$/g,"");
        shortPathWoExtension = shortPathWoExtension.replace(/\.\./g,"");
        shortPathWoExtension = shortPathWoExtension.replace(/\/\//g,"/");

        if (shortPathWoExtension[0] === "/"){
            shortPathWoExtension =  hostWithUnderscores + shortPathWoExtension;
        } else {
            shortPathWoExtension = hostWithUnderscores + "/" + shortPathWoExtension;
        }
        var shortPath;
        if (extension) {
            shortPath = shortPathWoExtension + "." + extension;
        } else {
            shortPath = shortPathWoExtension;
        }


        if (includeNoteId) {
            console.log("path wo ext", shortPathWoExtension);
            console.log("ext", extension);
            console.log("path ext", shortPath)
        }

        var escapedShortPath = $.map(shortPath.split("/"),function(sect,i){ return encodeURIComponent(sect) }).join("/");

        if(includeNoteId) {
            shortPath = String(noteId) + "/" + shortPath;
            escapedShortPath = String(noteId) + "/" + escapedShortPath;
        }

        var newLocation = generateAwsUrlFromAwsPath(escapedShortPath);
        return {fullUrl: newLocation, awsPath: shortPath};
    }

    function generateAwsUrlFromAwsPath(path){
        //remove trailing slash
        return AWSBase + "/" + path.replace(/\/\s*$/,"");
    }

    function generateImportOrUrlRegex(){
        //@import\s+(?:url\()?["|']?([\w+-\._~:\/\?\#\[\]@!\$&*\+,=%]+)["']?\)?\s?;
        var importTagMatcherWithUrl = "@import\\s+(?:url\\()?";            //matches "@import url(" or "@import"
        var beginingQuoteMatcher = '["|\']?';                       //matches ' or " or nothing
        var urlMatcherForImport = "([\\w+-\\._~:\\/\\?\\#\\[\\]@!\\$&*\\+,=%]+)";  //matches any set of valid url characters
        var endMatcher = '["\']?\\)?\\s*'                               //matches ), "), '), ', " or nothing, followed by ;
        var importRegex = importTagMatcherWithUrl+beginingQuoteMatcher+urlMatcherForImport+endMatcher

        //url\(["']?([\w+-\._~:\/\?\#\[\]@!\$&'\(\)*\+,;=%]+)["']?\)
        var urlRegex = "url\\([\"']?([\\w+-\\._~:\\/\\?\\#\\[\\]@!\\$\\&\\*\\+,;=%]+)[\"']?\\)"

        var importOrUrlRegex = new RegExp("(?:" + importRegex + "|" + urlRegex + ")","g");
        return importOrUrlRegex
    }
}
