module.exports = {
	map: function() {
		this.topics.map(function(topic) {
			emit(topic, 1)
		});
	},
	reduce: function(key, count) {
		return(Array.sum(count));
	},
	options: { out: { "replace": "top_topics", }}
}