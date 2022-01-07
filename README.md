# Node.js Client for nextcloud talk API
To be used in an iobroker adapter

[![NPM version](https://img.shields.io/npm/v/nctalkclient.svg)](https://www.npmjs.com/package/nctalkclient)
[![Downloads](https://img.shields.io/npm/dm/nctalkclient.svg)](https://www.npmjs.com/package/nctalkclient)

[![NPM](https://nodei.co/npm/nctalkclient.png?downloads=true)](https://nodei.co/npm/nctalkclient/)


## Install

```bash
npm install nctalkclient
```

## Test / How to use
Idea is to create a smarthome / bot user in your nextcloud instance and administrate there the different rooms.
All type of rooms will be shown in the listofrooms of the onReady event.
Select the one to be used for the test. Make sure the room is "readOnly: 0".
Adjust your server url, user, password and port.

```js
const https = require("https");
const http = require("http");

const NextcloudTalk = require("nctalkclient");

// Use for test purposes - test server with self signed certs...
//process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;


const Talk = new NextcloudTalk({
  server: private.talkcredentials.server,
  user: private.talkcredentials.user,
  pass: private.talkcredentials.pass,
  port: private.talkcredentials.port,
  debug: true
});


Talk.start(500);


// Talk client is ready and has fetched all required information / data to handle conversations
Talk.on("Ready", (listofrooms) => {

  // show all details about all rooms of the user
  console.log(listofrooms);

  let testroom_index = 2;
  console.log("Talk is ready make " + listofrooms[testroom_index].token + " active");
  Talk.RoomListenMode(listofrooms[testroom_index].token, true);
  Talk.SendMessage(listofrooms[testroom_index].token, "OnReady Test Nachricht");

    // Only receives Messages from the conversation with token
    Talk.on("Message_" + listofrooms[testroom_index].token, (msg) => {
      // msg is an array, usually with the length one, in the test we just take the first...
      if (msg[0].actorId.toLowerCase() == Talk.GetOwnActorIdLowerCase()) {
        console.log("OWN MESSAGEEVENT " + msg[0].message);
      }
      else {
        console.log("MESSAGEEVENT " + msg[0].message);
        if (msg[0].message == "time") {
          Talk.SendMessage(msg[0].token, new Date().toLocaleString());
        }
        if (msg[0].message == "test") {
          Talk.SendMessage(msg[0].token, "test reply");
        }
      }
    });

  Talk.ShareFile(listofrooms[2].token, "/talk/test123.jpg");


});

// Error
Talk.on("Error", (e) => {
  console.log("Error Event ", e);
});

// Debug
Talk.on("Debug", (e) => {
  console.log("Debug Event ", e);
});

```

## listofrooms array example

```bash
Get Rooms
[
  {
    id: 11,
    token: '#####',
    type: 4,
    name: 'smartHome',
    displayName: 'Talk updates ✅',
    objectType: '',
    objectId: '',
    participantType: 3,
    participantFlags: 0,
    readOnly: 1,
    hasPassword: false,
    hasCall: false,
    canStartCall: true,
    lastActivity: 1613668924,
    lastReadMessage: 303,
    unreadMessages: 0,
    unreadMention: false,
    isFavorite: false,
    canLeaveConversation: true,
    canDeleteConversation: false,
    notificationLevel: 2,
    lobbyState: 0,
    lobbyTimer: 0,
    lastPing: 1636411357,
    sessionId: '0',
    guestList: '',
    lastMessage: {
      id: 303,
      token: '######',
      actorType: 'bots',
      actorId: 'changelog',
      actorDisplayName: 'Talk updates ✅',
      timestamp: 1613668924,
      message: '- You can now change your camera and microphone while being in a call',
      messageParameters: [],
      systemMessage: '',
      messageType: 'comment',
      isReplyable: false,
      referenceId: ''
    }
  },
  {
    id: 13,
    token: '####',
    type: 2,
    name: 'SmartHome',
    displayName: 'SmartHome',
    objectType: '',
    objectId: '',
    participantType: 1,
    participantFlags: 0,
    readOnly: 0,
    hasPassword: false,
    hasCall: false,
    canStartCall: true,
    lastActivity: 1636543411,
    lastReadMessage: 4949,
    unreadMessages: 0,
    unreadMention: false,
    isFavorite: false,
    canLeaveConversation: true,
    canDeleteConversation: true,
    notificationLevel: 2,
    lobbyState: 0,
    lobbyTimer: 0,
    lastPing: 1636489404,
    sessionId: '0',
    guestList: '',
    lastMessage: {
      id: 4949,
      token: '#####',
      actorType: 'users',
      actorId: 'smartHome',
      actorDisplayName: 'smartHome',
      timestamp: 1636543411,
      message: 'Klingel ist aus',
      messageParameters: [],
      systemMessage: '',
      messageType: 'comment',
      isReplyable: true,
      referenceId: ''
    }
  },
  {
    id: 12,
    token: '######',
    type: 1,
    name: 'name',
    displayName: 'name',
    objectType: '',
    objectId: '',
    participantType: 1,
    participantFlags: 0,
    readOnly: 0,
    hasPassword: false,
    hasCall: false,
    canStartCall: true,
    lastActivity: 355434,
    lastReadMessage: 33443,
    unreadMessages: 0,
    unreadMention: false,
    isFavorite: false,
    canLeaveConversation: true,
    canDeleteConversation: false,
    notificationLevel: 1,
    lobbyState: 0,
    lobbyTimer: 0,
    lastPing: 1636488989,
    sessionId: '0',
    guestList: '',
    lastMessage: {
      id: 5056,
      token: '#####',
      actorType: 'users',
      actorId: 'smartHome',
      actorDisplayName: 'smartHome',
      timestamp: 1636703054,
      message: 'Haustuer:(12708) [s] detected:car:99% person:98%  PIR\n' +
        'https://image',
      messageParameters: [],
      systemMessage: '',
      messageType: 'comment',
      isReplyable: true,
      referenceId: ''
    }
  }
]
```

