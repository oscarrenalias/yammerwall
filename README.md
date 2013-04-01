yammer-push-node
================

Small Node.js application that uses the Yammer real-time push API (https://developer.yammer.com/api/realtime.html) to retrieve the contents of the "All company" feed, a single topic or a group and displays them as a stream of asynchronous updates in the browser, in a way that the application can be used as part of Yammer dashboards or in an walls/screen in events (a "Yammer wall").

Requirements
============
* Node 0.8.x or newer is required to run the application.
* A valid OAuth 2.0 token from Yammer
* An application key and secret, which can be obtained from http://www.yammer.com/client_applications/new
* A MongoDB database for basic analytics

How it works
============
The application opens a single connection to the Yammer Push API using an specified OAuth 2.0 token instead of opening one new connection per user in order to save resources, and this connection to the API will be used to listen to the "All company" feed. 



 process, so they need to be part of a network to be able to use the application (but please see the TODO section)

Authentication
==============
The application supports configurable authentication providers; out of the box, 3 are provided:

* Yammer's OAuth 2.0 provider
* Basic user/password authentication
* No authentication

OAuth
-----
In order to enable OAuth authentication, set ```config.auth.type``` to ```oauth``` and ensure that the application's callback URL is correctly configured in Yammer. The callback URL will be ```http://server.com/auth/yammer/callback``.

If you have already configured your Yammer client secret and application key, no further configuration is necessary.

Basic authentication
--------------------
Basic authentication uses a single user and password combination to allow access to the application.

To enable basic authentication, set ```config.auth.type``` to ```basic``` and set the user and password:

```
exports.auth = {
	basic: {
		user: "testUser",
		password: "testPassword",
	}	
}
```

No authentication
-----------------
Set ```config.auth.type``` to ```none``` to disable authentication. 

Filtering
=========
Three types of filtering for yams are supported:

* All - equivalent to the "All company" feed
* Topic - listen to a single topic/hashtag
* Group - listen to messages from a single group

All
---
Coming soon.

Topic
-----
Coming soon.

Group
-----
Coming soon.

MongoDB
=======
As of the release on 26.03.2013, the application supports storing all yams in a MongoDB database so that some basic analytics can be 
calculated via Mongo map-reduce jobs (most active users, most active topics, most active threads, client statistis, etc). Stored yams
are also used to return the most recent yams to clients upon first connection.

Please note that MongoDB is not required if you deactivate the support for analytics by setting ```exports.analytics.enabled``` to ```false``` in config.js. 

MongoDB can be easily installed in the local workstation for local development, please update config.js with the correct
connection string. Alternatively, use Vagrant to provision a local Virtual Machine with MongoDB: https://github.com/oscarrenalias/vagrant.

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
* OWN_NETWORK: the name of your Yammer network (used to validate that users belong to the right network as part of the login process)

Use ```heroku config:add``` to set suitable values for your configuration.

When running in Heroku, the MongoLab add-on is a very convenient way to provision a MongoDB database.

Changelog
=========
* 26.03.2013, Major new release with improved functionality as well as support for analytics and storage of yams with MongoDB
* 24.09.2012, Initial version

TODO
====
Current list of items to be implemented, in no particular order:

* The current layout is not very flexible for mobile devices, probably a stylesheet specific for mobiles should be created