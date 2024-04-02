const axios = require('axios');
const crypto = require('crypto');

// Define base64 url encoding function (similar to Python's)
function base64UrlEncode(data) {
  return Buffer.from(data).toString('base64').replace(/=+$/, '');
}

// Generate random string function (similar to Python's)
function generateRandomString(length) {
  return crypto.randomBytes(length).toString('ascii').substring(0, length);
}

// Function to generate hash (similar to Python's)
function generateHash(code) {
  const hash = crypto.createHash('sha256').update(code).digest();
  return base64UrlEncode(hash);
}

async function auth2Step1(username, password) {
  // ... (similar logic as Python function)

  const headers = {
    'Accept': '*/*',
    'Accept-Language': 'en-us',
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
    'Accept-Encoding': 'gzip, deflate, br',
    'Origin': 'https://login.ford.com', // Might need adjustment
    'Referer': step1Url, // Defined earlier
    'X-Csrf-Token': csrfToken, // Defined earlier
  };

  try {
    const step1Response = await axios.get(step1Url, { headers });
    // ... (similar logic as Python function, using regex and parsing data)

    const codeVerifier = generateRandomString(43);
    const code = codeNew.replace('fordapp://userauthorized/?code=', '');

    const tokenData = {
      client_id: "09852200-05fd-41f6-8c21-d36d3497dc64",
      grant_type: "authorization_code",
      code_verifier,
      code,
      redirect_uri: "fordapp://userauthorized",
    };

    const tokenResponse = await axios.post(`${FORD_LOGIN_URL}/...`, tokenData, { headers });

    if (tokenResponse.status === 200) {
      const tokens = tokenResponse.data;
      console.log("Token:", tokens);
    } else {
      console.error("Error:", tokenResponse.statusText);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Call the function with username and password
auth2Step1("jwhtticase07@gmail.com", "");
