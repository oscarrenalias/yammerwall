var util = require('util'),
	assert = require('assert'),
    YammerAPI = require('./base');

module.exports = YammerUserAPI;

function YammerUserAPI(config) {
    YammerAPI.call(this, config);
}
util.inherits(YammerUserAPI, YammerAPI);

YammerAPI.addMethods({ 
    list: {
        api: "/users.json",
        method: "get"
    },
    get: {
        api: function(id) { return("/users/" + id + ".json") }, 
        method: "get"
    },
    create: {
        api: "/topics.json",
        method: "post"
    },
    delete: {
        api: function(id) { return("/users/" + id + ".json")},
        method: "delete"
    },
    update: {
        api: function(id) { return("/users/" + id + ".json")},
        method: "put"
    }
}, YammerUserAPI);

YammerUserAPI.prototype.by_email = function(email, callback) {      
    this.doGet(this.baseUrl + '/users/by_email.json', { "email": email }, callback);    
}

YammerUserAPI.prototype.current = function(callback) {      
    this.doGet(this.baseUrl + '/users/current.json', {}, callback);    
}

YammerUserAPI.prototype.networks = function(callback) {
    this.doGet(this.baseUrl + "/networks/current.json", callback);
}