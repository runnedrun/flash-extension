BackgroundRequests = {
    baseUrl: "http://localhost:3000",

    getCss: function(cssLocation) {
        return $.ajax({
            url: cssLocation,
            type: "get",
            crossDomain: true,
            dataType: "text"
        })
    },

    sendSiteData: function(siteData) {
        return $.ajax({
            url: BackgroundRequests.baseUrl  + "/resource_downloader",
            type: "post",
            data: siteData,
            beforeSend: function(req) { req.setRequestHeader("Accept", "application/json") },
        })
    }
}