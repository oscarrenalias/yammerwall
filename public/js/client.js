(function() {
  $(document).ready(function() {
    console.log("Application initialized");

    $('a.live-tipsy').tipsy({
      live: true,
      fade: true,
      gravity: $.fn.tipsy.autoNS
    });

    eventQueue = new Bacon.Bus();

    // handy function for doing the filtering
    eventQueue.ofType = function(type) {
      return(eventQueue.filter(function(message) {
        return(message.message == type);
      }));      
    }  

    // trigger a custom event in our application bus every time the textbox with the filter
    // is updated
    $('#filter').
      asEventStream("keyup").
      skipDuplicates().
      throttle(1500).
      filter(function(data) {
        // do not generate a new event if the value did not change (this can happen if
        // the user presses arrow keys or any other arrow that generates the keyup event
        // but does not change the content of the field)
        return(app.filter != $('#filter').val())
      }).
      subscribe(function(data) {
        eventQueue.push({ message: "filter-update", data: data})
      });

    // add a tooltip to the filter field
    $('#filter').popover();

    // callback for new socket.io data  
    var socket = io.connect('http://' + location.hostname);  
    socket.on('yam', function(data) {
      eventQueue.push({ message: "new-yam", data: data });
    });

    // The server may send more than one yam in the single socket.io message,
    // so we will split that into an array of a single message each, keeping the same
    // references, metadata, etc; doing so we can implement message filtering much
    // more easily
    var splitMessages = function(message) {
      var splitData = message.data.messages.map(function(yam) {
        var data = message;
        data.data.messages = [ yam ];
        return(data);
      });

      return(Bacon.sequentially(0, splitData));
    }

    // wire the events to receivers
    eventQueue.ofType("new-yam").flatMap(splitMessages).filter(app.filterMessage).subscribe(app.newYam);
    eventQueue.ofType("filter-update").subscribe(app.updateFilter); 
    eventQueue.ofType("new-yam-added").take(1).subscribe(app.hideWaitingMessage);   
  });

  var helpers = {
    formatNumber: function( number, decimals, dec_point, thousands_sep ) {
      var n = number, c = isNaN(decimals = Math.abs(decimals)) ? 2 : decimals;
      var d = dec_point == undefined ? "," : dec_point;
      var t = thousands_sep == undefined ? "." : thousands_sep, s = n < 0 ? "-" : "";
      var i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", j = (j = i.length) > 3 ? j % 3 : 0;
      
      return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
    }, 

    formatSize: function(filesize) {
      if (filesize >= 1073741824) {
           filesize = helpers.formatNumber(filesize / 1073741824, 2, '.', '') + ' Gb';
      } else { 
        if (filesize >= 1048576) {
            filesize = helpers.formatNumber(filesize / 1048576, 2, '.', '') + ' Mb';
        } else { 
          if (filesize >= 1024) {
            filesize = helpers.formatNumber(filesize / 1024, 0) + ' Kb';
          } else {
            filesize = helpers.formatNumber(filesize, 0) + ' bytes';
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
  }

  // UI-related functionality
  var app = {

    // current filter
    filter: $('#filter').val() || "",

    // Hides the waiting message when a new yam or separator is added to the timeline
    hideWaitingMessage: function() {
      $('.waiting').hide();
    },

    // Filters messages to determine if they need to be pushed as events (and therefore be
    // made visible in the timeline). 
    // It simply checks the current value of the filter text field and uses String.search
    // to determine if the string is the message bobdy; if not, ignore it
    // TODO: tags in yammer may also be part of the metadata and not appear in the message body!
    filterMessage: function(message) {
      // check if the current filter matches any content in the message
      if(app.filter == "") {
        console.log("Filter is empty; accepting all messages");
        return(true);
      }

      // is it a reverse filter?
      var isReverse = (app.filter.charAt(0) === "!")
      if(isReverse)
        var toFilter = app.filter.substr(1, app.filter.length)
      else
        var toFilter = app.filter

      var yam = message.data.messages[0];
      var keep = (helpers.matchWord(yam.body.plain, toFilter));
      if(isReverse) // TODO: is there a more straightforward way to do this?
        keep = !keep

      console.log("processing message: " + yam.id + ", filter: " + toFilter + ", reverse: " + isReverse + " - result: " + keep);
      return(keep);
    },

    // event handler that updates the current filter
    updateFilter: function(v) {    
        app.filter = $('#filter').val();
        console.log("New filter value = " + app.filter); 
        
        var text = "Filter: " + app.filter;
        if(app.filter.charAt(0) === "!")
            text = "Filter: NOT " + app.filter.substr(1, app.filter.length);
        if(app.filter == "")
          text = "Showing all";
              
        // if the top-most item in the list is already a separator, let's not add
        // a new one but change its content to avoid an ugly-looking list of separator
        // after separator
        var firstItemSelector = "ul#yams li:first";
        if($(firstItemSelector).hasClass('separator')) {
          $(firstItemSelector).text(text);
        } 
        else {
          // add as a new item to the list
          $('ul#yams').prepend("<li class='separator'>" + text + "</li>");
          $(firstItemSelector).hide().slideDown("slow");          
        }     

        // TODO: could we do this with an event?
        //$('.waiting').hide();
        eventQueue.push({message: "new-yam-added", data:undefined})
    },

    // event handler that handles new yams
    newYam: function(message) {
      var data = message.value.data;

      var yams = data.messages;
      var users = data.references.users;
      for(i=0; i < yams.length; i++) {
        var yam = yams[i];
        var newYam = app.formatYam(yam, app.findReference(data.references.users, "user", yam.sender_id), data.references); 

        // insert the new content into the dom and force it to slide down
        $("ul#yams").prepend(newYam);
        $("ul#yams li:first").hide().slideDown("slow");        
        // attach the timestamp auto-update to the one that was inserted (the ones below already have it)
        $("ul#yams li:first abbr.timeago").timeago();
        // for images, attach fancybox
        $("ul#yams li:first .yam-attachment-image a").fancybox({
          overlayShow: true,
          overlayOpacity: 0.85,
          overlayColor: "#222",
          titleShow: true,
          transitionIn: "none",       
          transitionOut: "none"
        });
      }

      // TODO: could we do this with an event?
      eventQueue.push({message: "new-yam-added", data:yam});
    },

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
              <a href={{download_url}} alt="Attachment"> \
                {{#small_icon_url}}<img src="{{small_icon_url}}" alt="Icon" />{{/small_icon_url}} \
                {{full_name}} \
              </a> \
            </div> \
          {{/image}} \
          <div class="yam-attachment-info"> \
            {{full_name}}, {{#asSize}}{{size}}{{/asSize}}\
          </div> \
        </div> \
        {{/yam.attachments}} \
        <div class="yam-info"> \
          Posted by <span class="yam-user">{{user.full_name}}</span> \
          <abbr class="timeago" title="{{yam.created_at}}">{{#asDate}}{{yam.created_at}}{{/asDate}}</abbr> \
          {{#inReplyTo}} \
            <a href="#" class="live-tipsy" title="{{reply_to_message.body.plain}}">in reply to</a> {{reply_to_user.full_name}} \
          {{/inReplyTo}} \
          . <a href="{{yam.web_url}}">See conversation in Yammer</a>. \
        <div> \
      </li>',

    findReference: function(references, type, id) {
      return(references.filter(function(item) {
        return(item.type == type && item.id == id)
      }));
    },

    formatYam: function(yam, users, references) {
      var user = "";
      
      // to prevent a situation where the user was not found
      if(users.length==0)
        user = { "mugshot_url": "no-link" }
      else
        user = users[0];

      var yamHtml = jQuery.mustache(app.yamTemplate, { 
        yam: yam, 
        user: user, 
        asSize: function() {
          return function(text, render) {
            return(helpers.formatSize(render(text)));
          }
        },
        asDate: function() {
          return function(text, render) {
            return(jQuery.timeago(render(text)));
          }
        },
        inReplyTo: function() {
          // too many hoops needed to get to the name of the user to whom we're replying...
          return function(text, render) {
            var threads = app.findReference(references.messages, "message", yam.replied_to_id);
            var content = "";
            if(threads.length == 1) {
              var replyToMessage = threads[0];
              var creators = app.findReference(references.users, "user", replyToMessage.sender_id);
              if(creators.length == 1) {
                return(jQuery.mustache(text, { reply_to_message: replyToMessage, reply_to_user: creators[0]}));
              }                
              else
                return("");
            }
            return("");
          }
        }
      });
      return(yamHtml);
    }
  }
})();