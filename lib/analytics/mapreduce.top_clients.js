module.exports = {
	map: function() { emit(this.client_type, 1); },
	reduce: function(key, count) {
		return(Array.sum(count));
	},
	options: { out: { "replace": "top_clients" }}
}