var https = require('https'),
    express = require('express'),
    app = express.createServer(),
    io = require('socket.io').listen(app),
    port = process.env.PORT || 8081,
    credentials = require('./config.js');

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

// https://www.yammer.com/api/v1/messages.json
var options = {
    host: 'www.yammer.com',
    path: '/api/v1/messages.json?access_token=' + credentials.oauth_token,
    headers: { "Authorization": "Bearer " + credentials.oauth_token }
}

var globalRequestId = 1;

var request = https.request(options, function(response) {
    console.log("*** Retrieving meta real-time information ***");
    data = "";
    response.on("data", function(chunk) {
    	if(response.statusCode == 200) {
    		if(chunk.toString().trim() != "") {
            	//var data = JSON.parse(chunk);
            	data += chunk;
        	}	
        }
    	else {
    		console.log("No data was processed because of status code " + response.statusCode);
    	}
    });

    response.on("end", function() {
        console.log("*** Performing handshake ***");
        // process the response from yammer
        var responseObj = JSON.parse(data);
        // look for the meta structure
        rtURI = responseObj.meta.realtime.uri;
        rtChannelId = responseObj.meta.realtime.channel_id;
        rtAuthToken = responseObj.meta.realtime.authentication_token;

        console.log("Real time URI = " + rtURI);
        console.log("Channel Id = " + rtChannelId);
        console.log("Authorizationt token = " + rtAuthToken);

        console.log("Connecting to real time API at " + rtURI + " with token " + rtAuthToken);

        // build the json data to be POSTed
        var handshakeRequestData = [];
        handshakeRequestData[0] = {
            "ext": { "token": rtAuthToken },
            "version": "1.0",
            "minimumVersion": "0.9",
            "channel": "/meta/handshake",
            "supportedConnectionTypes":["long-polling"],
            "id": globalRequestId
        }
        
        globalRequestId = globalRequestId + 1;

        var rtURIParts = require('url').parse(rtURI);
        var handshakeRequestOptions = {
            host: rtURIParts.host,
            path: rtURIParts.pathname,
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        }
        // and POST it
        var handshakeRequest = https.request(handshakeRequestOptions, function(res) {
            console.log('Handshake request response code: ' + res.statusCode);
            res.on('data', function (chunk) {

                console.log("*** Performing subscription ***");

                var data = JSON.parse(chunk);

                // extract the client id
                var clientId = data[0].clientId;
                console.log("We will use client id = " + clientId);

                // and subscribe
                var subscribeOptions = { 
                    host: rtURIParts.host, 
                    path: rtURIParts.pathname, 
                    method: "POST",
                    headers: { "Content-Type": "application/json" }
                };
                var subscribeData = [];
                subscribeData[0] = {
                    "channel": "/meta/subscribe",
                    "subscription": "/feeds/" + rtChannelId + "/primary",
                    "id": globalRequestId,
                    "clientId": clientId
                };
                globalRequestId = globalRequestId + 1;
                subscribeData[1] = {
                    "channel": "/meta/subscribe",
                    "subscription": "/feeds/" + rtChannelId + "/secondary",
                    "id": globalRequestId,
                    "clientId": clientId
                };               

                console.log("Subscription request data = " + JSON.stringify(subscribeData));
                
                var subscribeRequest = https.request(subscribeOptions, function(res) {
                    tmpData = ""; 
                    console.log("Subscription request response code: " + res.statusCode);
                    res.on("data", function(chunk) {
                        tmpData += chunk;
                    });
                    res.on("end", function() {
                        // handle the subscription response
                        var subscriptionResponse = JSON.parse(tmpData);
                        console.log("Subscription response: " + tmpData);

                        var doConnection = function() {
                            console.log("*** Performing connection ***");
                            var connectionOptions = {
                                host: rtURIParts.host, 
                                path: rtURIParts.pathname, 
                                method: "POST",
                                headers: { "Content-Type": "application/json" }                            
                            };
                            var connectionData = [];
                            connectionData[0] = {
                                "channel": "/meta/connect",
                                "connectionType": "long-polling",
                                "id": globalRequestId,
                                "clientId": clientId
                            };
                            globalRequestId = globalRequestId + 1;
                            var connectionRequest = https.request(connectionOptions, function(res) {
                                console.log("Waiting for data...");
                                data = "";
                                res.on("data", function(chunk) {
                                    data += chunk;
                                });

                                res.on("end", function() {
                                    console.log("The response was = " + data);
                                    var connectionResponse = JSON.parse(data);
                                    if(connectionResponse[0].advice) {
                                        // there was no message data, so we should wait
                                        console.log("No data received; waiting 10 seconds");                                        
                                    }
                                    else {
                                        // there was post data
                                        console.log("There was some data!");
                                        // broadcast to all connected clients
                                        
                                        for(i=0; i<connectionResponse.length; i++) {
                                            console.log("Processing response with id = " + connectionResponse[i].id);
                                            // process data in the respose depending on its type
                                            if(connectionResponse[i].data) {
                                                // not all messages have data to process
                                                if(connectionResponse[i].data.type == "message") {
                                                    var messages = connectionResponse[i].data.data.messages;
                                                    /*for(j=0; j<messages.length; j++) {
                                                        // process each message
                                                        io.sockets.in('yammer').emit(
                                                          'yam',  // message topic
                                                          { "type": "message", "message": messages[j] } // message body
                                                        );
                                                    }*/
                                                    io.sockets.in("yammer").emit(
                                                        "yam",
                                                        { "type": "messages", "messages": messages }
                                                    );
                                                }
                                                else {
                                                    console.log("There was no message data to process");
                                                }                                                
                                            }
                                        }                                        
                                    }

                                    setTimeout(doConnection, 10*1000)
                                });
                            });
                            connectionRequest.write(JSON.stringify(connectionData));
                            connectionRequest.end();                            
                        }

                        // call ourselves
                        doConnection();
                    });
                });
                subscribeRequest.write(JSON.stringify(subscribeData));
                subscribeRequest.end();                
            });
        });

        handshakeRequest.on("error", function(e) {
            console.log("There was an error with the handshake request: " + e.message);
        });

        console.log(JSON.stringify(handshakeRequestData));

        handshakeRequest.write(JSON.stringify(handshakeRequestData));
        handshakeRequest.end();

    });
});
request.end();

// start the application **
app.listen(port);
console.log("Server started in port: " + port);