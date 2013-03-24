//
// Static module that returns a map of the exposed events
//
define(function() {
    return({
		NewYam: "new-yam",
		NewYamAdded: "new-yam-added",
		FilterUpdate: "filter-update",
		Connected: "connected",
		Reconnected: "reconnected",
		Disconnected: "disconnected",
		ConnectFailed: "connect_failed",
		Reconnecting: "reconnecting",
		ReconnectFailed: "reconnect_failed"
    });
});
