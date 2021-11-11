
class TalkCapabilities {
    constructor(nchttp) {
        this.nchttp = nchttp;
        this.conversationAPIversion = 0;
    }

    _geturl() {
        return "/ocs/v1.php/cloud/capabilities?format=json";
    }

    get(Callback) {

        this.nchttp.RequestfromHost("GET", this._geturl(), null, (retcode, res) => {
            switch (retcode) {
                case "OK":
                    //here we have the full response, html or json object findIndex
                    //ocs.data.capabilities.spreed.features
                    //payload.ocs.data.capabilities.spreed.features[0]
                    try {
                        this.capabilities = JSON.parse(res.body);
                    }
                    catch (e) {
                        this.capabilities = undefined;
                        console.log("ERROR reply string is not a JSON");
                        break;
                    }
                    this.spreedfeatures = this.capabilities.ocs.data.capabilities.spreed.features;

                    if (this.spreedfeatures.find((element) => element.includes("conversation")) == "conversation-v4") {
                        this.conversationAPIversion = 4;
                    }
                    else {
                        this.conversationAPIversion = 2;
                    }

                    //console.log("OK", this.spreedfeatures);
                    Callback("OK");
                    break;
                case "ERROR":
                    // Callback("ERROR", e);
                    //console.log("ERROR", res);
                    Callback();
                    break;
                case "TIMEOUT":
                    //console.log("TIMEOUT");
                    Callback("TIMEOUT");
                    break;
            }

        });
    }

    GetConversationAPIVersion() {
        return this.conversationAPIversion;
    }

    CheckFeature(str) {
        return this.spreedfeatures.find((element) => element.includes(str));
    }
}

module.exports = TalkCapabilities;
