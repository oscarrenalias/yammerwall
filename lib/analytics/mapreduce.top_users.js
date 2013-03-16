/*
 Calculates user posting activity
 */
module.exports = {
	map: function() {
		if(this.sender) {
			emit({
				"id": this.sender.id,
				"name": this.sender.name, 
				"full_name": this.sender.full_name,
				"job_title": this.sender.job_title,
				"mugshot_url": this.sender.mugshot_url,
				"web_url": this.sender.web_url
			}, 1);
		}
	},
	reduce: function(key, count) {
		return(Array.sum(count));
	},
	options: { out: { "replace": "top_users", }}
}