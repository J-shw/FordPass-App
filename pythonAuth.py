from base64 import urlsafe_b64encode
import requests, hashlib, random, string, json, re

FORD_LOGIN_URL = "https://login.ford.com"

loginHeaders = {
    "Accept": "*/*",
    "Accept-Language": "en-us",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
    "Accept-Encoding": "gzip, deflate, br",
}

locale_lookup = {
    "UK&Europe": "EN-GB",
    "Australia": "EN-AU",
    "North America & Canada": "EN-US",
}

locale_short_lookup = {
    "UK&Europe": "GB",
    "Australia": "AUS",
    "North America & Canada": "USA",
}

country_code = locale_lookup['UK&Europe']
short_code = locale_short_lookup['UK&Europe']

def base64_url_encode(data):
    """Encode string to base64"""
    return urlsafe_b64encode(data).rstrip(b'=')

def generate_hash(code):
    """Generate hash for login"""
    hashengine = hashlib.sha256()
    hashengine.update(code.encode('utf-8'))
    return base64_url_encode(hashengine.digest()).decode('utf-8')

def auth2_step1(username, password):
    """Auth2 step 1 obtain tokens"""
    print("Running Step1 new!")
    headers = {
        **loginHeaders,
    }
    code1 = ''.join(random.choice(string.ascii_lowercase) for i in range(43))
    code_verifier = generate_hash(code1)
    step1_session = requests.session()
    step1_url = f"{FORD_LOGIN_URL}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_{country_code}/oauth2/v2.0/authorize?redirect_uri=fordapp://userauthorized&response_type=code&max_age=3600&scope=%2009852200-05fd-41f6-8c21-d36d3497dc64%20openid&client_id=09852200-05fd-41f6-8c21-d36d3497dc64&code_challenge={code_verifier}&code_challenge_method=S256&ui_locales={country_code}&language_code={country_code}&country_code={short_code}&ford_application_id=5C80A6BB-CF0D-4A30-BDBF-FC804B5C1A98"

    step1get = step1_session.get(
        step1_url,
        headers=headers,
    )

    step1get.raise_for_status()

    #print(step1_session.text)
    pattern = r'var SETTINGS = (\{[^;]*\});'
    #print(step1get.text)
    match = re.search(pattern, step1get.text)
    transId = None
    csrfToken = None
    if match:
        settings = match.group(1)
        settings_json = json.loads(settings)
        print(settings_json)
        print(settings_json["transId"])
        transId = settings_json["transId"]
        csrfToken = settings_json["csrf"]
    print(step1get.status_code)
    print(step1_session.cookies.get_dict())
    data = {
        "request_type": "RESPONSE",
        "signInName": username,
        "password": password,
    }
    urlp = f"{FORD_LOGIN_URL}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_{country_code}/SelfAsserted?tx={transId}&p=B2C_1A_SignInSignUp_en-AU"
    print(urlp)
    headers = {
        **loginHeaders,
        "Origin": "https://login.ford.com",
        "Referer": step1_url,
        "X-Csrf-Token": csrfToken
    }
    step1post = step1_session.post(
        urlp,
        headers=headers,
        data=data
    )
    step1post.raise_for_status()
    print("checking password")
    print(step1post.text)
    print(step1post.status_code)
    cookie_dict = step1_session.cookies.get_dict()
    print(cookie_dict)

    if step1post.status_code == 400:
        print('400 - Error')
    

    step1pt2 = step1_session.get(
        f"{FORD_LOGIN_URL}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_{country_code}/api/CombinedSigninAndSignup/confirmed?rememberMe=false&csrf_token={csrfToken}",
        headers=headers,
        allow_redirects=False,
    )
    step1pt2.raise_for_status()

    test = step1pt2.headers["Location"]
    print(test)

    code_new = test.replace("fordapp://userauthorized/?code=","")

    print(code_new)

    data = {
        "client_id" : "09852200-05fd-41f6-8c21-d36d3497dc64",
        "grant_type": "authorization_code",
        "code_verifier": code1,
        "code": code_new,
        "redirect_uri": "fordapp://userauthorized"

    }

    step1pt3 = step1_session.post(
        f"{FORD_LOGIN_URL}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_{country_code}/oauth2/v2.0/token",
        headers=headers,
        data=data
    )
    step1pt3.raise_for_status()

    print(step1pt3.status_code)
    print(step1pt3.text)

    tokens = step1pt3.json()
    if tokens:
        # if auth2_step2(tokens):
        #     return tokens
        print("Token: " + str(tokens))
    else:
        print("DAM IT WENT WRONG")


auth2_step1("jwhtticase07@gmail.com", "")