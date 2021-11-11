javascript nextcloud talk API http(s) client
To be used in an iobroker adapter

----------- Test / How to use -----------
const https = require("https");
const http = require("http");

const NextcloudTalk = require("nctalkclient");


// Create nextcloud talk client instance
const Talk = new NextcloudTalk({
    server: private.talkcredentials.server,
    user: private.talkcredentials.user,
    pass: private.talkcredentials.pass,
    port: private.talkcredentials.port
    });

// Start client with 500ms delay
Talk.start(500);

// Only receives Messages from the conversation with token w23krmfo
Talk.on("Message_w23krmfo",(msg) => {
  if(msg[0].actorId.toLowerCase() == Talk.GetOwnActorIdLowerCase()) {
    console.log("OWN MESSAGEEVENT " + msg[0].message);
  }
  else {
    console.log("MESSAGEEVENT " + msg[0].message);
    if(msg[0].message == "time") {
      Talk.SendMessage(msg[0].token, new Date().toLocaleString());
    }
    if(msg[0].message == "test") {
      Talk.SendMessage(msg[0].token, "test reply");
    }
  }
});

// Talk client is ready and has fetched all required information / data to handle conversations
Talk.on("Ready", (listofrooms) => {
  console.log("Talk is ready make " + listofrooms[2].token + " active");
  Talk.RoomListenMode(listofrooms[2].token, true);
  Talk.SendMessage(listofrooms[2].token, "OnReady Test Nachricht");
});

// Error
Talk.on("Error",(e) => {
  console.log("Error Event " + e);
});
