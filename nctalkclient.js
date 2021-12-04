const EventEmitter = require("events");
const https = require("https");
// const http = require("http");

const TalkAccess = require("./nctalkaccess");
const TalkCapabilities = require("./nctalkcapabilities");
const TalkRooms = require("./nctalkrooms");
const TalkConversation = require("./nctalkconversation");

const packageDetails = require('./package.json');


// Test Code

// const private = require("../.private_keys.js");

// const nchttp = new TalkAccess(https, {
//     server: private.talkcredentials.server,
//     user: private.talkcredentials.user,
//     pass: private.talkcredentials.pass,
//     port: private.talkcredentials.port
// });

// const capabilities = new TalkCapabilities(nchttp);


// capabilities.get(() => {
//     this.DebugLog("get capabilities done");
//     const roomlist = new TalkRooms(nchttp, capabilities);
//     roomlist.get(() => {
//         this.DebugLog("get roomlist done");
//         const conversation = new TalkConversation(nchttp, capabilities, roomlist.roomlist[2]);
//         conversation.SendMessage("DIES IST EIN TEST", () => {
//             this.DebugLog("SendMessage done")
//             conversation.SetListenMode(true);
//             conversation.WaitNewMessages((messages) => {
//                 this.DebugLog(messages);
//             });
//         });
//     });

// });


/*
TODO:
Add timemout configuration parameter for nextcloud talk timeout (heartbeat) and http connection timeout

Ideas for the future:
group list attribute for every room to send multicast message to multiple rooms belonging to one group
smarthome user gets a set of "botfather" functions as an alternative (password protected) way to configure this adapter - to create/organize new rooms/groups
Add filter to allow only nctalk group and/or 1to1 conversation types to be Used
New 1to1/group conversation will automatically be joined (ListenModeActive=true) either password protected or after request sent to the nextcloud talk admin was approved
*/
class Talkclient extends EventEmitter {

    constructor(options) {
        super();
        this.state = "INIT";
        this.state_info = undefined;
        this.on("Eventloop", this._Eventloop);

        // Todo: Add check for options
        this.server = options.server;
        this.user = options.user;
        this.pass = options.pass;
        this.port = options.port;

        this.debug = options.debug;

        this.nchttp = new TalkAccess(https, {
            server: options.server,
            user: options.user,
            pass: options.pass,
            port: options.port
        });

    }

    start(delay) {
    //this.emit("Eventloop","START");
        this._EventloopTrigger(`START nctalkclient ${packageDetails.version}`, delay);
    }

    GetOwnActorIdLowerCase() {
    // actorId = user name - haven't found anything about this in the nextcloud spreed (talk) documenation
        return this.user.toLowerCase();
    }

    RoomListenMode(token, active) {
        const conversation = this._GetConversionfromToken(token);

        if (conversation)
            conversation.SetListenMode(active);

    }

    SendMessage(token, msg) {
        const conversation = this._GetConversionfromToken(token);

        if (conversation) {
            conversation.SendMessage(msg, () => {
                this.DebugLog("SendMessage done");
            });
        }
    }

    ErrorLog(msg) {
        //global.ErrorLog(msg);
        this.emit("Error", msg);
    }

    DebugLog(msg) {
        //global.DebugLog(msg);
        if (this.debug == true) {
            this.emit("Debug", msg);
        }
    }

    /* @param {string} text - Text to send
  * @param {boolean|int} [asReply] - Defaults to true. Sends Text as Reply (with quote)
  *                                  If int: Sends only if X new messages in between
  * @returns {fetch}
  */
    // message.reply = (text, asReply) => {
    //    if (message.isReplyable && asReply !== false) {
    //        if (Number.isSafeInteger(asReply)) {
    //            const diff = channel.lastKnownMessageId - message.id;
    //            return this.sendText(text, message.token, diff >= asReply ? message.id : 0);
    //        } else {
    //            return this.sendText(text, message.token, message.id);
    //        }
    //    }

    _GetConversionfromToken(token) {
        for (const idx_c in this.conversation) {
            if (this.conversation[idx_c].roominfo.token == token)
                return this.conversation[idx_c];
        }
        return undefined;
    }

    _CreateConversation() {
    // for each element in listofrooms create Conversation Obj
    // An option would be to move this to the rooms instance
    // but as the plan is to create talk independet group instances with flexible 1to1 and 1tomany communication
    // idea here is that
    // we will see how to best handle this here
        const listofrooms = this.rooms.getlistofrooms();
        for (const key in listofrooms) {
            this.conversation[key] = new TalkConversation(this, this.nchttp, this.capabilities, listofrooms[key]);
        }
    }

    _EventloopTrigger(event, timeout) {

        if (timeout) {
            setTimeout((function (event) {
                this.emit("Eventloop", event);
            }).bind(this), timeout, event);
        } else {
            this.emit("Eventloop", event);
        }
    }

    // Statemachine eventloop
    _Eventloop(event) {
        this.DebugLog(event);

        // QUESTION: In case of an error do the complete sequence ? in the unlikely case nextcloud was updated and API version changed ?
        // QUESTION: Check in the background for new rooms and automaticlly add and join them?

        // State machine handles startup and receiving new messages of active marked conversations
        switch (this.state) {
            case "INIT":
                // First get capabilities - needed to get supported API version and build proper urls

                this.DebugLog("Get capabilities");

                this.state = "WAIT";

                this.capabilities = new TalkCapabilities(this.nchttp);
                this.capabilities.get((retcode, res) => {
                    this.DebugLog(res.body);
                    if (retcode == "OK") {
                        this.state = "CAPABILITIES_DONE";
                    }
                    else {
                        this.state = "ERROR";
                        this.state_info = { retcode: retcode, res: res };
                    }
                    this._EventloopTrigger("Get capabilities done");
                });

                break;
            case "CAPABILITIES_DONE":
                // Once Capabilites are done - let's get the rooms/conversations of the user

                this.DebugLog("Get Rooms");

                this.state = "WAIT";

                // check for pre-condition capabilities are available
                if (this.capabilities === undefined) {
                    this.state = "ERROR";
                    this.state_info = "Get Rooms - capabilities missing";
                    this._EventloopTrigger("Get rooms done");
                    break;
                }

                this.rooms = new TalkRooms(this.nchttp, this.capabilities);
                this.rooms.fetch((retcode, res) => {

                    this.DebugLog(res.body);

                    if (retcode == "OK") {
                        this.conversation = [];

                        // We have the infos about all chat rooms of the smarthome user
                        // now create conversation instances which handles waitmsg/sendmsg
                        this._CreateConversation();

                        this.state = "WAIT_CHAT_MSG";
                        this.emit("Ready", this.rooms.getlistofrooms());
                    }
                    else {
                        this.state = "ERROR";
                        this.state_info = { retcode: retcode, res: res };
                    }

                    this._EventloopTrigger("Get rooms done");
                });
                break;


            case "WAIT_CHAT_MSG":
                for (const idx_c in this.conversation) {
                    this.conversation[idx_c].WaitNewMessages((retcode, res) => {

                        if (retcode == "OK") {
                            if (res !== undefined) {
                                // New message arrived
                                this.DebugLog(res);
                                this.emit("Message_" + this.conversation[idx_c].roominfo.token, res);
                                this._EventloopTrigger("WaitNewMessages done");

                            } else {
                                this.ErrorLog("WaitNewMessages OK but res is undefined!");
                                this.state = "ERROR";
                                this.state_info = { retcode: retcode, res: res };
                                this._EventloopTrigger("WaitNewMessages unkown Error");
                            }
                        }
                        else if (retcode == "NOMSG") {
                            this.DebugLog(res);
                            this._EventloopTrigger("WaitNewMessages done");
                        } else if (retcode == "ERROR") {
                            // Don't get in ERROR state report it and retry until connection is back or aborted
                            // Typically two types of error - server is not reachable
                            // or nextcloud talk didn't send any heartbeat usually every 30sec
                            this.ErrorLog(res);
                            this.emit("Error", res);
                            this._EventloopTrigger("WaitNewMessages Error", 30000);
                        } else {
                            this.state = "ERROR";
                            this.state_info = { retcode: retcode, res: res };
                            this._EventloopTrigger("WaitNewMessages unknown Error");
                        }
                    });

                }
                break;

            case "WAIT":
                // WAIT Do nothing
                this.DebugLog("WAIT");
                break;
            case "ERROR":
                // Report Error then do nothing
                this.emit("Error", this.state_info);
                this.state = "END";
                break;
            case "END":
                // Do nothing
                break;
            default:
                break;
        }

    }
}

module.exports = Talkclient;
