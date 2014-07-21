console.log("Highlight manager loaded")

HighlightManager = function(trackedDoc) {
    console.log("initing highlight manager");
    var $doc = $(trackedDoc);
    var $body = $(trackedDoc.body);
    var commentCreator = new CommentCreator(trackedDoc);
    var mousedown = true;

    var currentCommentCreator;

    function possibleHighlightStart(e){
        console.log("possible highlight start")
        mouseDown = 1;
        if (($(e.target).closest(".webtrails").length == 0)){
            $doc.mouseup(function(){mouseDown = 0; highlightedTextDetect()});
        }
    }

    function highlightedTextDetect(){
        console.log("looking for highlighted text");
        $doc.unbind("mouseup");
        if (!rangy.getSelection().isCollapsed){
            console.log("adding the button");
            addComment(getHighlightedTextRange());
        }
    }

    function addComment(highlightedTextRange){
        currentCommentCreator = commentCreator.fromRange(0, highlightedTextRange);
    }

    function getHighlightedTextRange(){
        return rangy.getSelection().getRangeAt(0);
    }

    $doc.on("noteSubmitted", function(submittedEvent) {
        new Comment(trackedDoc, submittedEvent.noteDetail.hint, submittedEvent.noteDetail.clientSideId);
    });

    $doc.on("noteIdReceived", function(event) {
        new HtmlProcessor({
            noteId: event. noteDetails.noteId,
            clientSideId: event.noteDetails.clientSideId
        }).processAndSubmitCurrentPage();
    })

    this.watchDocument = function() {
        $doc.mousedown(function() {
            mouseDown=true;
        });
        $doc.mouseup(function(){
            mouseDown=false;
        });
        $doc.mousedown(possibleHighlightStart);
    }

    this.watchDocument();
}