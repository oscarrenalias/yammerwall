yammer-poll-node
================

Small NodeJs application that users the Yammer push API to retrieve the contents of the "whole company" feed. The API uses the cometd/Bayeux protocol to deliver data, and can be read here: https://developer.yammer.com/api/realtime.html.

In order to run it, you need Node.js 0.6.15 or newer, and a valid OAuth 2.0 access token provisioned from Yammer (the application will not generate our automatically for you). Once you've got the token, edit config.js and replace the placeholder with the actual token.

Then simply run "node yammer-push.js" and point your browser to http://localhost:8001/ to receive updates from your Yammer network as they occur.