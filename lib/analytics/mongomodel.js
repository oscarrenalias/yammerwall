var mongo = require('mongodb'),
	log = require('winston'),
	Q = require('q'),
	_ = require('underscore');

var MongoModel = function(mongoUri) {
	this.mongoUri = mongoUri;
	// we memoize the result so that we only ever open one connection
	this.db = _.memoize(Q.nfbind(mongo.connect));
}

module.exports = MongoModel;

// returns a promise that can be chained
MongoModel.prototype.DB = function() {
	return(this.db(this.mongoUri, {}));
}

/**
 * Returns a promise that carries a collection inside
 */
MongoModel.prototype.getCollection= function(collectionName, callback) {
	return(this.DB().then(function(db) { return(db.collection(collectionName)) }))
} 

/**
 * Returns all documents
 */
MongoModel.prototype.all = function(collectionName) {
	var deferred = Q.defer();

	this.getCollection(collectionName).then(function(coll) { 
		coll.find().toArray(function(err,docs) { 
			if(err)
				deferred.reject(new Error(err))
			else {
				deferred.resolve(docs);
			}
		}) 
	})

	return(deferred.promise);
}

/**
 * Returns a single document based on the given criteria
 */
MongoModel.prototype.find = function(collectionName, criteria) {
	var deferred = Q.defer();
    this.getCollection(collectionName).then(function(coll) {
    	coll.findOne(criteria, function(err, result) {
    		if(err)
    			deferred.reject(new Error(err))
    		else {
    			if(result != null)
    				deferred.resolve(result)
    			else
    				deferred.reject(new Error("Document not found"))
    		}    			
    	})
    })

    return(deferred.promise);
}

/**
 * Stores a model entity in Mongo
 */
MongoModel.prototype.put = function(collName, model) {
	var deferred = Q.defer();
	this.getCollection(collName).then(function(coll) {
		coll.insert(model, { safe: true }, function(err, result) {
			if(err)
				deferred.reject(new Error(err))
			else
				deferred.resolve(result);
		})
	})

	return(deferred.promise);
}

MongoModel.prototype.upsert = function(collName, model, criteria) {
	var deferred = Q.defer();
	delete model["_id"];	// just in case, otherwise Mongo will fail complaining that it can't update existing _id
	this.getCollection(collName).then(function(coll) {
		coll.update(criteria, model, { upsert: true }, function(err, result) {
			if(err)
				deferred.reject(new Error(err))
			else
				deferred.resolve(result);
		})
	})

	return(deferred.promise);
}