

class TalkRooms {

    constructor(nchttp, capabilities) {
        this.nchttp = nchttp;
        this.capabilities = capabilities;

        // Build url
        let conversation_feature = capabilities.CheckFeature("conversation-v");

        if (conversation_feature == "conversation-v4") {
            this.conversationAPIversion = 4;
        }
        else {
            this.conversationAPIversion = 2;
        }
    }

    _geturl() {
        return `/ocs/v2.php/apps/spreed/api/v${this.conversationAPIversion}/room?format=json`;
    }

    fetch(Callback) {

        this.nchttp.RequestfromHost("GET", this._geturl(), null, (retcode, res) => {
            switch (retcode) {
                case "OK":
                    try {
                        this.roomlist = JSON.parse(res.body).ocs.data;
                    }
                    catch (e) {
                        this.roomlist = undefined;
                        Callback("ERROR", `ERROR reply string is not a JSON ${res.body}`);
                        break;
                    }
                    //console.log("TalkRooms get OK", this.roomlist);
                    Callback("OK", res);
                    break;
                case "ERROR":
                    //console.log("TalkRooms get ERROR", res);
                    Callback("ERROR", res);
                    break;
                case "TIMEOUT":
                    //console.log("TalkRooms get TIMEOUT");
                    Callback("TIMEOUT");
                    break;
            }
        });
    }

    getlistofrooms() {
        return this.roomlist;
    }
}

module.exports = TalkRooms;
