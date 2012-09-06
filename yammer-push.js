var express = require('express'),
    app = express.createServer(),
    io = require('socket.io').listen(app),
    port = process.env.PORT || 8081,
    credentials = require('./config.js'),
    yammerpush = require('./lib/yammer-push-api');

// Tell the Express framework where to find our static files and redirect / to index.html
app.use(express.static(__dirname + "/public"));
app.get("/", function(req, res) {
    res.redirect("/index.html");    
});  

// handling of socket.io connections
io.sockets.on('connection', function (socket) {
    console.log("New client added");
    socket.join('yammer');
});  

// extracts the list of users from the references section
var processUsers = function(references) {
    return(references.filter(function(item) {
        return(item.type == "user");
    }));
}
    
yammerpush.react(credentials.oauth_token, function(data) {
    // this callback is trigger every time there's new data from the API
    console.log("Callback triggered!");
    for(i=0; i<data.length; i++) {
        console.log("Processing response with id = " + data[i].id);
        // process data in the respose depending on its type
        if(data[i].data) {
            // not all messages have data to process
            if(data[i].data.type == "message") {

                io.sockets.in("yammer").emit(
                    "yam", { 
                        "messages": data[i].data.data.messages, 
                        "users": processUsers(data[i].data.data.references) 
                });
            }
            else {
                console.log("There was no message data to process");
            }                                                
        }
    }
});

// start the application **
app.listen(port);
console.log("Server started in port: " + port);