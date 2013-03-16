module.exports = {
	map: function() {
		emit({
			"id": this.thread.id,
			"body": this.thread.body,
			"web_url": this.thread.web_url,
		}, 1)
	},
	reduce: function(key, count) {
		return(Array.sum(count));
	},
	options: { out: { "replace": "top_threads", }}		
}