
let username;
let password;
fordLoginUrl = "https://login.ford.com"
fordGaurdUrl = "https://api.mps.ford.com"

function getAuthed() {
    username = document.getElementById('txtUsr').value;
    password = document.getElementById('txtPwd').value;
    getAccessToken();
}



async function getAccessToken() {
    let tokens
    try {
    tokens = await getOAuthToken()
    } catch (error) {
    // More detailed error logging
    console.error("Error in authorize method: ", error)
    throw new Error(
        "Failed to retrieve OAuth token. Please check logs for details."
    )
    }

    if (!tokens) {
    throw new FordConnectException(
        500,
        "Error: Failed to retrieve OAuth token."
    )
    }

    try {
    const res = await axios.post(
        `${fordGaurdUrl}/api/token/v2/cat-with-b2c-access-token`,
        {
        idpToken: tokens.access_token
        },
        {
        headers: apiHeaders()
        }
    )

    return new OAuthResponse(
        res.data.access_token,
        res.data.expires_in,
        res.data.refresh_token,
        res.data.refresh_expires_in,
        res.data.ford_consumer_id
    )
    } catch (error) {
        // Including more context in the thrown error
        console.error("Error during access token retrieval: ", error)
        throw new Error("Failed to retrieve access token. Please check logs for details.")
    }
}

async function getOAuthToken() {
    let authorize = await authorize()

    const pattern = /var SETTINGS = (\{[^;]*\});/
    const match = authorize.data.match(pattern)

    if (!match) {
    throw new Error("Error: Failed to parse authorization response.")
    }

    const settings = JSON.parse(match[1])
    let transId = settings["transId"]
    let csrfToken = settings["csrf"]
    let referer = authorize.config.url ?? ""
    let cookies = authorize.headers["set-cookie"] ?? []
    let cookieString = cookies.join("; ")

    let assertion = await this.assert(transId, csrfToken, cookieString, referer)

    let cookies2 = assertion.headers["set-cookie"] ?? []
    let cookieString2 = cookies2.join("; ")
    cookieString = cookieString + "; " + cookieString2

    let newCode = await this.confirm(transId, csrfToken, cookieString)

    return await axios
    .post(
        `${this.fordLoginUrl}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_en-US/oauth2/v2.0/token`,
        new URLSearchParams({
        scope: "09852200-05fd-41f6-8c21-d36d3497dc64 openid",
        client_id: "09852200-05fd-41f6-8c21-d36d3497dc64",
        grant_type: "authorization_code",
        code_verifier: code,
        code: newCode,
        redirect_uri: "fordapp://userauthorized"
        }).toString(),
        {
        headers: {
            "User-Agent": "okhttp/4.11.0",
            "Accept-Encoding": "gzip",
            "X-Dynatrace": "NA=NA"
        }
        }
    )
    .then(res => res.data)
    .catch(error => {
        throw new FordConnectException(
        error.status,
        "Error: Authentication failed."
        )
    })
}

async function authorize() {
    const code = Array.from({ length: 43 }, () => {
        return String.fromCharCode(Math.floor(Math.random() * 26) + 97);
    }).join('');
    const codeVerifier = generate_hash(code)
    return await axios
    .get(
        `${fordLoginUrl}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_en-US/oauth2/v2.0/authorize`,
        {
        params: {
            redirect_uri: "fordapp://userauthorized",
            response_type: "code",
            max_age: 3600,
            scope: "09852200-05fd-41f6-8c21-d36d3497dc64 openid",
            client_id: "09852200-05fd-41f6-8c21-d36d3497dc64",
            code_challenge: codeVerifier,
            code_challenge_method: "S256",
            language_code: "en-US",
            country_code: "GB",
            ford_application_id: "BFE8C5ED-D687-4C19-A5DD-F92CDFC4503A"
            //login_hint: 'eyJyZWFsbSI6ICJjbG91ZElkZW50aXR5UmVhbG0ifQ=='
        },
        headers: loginHeaders()
        }
    )
    .catch(error => {
        console.log('Error: ' + error)
    })
}

async function assert(transId, csrf, cookies, referer) {
    return await axios
    .post(
        `${fordLoginUrl}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_en-US/SelfAsserted`,
        new URLSearchParams({
        request_type: "RESPONSE",
        signInName: this.username,
        password: this.password
        }).toString(),
        {
        params: {
            tx: transId,
            p: "B2C_1A_SignInSignUp_en-US"
        },
        headers: {
            ...loginHeaders(),
            Origin: fordLoginUrl,
            Referer: referer,
            "X-Csrf-Token": csrf,
            Cookie: cookies
        }
        }
    )
    .then(res => {
        if (res.status !== 200 && !res.data.status) {
        throw new Error("Error: Authentication failed.")
        }

        return res
    })
    .catch(error => {
        throw new FordConnectException(
        error.status,
        "Error: Authentication failed."
        )
    })
}

async function confirm(transId, csrf, cookies) {
    return await axios
    .get(
        `${fordLoginUrl}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_en-US/api/CombinedSigninAndSignup/confirmed`,
        {
        params: {
            rememberMe: "false",
            csrf_token: csrf,
            tx: transId,
            p: "B2C_1A_SignInSignUp_en-US"
        },
        headers: {
            ...this.loginHeaders(),
            Cookie: cookies
        },
        maxRedirects: 0
        }
    )
    .catch(error => {
        if (error.response.status === 302) {
        const locationHeader = error.response.headers["location"]
        return locationHeader.replace("fordapp://userauthorized/?code=", "")
        }

        throw new FordConnectException(
        error.status,
        "Error: Authentication failed."
        )
    })
}

async function generate_hash(code) {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');

    const base64String = hashHex;
    const urlSafeString = base64String
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    return urlSafeString.replace(/=*$/, '');
}

function generateHash(code) {
    const hash = crypto
    .createHash("sha256")
    .update(code)
    .digest("base64")
    const urlSafeHash = hash
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
    return urlSafeHash.substring(0, 43) // Truncate to 43 characters
}

function defaultHeaders() {
    return {
    Accept: "*/*",
    "Accept-Language": "en-us",
    //"User-Agent": "FordPass/26 CFNetwork/1485 Darwin/23.1.0",
    "Accept-Encoding": "gzip, deflate, br"
    }
}

function loginHeaders() {
    return {
    Accept: "*/*",
    "Accept-Language": "en-us",
    "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
    "Accept-Encoding": "gzip, deflate, br"
    }
}

function apiHeaders() {
    return {
        ...this.defaultHeaders(),
        "Content-Type": "application/json",
        "Application-Id": "BFE8C5ED-D687-4C19-A5DD-F92CDFC4503A",
        "User-Agent": "okhttp/4.11.0",
        Dynatrace: "NA=NA"
    }
}