var YammerGroupsAPI = require('../lib/groups.js'),
	vows = require('vows'),
	assert = require('assert'),
	config = require('./testconfig'),
	groupsClient = new YammerGroupsAPI(config)

var sampleId = 0;

vows.describe('Yammer groups API').addBatch({
	'when requesting all groups': {
		topic: function() {
			groupsClient.list({} /* no parameters */, this.callback);
		},
		'we get a list of groups with a least one element': {
			topic: function(error, data) {
				assert.ifError(error);
				assert.isArray(data);
				assert.isTrue(data.length > 0);	

				groupsClient.get(data[0].id, this.callback);
			},
			'and we can successfully retrieve one of them': function(error, data) {
				assert.ifError(error);
			}
		}
	}
}).export(module);