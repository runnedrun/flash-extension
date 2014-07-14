console.log("ajax_fns loaded");

Requests = {
    url: "http://localhost:5000",
    addAcceptHeader: function(xhr, ajaxRequest) {
        xhr.setRequestHeader("Accept","application/json");
    },

    saveNote: function (note) {
        console.log("note is ", note);
        $.ajax({
            url: Requests.url + "/note",
            type: "post",
            data: {
                "note":  note
            },
            beforeSend: Requests.addAcceptHeader,
            success: function(resp){
                $(document).trigger({
                    type: "noteIdReceived",
                    noteDetails: {
                        noteId: resp.note_id,
                        clientSideId: note.client_side_id
                    }
                });
            }
        })
    },

    deleteNoteRequest: function(note, callback) {
        $.ajax({
            url: Requests.url + "/note/delete",
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
            url:  Requests.url + "/note/update",
            type: "post",
            beforeSend: Requests.addAcceptHeader,
            data: {
                "id" : id,
                "comment": newComment
            },
            success: function(e) { console.log("note saved"); callback(e) }
        });
    }
}
