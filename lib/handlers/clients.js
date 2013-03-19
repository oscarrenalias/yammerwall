/*
 This module handles the normal "yammer wall" process, by receiving data from the API
 and pushing them to clients via socket.io
*/

// extracts the list of users from the references section
function processReferences(references) {
    return({
      users: references.filter(function(item) {
        return(item.type == "user");
      }),
      threads: references.filter(function(item) {
        return(item.type == "thread");
      }),
      messages: references.filter(function(item) {
        return(item.type == "message");
      }),
      tags: references.filter(function(item) {
        return(item.type == "tag");
      }),
      topics: references.filter(function(item) {
        return(item.type == "topic");
      })
    });    
}

module.exports.handler = function(config, app) {
    // initialize socket.io
    var io = require('socket.io').listen(app);

    // handling of socket.io connections
    io.sockets.on('connection', function (socket) {
        console.log("New client added");
        socket.join('yammer');
    });

    return(function(data) {
        // this callback is trigger every time there's new data from the API
        data.map(function(yam) {
            console.log("Processing response with id = " + /*data[i].id*/ yam.id);
            // process data in the respose depending on its type
            if(yam.data) {
                // not all messages have data to process
                if(yam.data.type == "message") {
                    io.sockets.in("yammer").emit(
                        "yam", 
                        { 
                          messages: yam.data.data.messages,
                          references: processReferences(yam.data.data.references)
                        }
                    );
                }
                else {
                    console.log("There was no message data to process");
                }                                                
            }
        });
    });
}