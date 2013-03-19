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

module.exports.handler = function(config) {
	if(config.file_writer.enabled) {
		var writer = new DiskWriter(config.file_writer);

		return(function(data) {
			data.map(function(yam) {
	      
	      	// process data in the respose depending on its type
	      	if(yam.data) {
	      		// not all messages have data to process
	      		if(yam.data.type == "message") {
	      			writer.write(yam.data);
	      		}
        	}
    	});
	});
	}
	else {
		return(function(data) { /* do nothing */});
	}
}