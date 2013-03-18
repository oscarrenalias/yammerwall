module.exports = {
	map: function() {
		if(this.thread) {
			emit({
				"id": this.thread.id,
				"body": this.thread.body,
				"web_url": this.thread.web_url,
				"content_excerpt": this.thread.content_excerpt
			}, 1)
		}
	},
	reduce: function(key, count) {
		return(Array.sum(count));
	},
	options: { out: { "replace": "top_threads", }}		
}