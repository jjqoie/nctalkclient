



class TalkConversation {

    constructor(nchttp, capabilities, roominfo) {
        this.nchttp = nchttp;
        this.capabilities = capabilities;
        this.roominfo = roominfo;

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
                    //console.log("SendMessage OK", res);
                    Callback();
                    break;
                case "ERROR":
                    //console.log("SendMessage ERROR", res);
                    break;
                case "TIMEOUT":
                    //console.log("SendMessage TIMEOUT");
                    break;
            }
        });

    }

    SetListenMode(active) {
        this.listenactive = active;
    }

    WaitNewMessages(Callback) {
        if ((this.listenactive == true) && (this.waitmsgongoing == false)) {
            console.log("WaitNewMessages");
            this.waitmsgongoing = true;  // Only one WaitNewMessages per conversation
            this.nchttp.RequestfromHost("GET", this._geturl("WaitNewMessages"), null, (retcode, res) => {

                // WaitNewMessages is done - do this before any callbacks are called in case the trigger a new WaitNewMessage
                this.waitmsgongoing = false;

                switch (retcode) {
                    case "OK":
                        //console.log("OK", res);

                        let timeout = undefined;
                        let messages = undefined;

                        if (res.headers["x-chat-last-given"] == undefined) {
                            // x-chat-last-given is undefined in nextcloud talk timeout message
                            // https://nextcloud-talk.readthedocs.io/en/latest/chat/#receive-chat-messages-of-a-conversation
                            console.log("WaitNewMessages - Talk timeout reply");
                        }
                        else {
                            timeout = 0;
                            try {
                                messages = JSON.parse(res.body).ocs.data;
                                this.lastmsgid = res.headers["x-chat-last-given"];
                            }
                            catch {
                                console.log("WARNING: WaitNewMessage received isn't in JSON format");
                            }
                        }

                        Callback("OK", messages);
                        break;
                    case "ERROR":
                        //console.log("ERROR", res);
                        Callback("ERROR", res);
                        break;
                    case "TIMEOUT":
                        // This is a http connection timeout which indicates server went offline or is no more reachable while waiting
                        // Make the http connection timeout larger than the nextcloud talk wait new msg timeout (30 by default, 60 at most)
                        //console.log("TIMEOUT");
                        Callback("TIMEOUT");
                        break;
                }
            });
        }
    }
}

module.exports = TalkConversation;
