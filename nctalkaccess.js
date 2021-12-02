


class TalkAccess {

    constructor(_http, _options) {
        this._http = _http;
        this.httpoptions = {
            host: _options.server,
            port: _options.port,
            path: "",
            timeout: 120000,  // Make the http connection timeout larger than the nextcloud talk wait new msg timeout (30 by default, 60 at most)
            method: "",
            // authentication headers
            headers: {
                "Authorization": "Basic " + Buffer.from(`${_options.user}:${_options.pass}`).toString("base64"),
                "content-type": "application/json", "OCS-APIRequest": "true",
                "USER_AGENT": "js-nctalkclient",
                "ACCEPT_LANGUAGE": "de, en-US;q=0.9"
            },
        };
    }

    RequestfromHost(method, path, body, Callback) {

        this.httpoptions.method = method;
        this.httpoptions.path = path;

        //console.log(this.httpoptions);

        let req = this._http.request(this.httpoptions, (function (res) {
            let body = "";

            res.on("error", (function (e) {
                Callback("ERROR", e);
            }).bind(this));

            res.on("data", (function (data) {
                body += data;
            }).bind(this));

            res.on("end", (function () {
                let data = {
                    headers: res.headers,
                    body: body
                };
                Callback("OK", data);
            }).bind(this));

        }).bind(this));

        req.on('error', (function (e) {
            Callback("ERROR", e);
        }).bind(this));
        req.on('timeout', (function () {
            // http timeout - IMPORTANT: socket is still open and can trigger one of the callback aboves!
            // call abort request --> leading to socket hang up error --> No Callback to calling layer here
            req.abort();
        }).bind(this));

        if (body) {
            req.write(body);
        }
        req.end();
    }
}










module.exports = TalkAccess;



