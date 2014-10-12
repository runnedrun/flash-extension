var HtmlProcessor = function(siteInfo) {
    this.processAndSubmitCurrentPage = function() {
        resolveUrlsAndSubmit(getCurrentSiteHtml());
    }

    function resolveUrlsAndSubmit(cleanHtml){
        var stylesheetHrefs = [];
        var stylesheetContents = [];
        var htmlAttributes = {};

        var realHtmlAttributes = document.querySelector("html").attributes

        for (var attr, i = 0, attrs = realHtmlAttributes, l = attrs.length; i<l; i++){
            attr = attrs.item(i)
            htmlAttributes[attr.nodeName] = attr.nodeValue;
        }

        var styleSheets = document.styleSheets;
        var styleSheetList = [].slice.call(styleSheets, 0);
        for (i in styleSheetList) {
            var styleSheet = styleSheetList[i];
            var owner = styleSheet.ownerNode
            if (owner.nodeName == "LINK"){
                stylesheetHrefs.push(owner.href);
            }else if(owner.nodeName == "STYLE"){
                stylesheetContents.push(owner.innerHTML);
            }
        }

        siteInfo.html                   = cleanHtml;
        siteInfo.stylesheetHrefs        = stylesheetHrefs;
        siteInfo.stylesheetContents     = stylesheetContents;
        siteInfo.currentLocation        = window.location.href;
        siteInfo.baseUri                = document.baseURI;
        siteInfo.htmlAttributes         = htmlAttributes;

        if (!window.FLASH_DEMO_MODE) {
            chrome.runtime.sendMessage({
                resolveUrls: siteInfo
            }, function(response){
                console.log("html submitting for resolution");
            });
        }
    }

    function removeNodes(nodes) {
        var nodeList = [].slice.call(nodes, 0)
        for (i in nodeList) { nodeList[i].remove() }
    }

    function removeAllUnusedTags(htmlClone) {
        removeNodes(htmlClone.querySelectorAll("script"));
        removeNodes(htmlClone.querySelectorAll("noscript"));
        removeNodes(htmlClone.querySelectorAll("meta"));
    }

    function removeStylingFromWtHighlights(htmlClone) {
        var highlights = htmlClone.querySelectorAll("wthighlight")
        for (i in highlights) {
            highlights[i].setAttribute && highlights[i].setAttribute("style", "");
        }
    }

    function getCurrentSiteHtml(){
        var htmlElement = document.querySelector('html');
        var htmlClone = htmlElement.cloneNode(true);
        removeAllUnusedTags(htmlClone);
        removeStylingFromWtHighlights(htmlClone);
        return htmlClone.outerHTML;
    }
}