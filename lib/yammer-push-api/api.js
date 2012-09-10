/**
 * This module implements the Yammer Bayeux push-based API, described here: https://developer.yammer.com/api/realtime.html.
 *
 * Every time new data is received from the API, the provided callback function will be called with the raw data; it is up
 * to client code to process the responses accordingly.
 *
 * TODO: 
 * - clean up and refactor most of the code, as it currently is one looong single function with several embedded
 * callbacks
 * - lengthen the timeout for the connection so that it stays open for longer than 30 seconds
 */
var https = require('https'),
    util = require('util'),
    events = require('events'),
    log = require('winston');

module.exports = YammerPushAPI;

function YammerPushAPI(oauthToken, config) {
    events.EventEmitter.call(this);

    this.oauthToken = oauthToken;
    this.config = config || { type: "all" };
    this.requestId = 1;    

    var endpointUrl = function() {
        if(config.type == "all")
            return("/api/v1/messages.json");
        else if(config.type == "topic") 
            return("/api/v1/messages/about_topic/" + config.topic + ".json");
        else if(config.type == "group") 
            return("/api/v1/messages/in_group/" + config.group + ".json");
        else {
            log.warn("Invalid endpoint type '" + config.type + "', using 'all' as default");
            return("/api/v1/messages.json");
        }            
    }    

    this.endpointUrl = endpointUrl();    
}

util.inherits(YammerPushAPI, events.EventEmitter);

YammerPushAPI.prototype.nextRequestId = function() {
    this.requestId = this.requestId + 1;
    return(this.requestId);
}

YammerPushAPI.prototype.start = function() {
    // 'this' seems to change down there, let's keep a reference to ourselves so that we can call class methods
    var self = this;

    log.debug("Starting connection with endpointUrl = " + self.endpointUrl + " token = " + self.oauthToken);

    var options = {
        host: 'www.yammer.com',
        path: self.endpointUrl + '?access_token=' + self.oauthToken,
        headers: { "Authorization": "Bearer " + self.oauthToken }
    }

    var request = https.request(options, function(response) {
        log.debug("Retrieving meta real-time information");
        var data = "";
        response.on("data", function(chunk) {
            if(chunk.toString().trim() != "") {
                data += chunk;
            }   
        });

        if(response.statusCode != 200) {
            log.error("The Yammer endpoint returned status code " + response.statusCode + ", cannot continue");
            self.emit("fatal", response);
            return;
        }            

        response.on("end", function() {
            log.info("Performing handshake");
            // process the response from yammer
            var responseObj = JSON.parse(data);
            // look for the meta structure
            var realTimeParams = {
                uri: responseObj.meta.realtime.uri,
                uriParts: require('url').parse(responseObj.meta.realtime.uri),
                channelId: responseObj.meta.realtime.channel_id,
                token: responseObj.meta.realtime.authentication_token
            };            

            log.debug("Real time URI: " + realTimeParams.uri);
            log.debug("Channel Id: " + realTimeParams.channelId);
            log.debug("Authorization token: " + realTimeParams.token);

            // data to be POSTed with the realtime request information
            var handshakeRequestData = [{
                "ext": { "token": realTimeParams.token },
                "version": "1.0",
                "minimumVersion": "0.9",
                "channel": "/meta/handshake",
                "supportedConnectionTypes":["long-polling"],
                "id": self.nextRequestId()
            }];        

            var requestOptions = {
                host: realTimeParams.uriParts.host,
                path: realTimeParams.uriParts.pathname,
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            }
            // and POST it
            var handshakeRequest = https.request(requestOptions, function(res) {
                res.on('data', function (chunk) {

                    log.info("Handshake successful. Performing subscription.");

                    var data = JSON.parse(chunk);

                    // extract the client id
                    var clientId = data[0].clientId;
                    log.debug("We will use client id = " + clientId);

                    // and subscribe
                    var subscribeOptions = requestOptions;
                    var currentRequestId = self.nextRequestId();
                    var subscribeData = [{
                            "channel": "/meta/subscribe",
                            "subscription": "/feeds/" + realTimeParams.channelId + "/primary",
                            "id": currentRequestId,
                            "clientId": clientId
                        },{
                            "channel": "/meta/subscribe",
                            "subscription": "/feeds/" + realTimeParams.channelId + "/secondary",
                            "id": currentRequestId,
                            "clientId": clientId
                        }
                    ]
                    
                    log.debug("Subscription request data = " + JSON.stringify(subscribeData));
                    
                    var subscribeRequest = https.request(subscribeOptions, function(res) {
                        var subscriptionResponseData = ""; 
                        res.on("data", function(chunk) {
                            subscriptionResponseData += chunk;
                        });
                        res.on("end", function() {
                            // handle the subscription response
                            var subscriptionResponse = JSON.parse(subscriptionResponseData);
                            log.debug("Subscription response: " + subscriptionResponseData);

                            log.info("Performing connection");
                            var doConnection = function() {
                                var data = "";
                                log.debug("Opening new connnection");    
                                var connectionOptions = requestOptions;
                                var connectionData = [{
                                    "channel": "/meta/connect",
                                    "connectionType": "long-polling",
                                    "id": self.nextRequestId(),
                                    "clientId": clientId
                                }];
                               
                                var connectionRequest = https.request(connectionOptions, function(res) {
                                    log.debug("Processing data...");
                                    data = "";
                                    res.on("data", function(chunk) {

                                        data += chunk;
                                        // can it be parsed? If so, send it right away
                                        try {
                                            var connectionResponse = JSON.parse(data);
                                            if(connectionResponse[0].advice) {    
                                                log.debug("There was no useful client data");
                                            }
                                            else {            
                                                // there was post data
                                                log.debug("Sending data to listeners: " + data);
                                                // send the data we just received to the listeners
                                                self.emit("data", connectionResponse);
                                                // reset the buffer
                                                data = "";
                                            }
                                        } catch(error) {
                                            log.debug("JSON content was not parseable, waiting for more data: " + data);
                                        }
                                    });

                                    res.on("end", function() {
                                        data = "";
                                        log.debug("Connection closed; opening again");
                                        setTimeout(doConnection, 0)
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
                log.error("There was an error with the handshake request: " + e.message);
                self.emit("fatal", e);
            });

            log.debug(JSON.stringify(handshakeRequestData));

            handshakeRequest.write(JSON.stringify(handshakeRequestData));
            handshakeRequest.end();

        });
    });
    request.end();     
}