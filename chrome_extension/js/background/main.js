domain = "http://localhost:3000";
domain_name = "localhost";
resourceDownloaderAddress = "http://localhost:3000";
//resourceDownloaderAddress = "http://gentle-atoll-5058.herokuapp.com";
//domain = "http://www.webtrails.co";
//domain_name = "webtrails.co";

// Demo mode only runs on flashback.com
if (!window.FLASH_DEMO_MODE) {
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            if (request.resolveUrls) {
                console.log("resolving urls")
                var resolver = new UrlResolver(request.resolveUrls, sender.tab.id);
                resolver.resolve();

                if (!request.resolveUrls.iframe){
                    console.log("sending message to iframes")
                    chrome.tabs.sendRequest(sender.tab.id, { resolveIframeUrls: request.resolveUrls});
                } else {
                    console.log("message sent to iframes, now getting parse requests from all iframes");
                }
            }
        }
    );

    chrome.runtime.onMessageExternal.addListener(
        function(request, sender, sendResponse) {
            if (request.logInFromWebsite) {
                console.log("getting a request to log in from the website");
                signIn(request.logInFromWebsite);
            }
        }
    );
}
function sendSignOutMessageToAllTabs(){
    sendMessageToAllTabs({"logOutAllTabs":"logitout!"});
}

function sendSignInMessageToAllTabs(){
    LocalStorageTrailAccess.getExtensionInitializationData().done(function(initObject) {
        sendMessageToAllTabs({"logInAllTabs":{
            authToken: initObject.authToken,
            startingTrailId: initObject.currentTrailId,
            trailsObject: initObject.trails
        }})
    })
}

function sendMessageToAllTabs(message){
    chrome.windows.getAll({populate: true}, function(windows){
        $.each(windows,function(index,window){
            $.each(window.tabs, function() {
                chrome.tabs.sendRequest(this.id, message);
            });
        })
    } )
}



