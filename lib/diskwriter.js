//
// Stores all messages from the push API in disk
//
var fs = require('fs');

function DiskWriter(config) {
	this.config = config;	
	this.folder = config.folder;

  	console.log("Enabling file writer. Writing data to folder: " + this.folder);	
}

DiskWriter.prototype.write = function(message) {
	// write the file using the current unit timestamp as the file name	
	var targetFile = this.folder + "/" + Date.now() + ".json";
	fs.writeFile(targetFile, JSON.stringify(message), function(err) {
		if(err) {
			console.log("There was an error saving file: " + targetFile + ": " + err);
		}
	})
}

module.exports = DiskWriter;