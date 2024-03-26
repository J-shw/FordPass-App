const FORD_LOGIN_URL = "https://login.ford.com";
const loginHeaders = {
    "Accept": "*/*",
    "Accept-Language": "en-us"
};

const loginHeadersV2 = {
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

async function auth2_step1() {
    console.log("Running Step1!");
    const code1 = Array.from({ length: 43 }, () => {
        return String.fromCharCode(Math.floor(Math.random() * 26) + 97);
    }).join('');
    const code_verifier = await generate_hash(code1);
    console.log('Hash: '+code_verifier)
    const step1_session = new XMLHttpRequest();
    const step1_url = `${FORD_LOGIN_URL}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_${country_code}/oauth2/v2.0/authorize?redirect_uri=fordapp://userauthorized&response_type=code&max_age=3600&scope=%2009852200-05fd-41f6-8c21-d36d3497dc64%20openid&client_id=09852200-05fd-41f6-8c21-d36d3497dc64&code_challenge=${code_verifier}&code_challenge_method=S256&ui_locales=${country_code}&language_code=${country_code}&country_code=${short_code}&ford_application_id=5C80A6BB-CF0D-4A30-BDBF-FC804B5C1A98`;

    // Create and send get request
    step1_session.open("GET", step1_url);
    for (let [key, value] of Object.entries(loginHeaders)) {
        step1_session.setRequestHeader(key, value);
    }
    step1_session.send();

    auth2_step2(step1_session)
}

function auth2_step2(step1_session){
    let username = document.getElementById('txtUsr').value;
    let password = document.getElementById('txtPwd').value;
    console.log("Running Step2!");
    step1_session.onreadystatechange = function() {
        if (step1_session.readyState === XMLHttpRequest.DONE) {
            if (step1_session.status === 200) {
                const pattern = /var SETTINGS = ({.*?});/;
                const match = step1_session.responseText.match(pattern);
                let transId = null;
                let csrfToken = null;
                if (match) {
                    const settings_json = JSON.parse(match[1]);
                    console.log(settings_json);
                    console.log(settings_json.transId);
                    transId = settings_json.transId;
                    csrfToken = settings_json.csrf;
                }
                console.log(step1_session.status);
          
                const data = {
                    "request_type": "RESPONSE",
                    "signInName": username,
                    "password": password,
                };
                console.log(username);
                console.log(password);
                const urlp = `${FORD_LOGIN_URL}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_${this.country_code}/SelfAsserted?tx=${transId}&p=B2C_1A_SignInSignUp_en-AU`;
                console.log(urlp);
                const headers = {
                    ...loginHeaders,
                    "X-Csrf-Token": csrfToken
                };

                fetch(tokenUrl, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                      grant_type: 'authorization_code',
                      code: authorizationCode,
                      client_id: clientId,
                      redirect_uri: redirectUri
                    }),
                  })
                  .then(response => response.json())
                  .then(data => {
                    // Step 4: Handle the response containing the access token
                    console.log('Access Token:', data.access_token);
                  })
                  .catch(error => {
                    console.error('Error:', error);
                });

                // step1_session.open("POST", urlp);
                // for (const [key, value] of Object.entries(headers)) {
                //     step1_session.setRequestHeader(key, value);
                // }
                // console.log('Headers: '+step1_session.getAllResponseHeaders());
                // step1_session.send(JSON.stringify(data));
                // step1_session.onreadystatechange = function() {
                //     if (step1_session.readyState === XMLHttpRequest.DONE) {
                //         if (step1_session.status === 400) {
                //             throw new Error(JSON.parse(step1_session.responseText).message);
                //         }
                //         console.log("checking password");
                //         console.log(step1_session);
                //         console.log(step1_session.status);

                //         const step1pt2 = new XMLHttpRequest();
                //         step1pt2.open("GET", `${FORD_LOGIN_URL}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_${country_code}/api/CombinedSigninAndSignup/confirmed?rememberMe=false&csrf_token=${csrfToken}`);
                //         for (const [key, value] of Object.entries(headers)) {
                //             step1pt2.setRequestHeader(key, value);
                //         }
                //         step1pt2.send();
                //         step1pt2.onreadystatechange = function() {
                //             if (step1pt2.readyState === XMLHttpRequest.DONE) {
                //                 const test = step1pt2.getResponseHeader("Location");
                //                 console.log(test);
                //                 const code_new = test.replace("fordapp://userauthorized/?code=", "");
                //                 console.log(code_new);

                //                 const data = {
                //                     "client_id": "09852200-05fd-41f6-8c21-d36d3497dc64",
                //                     "grant_type": "authorization_code",
                //                     "code_verifier": code1,
                //                     "code": code_new,
                //                     "redirect_uri": "fordapp://userauthorized"
                //                 };

                //                 const step1pt3 = new XMLHttpRequest();
                //                 step1pt3.open("POST", `${FORD_LOGIN_URL}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_${country_code}/oauth2/v2.0/token`);
                //                 for (const [key, value] of Object.entries(headers)) {
                //                     step1pt3.setRequestHeader(key, value);
                //                 }
                //                 step1pt3.send(JSON.stringify(data));
                //                 step1pt3.onreadystatechange = function() {
                //                     if (step1pt3.readyState === XMLHttpRequest.DONE) {
                //                         console.log(step1pt3.status);
                //                         console.log(step1pt3.responseText);
                //                         const tokens = JSON.parse(step1pt3.responseText);
                //                         if (tokens) {
                //                             if (auth2_step2(tokens)) {
                //                                 return tokens;
                //                             }
                //                         } else {
                //                             console.log("DAM IT WENT WRONG");
                //                         }
                //                     }
                //                 };
                //             }
                //         };
                //     }
                // };
            }
        }
    };
}

async function generate_hash(code) {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    return base64_url_encode(hashHex);
}


function base64_url_encode(data) {
    // Encode string to base64
    const base64String = data;
    // Apply URL-safe modifications
    const urlSafeString = base64String
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    // Remove trailing padding characters
    return urlSafeString.replace(/=*$/, '');
}