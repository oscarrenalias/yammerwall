yammer-poll-node
================

Small NodeJs application that uses the Yammer push API to retrieve the contents of the "All company" feed. The API uses the cometd/Bayeux protocol to deliver data, and its specifications can be read here: https://developer.yammer.com/api/realtime.html.

In addition to exploring the capabilities of the Yammer push API, this application can be used as part of Yammer dashboards or in an overhead screen in events.

How it works
============
The application opens a single connection to the Yammer Push API using an specified OAuth 2.0 token instead of opening one new connection per user in order to save resources, and this connection to the API will be used to listen to the "All company" feed. If any kind of filtering is needed (e.g. filter for a specific topic) it will be implemented within the application.

Every time new data is received from the API, it will be pre-processed (not all data received from the API is meant for users) and will be delivered to connected clients via Socket.io. 

Users will be authenticated using the OAuth 2.0 process, so they need to be part of a network to be able to use the application (but please see the TODO section) 

Requirements
============
* Node 0.6.x or newer is required to run the application.
* A valid OAuth 2.0 token from Yammer
* An application key and secret, which can be obtained from http://www.yammer.com/client_applications/new

Running locally
===============
After cloning the repository, use NPM to retrieve all dependencies:

```npm install```

Then, edit config.js and add your OAuth 2.0 credentials as well as your application key and secret.

Finally, the application can be run:

```node app.js```

By default the application runs in port 8081: http://localhost:8081

Running in Heroku
=================
The "heroku" branch of this repository is ready to be deployed to Heroku. 

In this branch, configuration data is no longer configured via config.js but via the following Heroku environment variables:

* OAUTH_TOKEN: your OAuth 2.0 token
* YAMMER_APPLICATION_KEY: your Yammer application key
* YAMMER_APPLICATION_SECRET: your Yammer application secret

Use ```heroku config:add``` to set suitable values for your configuration.

TODO
====
* Currently the application is not checking if the static OAuth 2.0 token and the user who just logged in belong to the same network, which means that users could potentially see data from another network even if they do not belong to it. This is a potential security risk and will be addressed shortly, though it should not be a problem for "closed" deployments

* Currenty only the "All company" feed can be viewed, but it would be interesting to have the application display the feed for a specific hasthtag or group, for e.g. dashboards or during events identified by a hashtag. Will be implemented shortly.

* The current user interface and layout is not very pretty

* The code in the yammer-push-api module is not very clean or pretty, and should be refactored