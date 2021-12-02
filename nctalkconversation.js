



class TalkConversation {

    constructor(talkclient, nchttp, capabilities, roominfo) {
        this.nchttp = nchttp;
        this.capabilities = capabilities;
        this.roominfo = roominfo;

        this.talkclient = talkclient;

        this.lastmsgid = roominfo.lastReadMessage;
        this.listenactive = false;    // We start with active listing off
        this.waitmsgongoing = false;

        // Build url based on capabilities
        let conversation_feature = capabilities.CheckFeature("chat-v");

        if (conversation_feature == "chat-v2") {
            this.chatVersion = 2;
        }
        else {
            this.chatVersion = 1;
        }

        // So far only url API Version 1 exists...
        //   this.url = `/ocs/v2.php/apps/spreed/api/v1/chat/${this.roominfo.token}?lookIntoFuture=1&includeLastKnown=0&format=json&lastKnownMessageId=${this.lastmsgid}&setReadMarker=1`;

    }

    _geturl(func) {
        switch (func) {
            case "SendMessage":
                return `/ocs/v2.php/apps/spreed/api/v1/chat/${this.roominfo.token}?format=json`;
            case "WaitNewMessages":
                // https://nextcloud-talk.readthedocs.io/en/latest/chat/ - chat version chat-v2 doesn't impact url it added support for rich object strings
                return `/ocs/v2.php/apps/spreed/api/v1/chat/${this.roominfo.token}?lookIntoFuture=1&setReadMarker=1&format=json&lastKnownMessageId=${this.lastmsgid}`;

        }
    }

    SendMessage(comment, Callback) {

        let message = JSON.stringify({ message: comment, replyTo: 0 });
        this.nchttp.RequestfromHost("POST", this._geturl("SendMessage"), message, (retcode, res) => {
            switch (retcode) {
                case "OK":
                    Callback();
                    break;
                case "ERROR":
                    break;
            }
        });

    }

    SetListenMode(active) {
        this.listenactive = active;
    }

    WaitNewMessages(Callback) {
        if ((this.listenactive == true) && (this.waitmsgongoing == false)) {
            this.waitmsgongoing = true;  // Only one WaitNewMessages per conversation
            this.talkclient.DebugLog("WaitNewMessages IN " + this.roominfo.token);
            this.nchttp.RequestfromHost("GET", this._geturl("WaitNewMessages"), null, (retcode, res) => {

                //console.log("DUMP",this.talkclient,this.nchttp);
                // console.log("totalSocketCount",this.nchttp._http.globalAgent.totalSocketCount);
                // console.log("Wait Counter ",this.waitcnt,this.roominfo.token,retcode,res);

                // WaitNewMessages is done - do this before any callbacks are called in case the trigger a new WaitNewMessage
                if(this.waitmsgongoing == false)
                {
                    this.talkclient.DebugLog("Callback called with waitmsgongoing = false!", this.roominfo.token, retcode, res);
                }

                //console.log(this.roominfo.token, this.nchttp._http.globalAgent.sockets);
                //console.log(this.roominfo.token, this.nchttp);
                this.talkclient.DebugLog("WaitNewMessages OUT " + this.roominfo.token + " " + this.waitmsgongoing);
                this.waitmsgongoing = false;

                switch (retcode) {
                    case "OK":
                        let messages = undefined;

                        if (res.headers["x-chat-last-given"] == undefined) {
                            // x-chat-last-given is undefined in nextcloud talk timeout message
                            // https://nextcloud-talk.readthedocs.io/en/latest/chat/#receive-chat-messages-of-a-conversation
                            Callback("NOMSG", "WaitNewMessages - Talk timeout empty reply after no new message was received");
                            break;
                        }
                        else {
                            try {
                                messages = JSON.parse(res.body).ocs.data;
                                this.lastmsgid = res.headers["x-chat-last-given"];
                            }
                            catch {
                                Callback("ERROR", `ERROR reply string is not a JSON ${res.body}`);
                                break;
                            }
                        }

                        Callback("OK", messages);
                        break;
                    case "ERROR":
                        Callback("ERROR", res);
                        break;
                }
            });
        }
    }
}

module.exports = TalkConversation;
