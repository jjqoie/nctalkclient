


class TalkAccess {

    constructor(_http, _options) {
        this.server_url = this.server_split_string(_options.server);
        this._http = _http;
        this.httpoptions = {
            host: this.server_url.host,
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

    server_split_string(url) {

        if(typeof url !== "string") {
            return {};
        }

        const server_split = url.split("/");

        let host;
        let path = String();

        server_split.forEach((element, index) => {
            if(index == 0) {
                host = element;
            }
            else {
                if(element != "") {
                    path = path + "/" + element;
                }
            }
        });

        return {host, path};
    }

    RequestfromHost(method, path, body, Callback) {

        this.httpoptions.method = method;
        this.httpoptions.path = this.server_url.path + path;

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
                    statusCode: res.statusCode,
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



