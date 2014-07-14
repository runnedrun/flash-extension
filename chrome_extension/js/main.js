String.prototype.splice = function( idx, rem, s ) {
    return (this.slice(0,idx) + s + this.slice(idx + Math.abs(rem)));
};

$(function() {
	rangy.init();
	initializeAutoResize()
    Highlights = new HighlightManager(document);
})

function butterBarNotification(message) {
    var butterBarContainer = $("<div></div>").css({
        position: "fixed",
        top: "0px",
        "z-index": "2147483647",
        width: "100%",
        "text-align": "center"
    })
    var butterBar = $("<div>" + message + "</div>").css({
        "background-color": "#666666",
        color: "white",
        display: "inline",
        "font-family": "arial, sans-serif",
        padding: "5px"
    });
    butterBarContainer.append(butterBar);
    $(document.body).prepend(butterBarContainer);
    butterBar.hide();
    butterBar.fadeIn(400, function(){
        setTimeout(function(){
            butterBar.fadeOut(400, function(){
                butterBar.remove();
            });
        },2000);
    });
    console.log("butter bar is shown!", butterBar);
}