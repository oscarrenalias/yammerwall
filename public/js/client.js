(function() {
  $(document).ready(function() {
    console.log("Application initialized");

    var socket = io.connect('http://' + location.hostname);  

    // callback for new socket.io data  
    socket.on('yam', function(data) {
      var yams = data.messages;
      var users = data.users;
      for(i=0; i < yams.length; i++) {
        var yam = yams[i];
        var newYam = ui.formatYam(yam, users.filter(function(user) {
          return(user.id == yam.sender_id);
        })); 

        // insert the new content into the dom and force it to slide down
        $("ul#yams").prepend(newYam);
        $("ul#yams li:first").hide().slideDown("slow");        
        // attach the timestamp auto-update to the one that was inserted (the ones below already have it)
        $("ul#yams li:first abbr.timeago").timeago();
        // for images, attach fancybox
        $("ul#yams li:first .attachment-image a").fancybox({
          overlayShow: true,
          overlayOpacity: 0.85,
          overlayColor: "#222",
          titleShow: true,
          transitionIn: "none",
          transitionOut: "none"
        });
      }

      $('.waiting').hide();
    });  
  });

  // UI-related functionality
  var ui = {

    yamTemplate: '\
      <li class="yam yam-container shadow"> \
        <div class="yam-mugshot"> \
          <img src="{{user.mugshot_url}}" alt="mugshot" /> \
        </div> \
        <div class="yam-body"> \
          {{{yam.body.rich}}} \
        </div> \
        {{#yam.attachments}} \
        <div class="yam-attachments"> \
          {{#image}} \
            <div class="yam-attachment yam-attachment-image"> \
              <a href="{{image.url}}" alt="{{image.original_name}}" title="{{full_name}}"> \
                <img src="{{image.thumbnail_url}}" alt="Thumbnail" /> \
              </a> \
            </div> \
          {{/image}} \
          {{^image}} \
            <div class="yam-attachment"> \
              <a href={{url}} alt="Attachment"> \
                {{...}} \
              </a> \
            </div> \
          {{/image}} \
          <div class="yam-attachment-info"> \
            {{full_name}}, {{#asSize}}{{size}}{{/asSize}}\
          </div> \
        </div> \
        {{/yam.attachments}} \
        <div class="yam-info"> \
          Posted by <span class="yam-user">{{user.full_name}}</span>, \
          <abbr class="timeago" title="{{yam.created_at}}">{{#asDate}}{{yam.created_at}}{{/asDate}}</abbr> \
        <div> \
      </li>',

    formatNumber: function( number, decimals, dec_point, thousands_sep ) {
      var n = number, c = isNaN(decimals = Math.abs(decimals)) ? 2 : decimals;
      var d = dec_point == undefined ? "," : dec_point;
      var t = thousands_sep == undefined ? "." : thousands_sep, s = n < 0 ? "-" : "";
      var i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", j = (j = i.length) > 3 ? j % 3 : 0;
      
      return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
    }, 

    formatSize: function(filesize) {
      if (filesize >= 1073741824) {
           filesize = ui.formatNumber(filesize / 1073741824, 2, '.', '') + ' Gb';
      } else { 
        if (filesize >= 1048576) {
            filesize = ui.formatNumber(filesize / 1048576, 2, '.', '') + ' Mb';
        } else { 
          if (filesize >= 1024) {
            filesize = ui.formatNumber(filesize / 1024, 0) + ' Kb';
          } else {
            filesize = ui.formatNumber(filesize, 0) + ' bytes';
          };
        };
      };
      return filesize;      
    },

    formatYam: function(yam, users) {
      var user = "";
      
      // to prevent a situation where the user was not found
      if(users.length==0)
        user = { "mugshot_url": "no-link" }
      else
        user = users[0];

      var yamHtml = jQuery.mustache(ui.yamTemplate, { 
        yam: yam, 
        user: user, 
        asSize: function() {
          return function(text, render) {
            return(ui.formatSize(render(text)));
          }
        },
        asDate: function() {
          return function(text, render) {
            return(jQuery.timeago(render(text)));
          }
        }
      });
      return(yamHtml);
    }
  }
})();