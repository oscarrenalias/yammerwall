module.exports = {
	// Emit one key with year-month-day-hour so that we can look at activity over an hourly period
	// TODO: maybe we should normalize timestamps to be all in UTC (even though it seems that they are already in UTC...)
	map: function() { 
		// Yammer dates are like: "2013/03/16 23:07:52 +0000", it's easier to parse them manually
		var dateRegexp = /^(\d+)\/(\d+)\/(\d+) (\d+):\d+:\d+ ([\+\-]\d+)$/
		var matches = this.created_at.match(dateRegexp);
		if(matches) {
			emit({
				year: matches[1],
				month: matches[2],
				day: matches[3],
				hour: matches[4],
				offset: matches[5],
				s: matches[1] + "-" + matches[2] + "-" + matches[3] + " " + matches[4] + ":00:00 " + matches[5]
			}, 1)
		}
	},
	reduce: function(key, count) {
		return(Array.sum(count));
	},
	options: { out: { "replace": "hourly_activity" }}
}