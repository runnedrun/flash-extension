console.log("ajax_fns loaded");

Requests = {
    baseUrl: "http://localhost:3000",
    addAcceptHeader: function(xhr, ajaxRequest) {
        xhr.setRequestHeader("Accept","application/json");
    },

    saveNote: function (note) {
        console.log("note is ", note);
        $.ajax({
            url: Requests.baseUrl + "/note",
            type: "post",
            data: {
                "note":  note
            },
            beforeSend: Requests.addAcceptHeader,
            success: function(resp){
                $(document).trigger({
                    type: "noteIdReceived",
                    noteDetails: {
                        noteId: resp.id,
                        clientSideId: resp.clientSideId,
                    }
                });
            }
        })
    },

    deleteNote: function(note, callback) {
        $.ajax({
            url: Requests.baseUrl + "/note/delete",
            type: "post",
            beforeSend: Requests.addAcceptHeader,
            data: {
                "id": note.id
            },
            success: function(resp) {
                callback && callback(resp)
            },
            error: function(){ butterBarNotification("Failed to delete note, please try again") }
        });
    },

    updateNoteText: function(newComment, id, callback) {
        $.ajax({
            url:  Requests.baseUrl + "/note/update",
            type: "post",
            beforeSend: Requests.addAcceptHeader,
            data: {
                "id" : id,
                "hint": newComment
            },
            success: function(e) { console.log("note saved"); callback(e) }
        });
    }
}
