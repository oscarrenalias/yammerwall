//
// A handful of helper methods related to strings.
//
define(function() {
  return({
    formatNumber: function( number, decimals, dec_point, thousands_sep ) {
      var n = number, c = isNaN(decimals = Math.abs(decimals)) ? 2 : decimals;
      var d = dec_point == undefined ? "," : dec_point;
      var t = thousands_sep == undefined ? "." : thousands_sep, s = n < 0 ? "-" : "";
      var i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", j = (j = i.length) > 3 ? j % 3 : 0;
      
      return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
    }, 

    formatSize: function(filesize) {
      if (filesize >= 1073741824) {
           filesize = this.formatNumber(filesize / 1073741824, 2, '.', '') + ' Gb';
      } else { 
        if (filesize >= 1048576) {
            filesize = this.formatNumber(filesize / 1048576, 2, '.', '') + ' Mb';
        } else { 
          if (filesize >= 1024) {
            filesize = this.formatNumber(filesize / 1024, 0) + ' Kb';
          } else {
            filesize = this.formatNumber(filesize, 0) + ' bytes';
          };
        };
      };
      return filesize;      
    },

    // does exact word matching in the given string
    matchWord: function(text, word) {
      // not very efficient, but it seems to work for now
      var match = text.split(/[\s,!;:?]+/).indexOf(word);
      console.log("text = " + text + ", word = " + word + ", match = " + match);
      return(match != -1);
    }
  });
});
