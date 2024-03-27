const axios = require('axios');
const crypto = require('crypto');
const queryString = require('querystring');

const FORD_LOGIN_URL = "https://login.ford.com";
const loginHeaders = {
    "Accept": "*/*",
    "Accept-Language": "en-us",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
    "Accept-Encoding": "gzip, deflate, br",
};
const locale_lookup = {
    "UK&Europe": "EN-GB",
    "Australia": "EN-AU",
    "North America & Canada": "EN-US",
};
const locale_short_lookup = {
    "UK&Europe": "GB",
    "Australia": "AUS",
    "North America & Canada": "USA",
};

const country_code = locale_lookup['UK&Europe']
const short_code = locale_short_lookup['UK&Europe']

function base64_url_encode(data) {
    // Encode string to base64
    const base64String = Buffer.from(data, 'utf-8').toString('base64');
    // Apply URL-safe modifications
    const urlSafeString = base64String
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, ''); // Remove trailing padding characters
    return urlSafeString;
}

function generate_hash(code) {
    // Generate hash for login
    const hashengine = crypto.createHash('sha256');
    hashengine.update(code, 'utf-8');
    const hash = hashengine.digest();
    return base64_url_encode(hash);
}

// Export the authenticate function to make it accessible from other files
module.exports = {
    authenticate: authenticate
};


// Function to handle OAuth authentication
function authenticate(username, password) {
    // Implement your authentication logic here
    console.log('Authentication logic');
    auth2_step1(username, password);
}

async function auth2_step1(username, password) {
    console.debug("Running Step1 new!");
    const headers = {
        ...loginHeaders,
    };

    const code1 = Array.from({ length: 43 }, () => {
        return String.fromCharCode(Math.floor(Math.random() * 26) + 97);
    }).join('');
    const code_verifier = generate_hash(code1);

    const step1_url = `${FORD_LOGIN_URL}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_${country_code}/oauth2/v2.0/authorize`;

    const params = {
        redirect_uri: 'fordapp://userauthorized',
        response_type: 'code',
        max_age: 3600,
        scope: '09852200-05fd-41f6-8c21-d36d3497dc64 openid',
        client_id: '09852200-05fd-41f6-8c21-d36d3497dc64',
        code_challenge: code_verifier,
        code_challenge_method: 'S256',
        ui_locales: country_code,
        language_code: country_code,
        country_code: short_code,
        ford_application_id: '5C80A6BB-CF0D-4A30-BDBF-FC804B5C1A98'
    };

    const step1get = await axios.get(step1_url, {
        headers: headers,
        params: params
    });

    if (step1get.status !== 200) {
        throw new Error('Step 1 GET request failed');
    }

    const pattern = /var SETTINGS = ({[^;]*});/;
    const match = pattern.exec(step1get.data);
    let transId = null;
    let csrfToken = null;

    if (match) {
        const settings_json = JSON.parse(match[1]);
        console.debug(settings_json);
        console.debug(settings_json["transId"]);
        transId = settings_json["transId"].replace('StateProperties=', '');
        csrfToken = settings_json["csrf"];
    }

    const data = queryString.stringify({
        request_type: "RESPONSE",
        signInName: username,
        password: password,
    });

    const urlp = `${FORD_LOGIN_URL}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_${country_code}/SelfAsserted?tx=${transId}&p=B2C_1A_SignInSignUp_en-AU`;

    const step1post = await axios.post(urlp, data, {
        headers: {
            ...headers,
            "Origin": "https://login.ford.com",
            "Referer": step1_url,
            "X-Csrf-Token": csrfToken
        }
    });

    if (step1post.status !== 200) {
        throw new Error('Step 1 POST request failed');
    }

    console.debug("checking password");
    console.debug(step1post.data);
    console.debug(step1post.status);
    const cookie_dict = step1post.headers["set-cookie"];

    if (step1post.status === 400) {
        throw new Error(step1post.data["message"]);
    }

    const step1pt2 = await axios.get(`${FORD_LOGIN_URL}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_${country_code}/api/CombinedSigninAndSignup/confirmed?rememberMe=false&csrf_token=${csrfToken}`, {
        headers: headers,
        allowRedirects: false
    });

    if (step1pt2.status !== 200) {
        throw new Error('Step 1pt2 GET request failed');
    }

    const code_new = step1pt2.headers["Location"].replace("fordapp://userauthorized/?code=", "");

    console.debug(code_new);

    const step1pt3_data = queryString.stringify({
        client_id: "09852200-05fd-41f6-8c21-d36d3497dc64",
        grant_type: "authorization_code",
        code_verifier: code1,
        code: code_new,
        redirect_uri: "fordapp://userauthorized"
    });

    const step1pt3 = await axios.post(`${FORD_LOGIN_URL}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_${country_code}/oauth2/v2.0/token`, step1pt3_data, {
        headers: headers
    });

    if (step1pt3.status !== 200) {
        throw new Error('Step 1pt3 POST request failed');
    }

    console.debug(step1pt3.status);
    console.debug(step1pt3.data);

    const tokens = step1pt3.data;
    if (tokens) {
        if (auth2_step2(tokens)) {
            return tokens;
        }
    } else {
        console.debug("DAM IT WENT WRONG");
    }
}