const axios = require('axios');
const crypto = require('crypto');

const FORD_LOGIN_URL = "https://login.ford.com";

const loginHeaders = {
    "Accept": "*/*",
    "Accept-Language": "en-us",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
    "Accept-Encoding": "gzip, deflate, br",
};

const localeLookup = {
    "UK&Europe": "EN-GB",
    "Australia": "EN-AU",
    "North America & Canada": "EN-US",
};

const localeShortLookup = {
    "UK&Europe": "GB",
    "Australia": "AUS",
    "North America & Canada": "USA",
};

const countryCode = localeLookup['UK&Europe'];
const shortCode = localeShortLookup['UK&Europe'];

function base64UrlEncode(data) {
    return Buffer.from(data).toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function generateHash(code) {
    const hash = crypto.createHash('sha256');
    hash.update(code);
    return base64UrlEncode(hash.digest());
}

async function auth2Step1(username, password) {
    console.log("Running Step1 new!");
    const code1 = Array.from({ length: 43 }, () => 
        String.fromCharCode(97 + Math.floor(Math.random() * 26))
    ).join('');
    const codeVerifier = generateHash(code1);

    try {
        const step1Url = `${FORD_LOGIN_URL}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_${countryCode}/oauth2/v2.0/authorize?redirect_uri=fordapp://userauthorized&response_type=code&max_age=3600&scope=%2009852200-05fd-41f6-8c21-d36d3497dc64%20openid&client_id=09852200-05fd-41f6-8c21-d36d3497dc64&code_challenge=${codeVerifier}&code_challenge_method=S256&ui_locales=${countryCode}&language_code=${countryCode}&country_code=${shortCode}&ford_application_id=5C80A6BB-CF0D-4A30-BDBF-FC804B5C1A98`;
        console.log(step1Url)
        const step1Response = await axios.get(step1Url, {
            headers: loginHeaders
        });

        // Parse response to extract transId and csrfToken
        const pattern = /var SETTINGS = ({[^;]*});/;
        const match = pattern.exec(step1Response.data);
        let transId = null;
        let csrfToken = null;
        if (match) {
            const settings = JSON.parse(match[1]);
            transId = settings.transId;
            csrfToken = settings.csrf;
        }

        const data = {
            "request_type": "RESPONSE",
            "signInName": username,
            "password": password,
        };

        const urlp = `${FORD_LOGIN_URL}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_${countryCode}/SelfAsserted?tx=${transId}&p=B2C_1A_SignInSignUp_en-AU`;

        const step1PostResponse = await axios.post(urlp, data, {
            headers: {
                ...loginHeaders,
                "Origin": "https://login.ford.com",
                "Referer": step1Url,
                "X-Csrf-Token": csrfToken
            }
        });

        // handle step1PostResponse

        const step1Pt2Response = await axios.get(`${FORD_LOGIN_URL}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_${countryCode}/api/CombinedSigninAndSignup/confirmed?rememberMe=false&csrf_token=${csrfToken}`, {
            headers: loginHeaders,
            allowRedirects: false
        });

        // handle step1Pt2Response

        const codeNew = step1Pt2Response.headers.location.replace("fordapp://userauthorized/?code=", "");

        const tokenData = {
            "client_id": "09852200-05fd-41f6-8c21-d36d3497dc64",
            "grant_type": "authorization_code",
            "code_verifier": code1,
            "code": codeNew,
            "redirect_uri": "fordapp://userauthorized"
        };

        const step1Pt3Response = await axios.post(`${FORD_LOGIN_URL}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_${countryCode}/oauth2/v2.0/token`, tokenData, {
            headers: loginHeaders
        });

        // handle step1Pt3Response

        const tokens = step1Pt3Response.data;
        if (tokens) {
            console.log("Token: ", tokens);
        } else {
            console.log("DAM IT WENT WRONG");
        }
    } catch (error) {
        console.error("Error: ", error);
    }
}

auth2Step1("jwhtticase07@gmail.com", "!");