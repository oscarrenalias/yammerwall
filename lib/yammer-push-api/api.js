/**
 * This module implements the Yammer Bayeux push-based API, described here: https://developer.yammer.com/api/realtime.html.
 *
 * Every time new data is received from the API, the provided callback function will be called with the raw data; it is up
 * to client code to process the responses accordingly.
 *
 * TODO: clean up and refactor most of the code, as it currently is one looong single function with several embedded
 * callbacks
 */
var https = require('https'),
    log = require('winston');

/**
 * @param oautToken A valid Yammer OAuth 2.0 token
 * @param options An object with the following attributes:
 *  type = "all", "topic", "group"
 *  topic = name of the topic to follow
 *  group = name of the group to follow
 */
exports.react = function(oauthToken, options, callback) {
    var globalRequestId = 1;

    if(options.type == "all") 
        url = "/api/v1/messages.json";
    else if(options.type == "topic") 
        url = "/api/v1/messages/about_topic/" + options.topic + ".json";
    else if(options.type == "group") 
        url = "/api/v1/messages/in_group/" + options.group + ".json";

    var options = {
        host: 'www.yammer.com',
        path: url + '?access_token=' + oauthToken,
        headers: { "Authorization": "Bearer " + oauthToken }
    }

    var request = https.request(options, function(response) {
        log.debug("Retrieving meta real-time information");
        data = "";
        response.on("data", function(chunk) {
            if(response.statusCode == 200) {
                if(chunk.toString().trim() != "") {
                    data += chunk;
                }   
            }
            else {
                log.debug("No data was processed because of status code " + response.statusCode);
            }
        });

        response.on("end", function() {
            log.debug("*** Performing handshake ***");
            // process the response from yammer
            var responseObj = JSON.parse(data);
            // look for the meta structure
            rtURI = responseObj.meta.realtime.uri;
            rtChannelId = responseObj.meta.realtime.channel_id;
            rtAuthToken = responseObj.meta.realtime.authentication_token;

            log.debug("Real time URI = " + rtURI);
            log.debug("Channel Id = " + rtChannelId);
            log.debug("Authorizationt token = " + rtAuthToken);

            log.debug("Connecting to real time API at " + rtURI + " with token " + rtAuthToken);

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
                log.debug('Handshake request response code: ' + res.statusCode);
                res.on('data', function (chunk) {

                    log.debug("*** Performing subscription ***");

                    var data = JSON.parse(chunk);

                    // extract the client id
                    var clientId = data[0].clientId;
                    log.debug("We will use client id = " + clientId);

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

                    log.debug("Subscription request data = " + JSON.stringify(subscribeData));
                    
                    var subscribeRequest = https.request(subscribeOptions, function(res) {
                        tmpData = ""; 
                        log.debug("Subscription request response code: " + res.statusCode);
                        res.on("data", function(chunk) {
                            tmpData += chunk;
                        });
                        res.on("end", function() {
                            // handle the subscription response
                            var subscriptionResponse = JSON.parse(tmpData);
                            log.debug("Subscription response: " + tmpData);

                            var doConnection = function() {
                                log.debug("*** Performing connection ***");
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
                                    log.debug("Waiting for data...");
                                    data = "";
                                    res.on("data", function(chunk) {
                                        data += chunk;
                                    });

                                    res.on("end", function() {
                                        log.debug("The response was = " + data);
                                        var connectionResponse = JSON.parse(data);
                                        if(connectionResponse[0].advice) {
                                            // there was no message data, so we should wait
                                            log.debug("No data received; waiting 10 seconds");                                        
                                        }
                                        else {
                                            // there was post data
                                            log.debug("There was some data!");
                                            // send the data to the callback function
                                            callback(connectionResponse);                                            
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
                log.debug("There was an error with the handshake request: " + e.message);
            });

            log.debug(JSON.stringify(handshakeRequestData));

            handshakeRequest.write(JSON.stringify(handshakeRequestData));
            handshakeRequest.end();

        });
    });
    request.end();    

}