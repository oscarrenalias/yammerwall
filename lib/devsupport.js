/**
 * Adds test routes to the application
 */

function generateTestYamData() {
  // dummy user
  var user = { 
    id: "dummy", 
    mugshot_url: "https://mug0.assets-yammer.com/mugshot/images/48x48/pqxxGf4c4tr51dFRJlHksFrBVL9gGtc5",
    name: "test-user",
    full_name: "Test User",
    type: "user"
  };
  // and dummy message
  var testBody = "This is a test <b>yam</b>"
  var yam = { 
    sender_id: user.id, 
    body: { 
      rich: testBody,
      parsed: testBody,
      plain: testBody        
    },
    replied_to_id: "replied-to-id",
    created_at:(new Date()).toISOString(),
    id: "random-id"
  };

  return({user: user, yam: yam});
}

function generateTestAttachment(yam) {
  var attachment = {
    download_url:"https://www.yammer.com/accenture.com/api/v1/uploaded_files/5787919/version/4362639/download/photo-1.jpg",
    type:"image",
    path:"538/5787919/photo-1.jpg",
    owner_id:yam.sender_id,
    content_type:"image/jpeg; charset=binary",
    created_at:"2012/07/06 09:52:23 +0000",
    id:5787919,
    full_name:"photo-1",
    size:197478,
    original_name:"photo-1.jpg",
    web_url:"https://www.yammer.com/accenture.com/uploaded_files/5787919",
    y_id:5787919,
    large_icon_url:"https://c64.assets-yammer.com/images/file_icons/types/picture_orange_79x102_icon.png",
    overlay_url:"https://www.yammer.com/accenture.com/api/v1/uploaded_files/5787919/version/4362639/preview/photo-1.jpg",
    description:"",
    owner_type:"user",
    uuid:null,
    preview_url:"https://www.yammer.com/accenture.com/api/v1/uploaded_files/5787919/version/4362639/preview/photo-1.jpg",
    image:{
     size:197478,
     thumbnail_url:"https://www.yammer.com/accenture.com/api/v1/uploaded_files/5787919/version/4362639/thumbnail",
     url:"https://www.yammer.com/accenture.com/api/v1/uploaded_files/5787919/preview/photo-1.jpg"
    },
    privacy:"public",
    thumbnail_url:"https://www.yammer.com/accenture.com/api/v1/uploaded_files/5787919/version/4362639/thumbnail",
    small_icon_url:"https://c64.assets-yammer.com/images/file_icons/types/picture_orange_39x50_icon.png",
    url:"https://www.yammer.com/accenture.com/api/v1/uploaded_files/5787919",      
    name:"photo-1.jpg",
    last_uploaded_by_id:7342617
  };

  yam.attachments = [ attachment, attachment ]

  return(yam);
}

module.exports.configureDevRoutes = function(app, io) {
  app.get("/dev", function(req, res) {
    res.send('<a href="/dev/sendyam">Send yam</a><br/><a href="/dev/sendyam/attachment">Send yam with attachment</a>');
  });

  app.get("/dev/sendyam", function(req, res) {
    data = generateTestYamData();
    io.sockets.in("yammer").emit( "yam", {
      messages: [ data.yam ], 
      references: { 
        users: [ data.user ],
        threads: [],
        tags: [],
        topics: [],
        messages: []
      }
    });
    res.send('Done.<br/><a href="/dev">Back</a>');
  });

  app.get("/dev/sendyam/attachment", function(req, res) {
    data = generateTestYamData();
    data.yam = generateTestAttachment(data.yam);
    io.sockets.in("yammer").emit( "yam", {
      messages: [ data.yam ], 
      references: { 
        users: [ data.user, {
          type: "user",
          id: "sender-id",
          full_name: "Thread creator"
         } ],
        threads: [],
        tags: [],
        topics: [],
        messages: [ {
          type: "message",
          id: "replied-to-id",
          sender_id: "sender-id",
          body: {
            plain: "this is the plain body",
            rich: "this is the <b>rich</b> body",
            parsed: "this is the parsed body"
          }
        }]        
      }
    });
    res.send('Done.<br/><a href="/dev">Back</a>');
  });  
}