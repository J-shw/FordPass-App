const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');

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

// Function to handle OAuth authentication
function authenticate(username, password) {
    // Implement your authentication logic here
    auth2_step1(username, password);
}

// Export the authenticate function to make it accessible from other files
module.exports = {
    authenticate: authenticate
};

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


async function auth2_step1(username, password) {
    const code1 = Array.from({ length: 43 }, () => {
        return String.fromCharCode(Math.floor(Math.random() * 26) + 97);
    }).join('');
    const code_verifier = await generate_hash(code1);
    const step1_url = `${FORD_LOGIN_URL}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_${country_code}/oauth2/v2.0/authorize`;
    const params = {
        redirect_uri: 'none', //fordapp://userauthorized/
        response_type: 'code',
        max_age: 3600,
        scope: '09852200-05fd-41f6-8c21-d36d3497dc64%openid',
        client_id: '09852200-05fd-41f6-8c21-d36d3497dc64',
        code_challenge: code_verifier,
        code_challenge_method: 'S256',
        ui_locales: country_code,
        language_code: country_code,
        country_code: short_code,
        ford_application_id: '5C80A6BB-CF0D-4A30-BDBF-FC804B5C1A98'
    };


    const response = await axios.get(step1_url, {
        headers: loginHeaders,
        params: params
    });

    if (response.status === 200) {
        const pattern = /var SETTINGS = ({.*?});/;
        const match = response.data.match(pattern);
        let transId = null;
        let csrfToken = null;
        if (match) {
            const settings_json = JSON.parse(match[1]);
            console.log(settings_json);
            transId = settings_json.transId.replace('StateProperties=', '');
            csrfToken = settings_json.csrf;
        }

        console.log('csrf-tokenm: ' + csrfToken)
        const data = {
            request_type: 'RESPONSE',
            signInName: username,
            password: password
        };

        const urlp = `${FORD_LOGIN_URL}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_${country_code}/SelfAsserted`;
        const headers = {
            ...loginHeaders,
            "Origin": "https://login.ford.com",
            "Referer": step1_url,
            'X-Csrf-Token': csrfToken
        };

        const response2 = await axios.post(urlp, data, {
            headers: headers,
            params: params
        });

        if (response2.status === 400) {
            throw new Error(response2.data.message);
        }

        console.log('checking password');
        console.log(response2.status);

        const step1pt2 = await axios.get(`${FORD_LOGIN_URL}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_${country_code}/api/CombinedSigninAndSignup/confirmed`, {
            headers: headers,
            params: params,
            maxRedirects: 0
        });

        output(step1pt2.data)

        console.log(step1pt2.headers);
        const test = step1pt2.headers.location;
        console.log(test);
        const code_new = test.replace('fordapp://userauthorized/?code=', '');
        console.log(code_new);

        const data3 = {
            client_id: '09852200-05fd-41f6-8c21-d36d3497dc64',
            grant_type: 'authorization_code',
            code_verifier: code1,
            code: code_new,
            redirect_uri: 'fordapp://userauthorized'
        };

        const response3 = await axios.post(`${FORD_LOGIN_URL}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_${country_code}/oauth2/v2.0/token`, data3, {
            headers: headers
        });

        console.log(response3.status);
        console.log(response3.data);
        return response3.data;
    }
}

function output(data){
    fs.writeFile("ouput.html", data, (err) => {
        if (err) {
            console.error('Error writing to file:', err);
            return;
        }
    });
}
