console.log("loaded iframe listener, document.domain is", document.domain);

var isTopFrame = false;
try {
    if (window.self.document == window.top.document) {
        isTopFrame = true
    }
} catch (e) {}
var isWtElement;
var headElement = document.querySelector("head");
if (headElement && !headElement.classList.contains("wt-element")) {
    isWtElement = false;
} else {
    isWtElement = true; // if we don't have a head element then it's an error frame, so we shouldn't save it
}


if (!isTopFrame && !isWtElement) {
    if (!window.FLASH_DEMO_MODE) {
        console.log("setting listener for iframe saving");
        chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
            if (request.resolveIframeUrls){
                console.log("checking if we need to parse this frame");
                var siteInfo = request.resolveIframeUrls;
                var frameLocation = window.location.href;

                if (!(siteInfo.current_location == frameLocation)){
                    console.log("parsing this frame");
                    processor = new HtmlProcessor(extend(siteInfo, {iframe:true}));
                    processor.processAndSubmitCurrentPage();
                }else{
                    console.log("top window, not sending message");
                }
            }
        })
    }
}


function extend(){
    for(var i=1; i<arguments.length; i++)
        for(var key in arguments[i])
            if(arguments[i].hasOwnProperty(key))
                arguments[0][key] = arguments[i][key];
    return arguments[0];
}