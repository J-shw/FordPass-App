const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs')

// This is my attemp at translating pythonAuth.py into JavaScript


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

function createSession() {
    return axios.create();
}

// module.exports = {
//     auth: auth
// };

async function auth(username, password) {
    console.log('Start');
    const code1 = Array(43).fill().map(() => Math.random().toString(36).charAt(2)).join('');
    const codeVerifier = generate_hash(code1);

    const session = createSession();

    const step1Url = `${FORD_LOGIN_URL}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_${country_code}/oauth2/v2.0/authorize?redirect_uri=fordapp://userauthorized&response_type=code&max_age=3600&scope=2009852200-05fd-41f6-8c21-d36d3497dc64%20openid&client_id=09852200-05fd-41f6-8c21-d36d3497dc64&code_challenge=${codeVerifier}&code_challenge_method=S256&ui_locales=${country_code}&language_code=${country_code}&country_code=${short_code}&ford_application_id=5C80A6BB-CF0D-4A30-BDBF-FC804B5C1A98`;
    // This URL 'step1Url' is the first issue 
    // I have set the redirect to fordapp (This is the same as the python)
    // It throws 'Unsupported protocol fordapp'
    // So I set it to https://
    // Then it seems the server responds with 'lincolnapp' as a redirect
    // Because it thows 'Unsupported protocol lincolnapp'
    console.log('Step 1');
    try{
        const step1get = await session.get(step1Url, { headers: loginHeaders});
    }catch(e){
        console.log(e)
    }

    // output(step1get.data);

    const transId = extractTransId(step1get.data);
    const csrfToken = extractCsrfToken(step1get.data);
    console.log(csrfToken)
    // {FORD_LOGIN_URL}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_{self.country_code}/oauth2/v2.0/authorize?redirect_uri=fordapp://userauthorized&response_type=code&max_age=3600&scope=%2009852200-05fd-41f6-8c21-d36d3497dc64%20openid&client_id=09852200-05fd-41f6-8c21-d36d3497dc64&code_challenge={code_verifier}&code_challenge_method=S256&ui_locales={self.country_code}&language_code={self.country_code}&country_code={self.short_code}&ford_application_id=5C80A6BB-CF0D-4A30-BDBF-FC804B5C1A98
    const step2Url = `${FORD_LOGIN_URL}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_${country_code}/SelfAsserted?tx=${transId}&p=B2C_1A_SignInSignUp_${country_code}`;
    console.log('Step 2');
    const step2post = await session.post(step2Url, {
        request_type: "RESPONSE",
        signInName: username,
        password: password
    }, {
        headers: {
            ...loginHeaders,
            "Origin": "https://login.ford.com",
            "Referer": step1Url,
            "X-Csrf-Token": csrfToken
        }
    });

    // console.log(step2post.headers)
    //output(step2post.data);

    const locationHeader = step2post.headers.location;
    const codeNew = locationHeader.replace("fordapp://userauthorized/?code=", "");

    const step3Url = `${FORD_LOGIN_URL}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_${country_code}/oauth2/v2.0/token`;
    console.log('Step 3');
    const step3post = await session.post(step3Url, {
        client_id: "30990062-9618-40e1-a27b-7c6bcb23658a",
        grant_type: "authorization_code",
        code_verifier: code1,
        code: codeNew,
        redirect_uri: "fordapp://userauthorized"
    }, { headers: loginHeaders });

    const tokens = step3post.data;
    //console.log(tokens)
    if (tokens) {
        console.error("Authentication Complete");
        // Authentication successful, proceed with further actions
        return tokens;
    } else {
        console.error("Authentication failed to obtain token");
        // Handle authentication failure
    }

}

function extractTransId(data) {
    const match = /"transId":"([^"]+)"/.exec(data);
    return match ? match[1] : null;
}

function extractCsrfToken(data) {
    const match = /"csrf":"([^"]+)"/.exec(data);
    return match ? match[1] : null;
}

auth("username", "password")