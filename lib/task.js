/*
 Wrapper around setInterval that allows to provide flexible recurrence definitions,
 and that returns a cancellable task
*/
function RecurringTask(callback, recurrence) {
	var time = 0;
	if(recurrence.unit == "ms")
		time = recurrence.time;
	else if(recurrence.unit == "s" || recurrence.unit == "sec" || recurrence.unit == "seconds")
		time = recurrence.time * 1000;
	else if(recurrence.unit == "m" || recurrence.unit == "minute" || recurrence.unit == "minutes")
		time = recurrence.time * 1000 * 60;
	else
		throw(Exception("Unrecognized time unit: " + recurrence.unit));

	var interval = setInterval(callback, time);

	// TODO: make the return value an event emitter, and emit the corresponding events for 
	// starting, stopping, and error (if that can even be caught)
	return({
		cancel: function() {
			clearInterval(interval);
		}
	})
}

module.exports.RecurringTask = RecurringTask