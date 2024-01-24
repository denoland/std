export default {
  description: `
Will walk the user thru a device authentication loop, where they will be shown a code, and then told to enter it at a github page that will be opened for them in a popup window.  Once this code is returned, it will have been stored in their /.env file and can allow them to perform github related actions from now on.`,
  config: {},
  runner: 'runner-chat',
  commands: ['fetch:post', 'open:openUrl', 'utils:delay'],
  prerequisites: [],
  instructions: [
    `
Your \`client_id\` is: 2a3885264567b740c092

Follow the steps outlined below to walk the user thru the authentication process.  NEVER talk back, simply execute the commands and display text ONLY IF ABSOLUTELY NECESSARY

Once you're done, write the \`access_token\` to the user's .env file and then exit.

`,
    `Device flow
The device flow allows you to authorize users for a headless application, such as a CLI tool or the Git Credential Manager.

Before you can use the device flow to authorize and identify users, you must first enable it in your app's settings. For more information about enabling the device flow in your app, see "Modifying a GitHub App registration" for GitHub Apps and "Modifying an OAuth app" for OAuth apps.

Overview of the device flow
Your app requests device and user verification codes and gets the authorization URL where the user will enter the user verification code.
The app prompts the user to enter a user verification code at https://github.com/login/device.
The app polls for the user authentication status. Once the user has authorized the device, the app will be able to make API calls with a new access token.
Step 1: App requests the device and user verification codes from GitHub
POST https://github.com/login/device/code
Your app must request a user verification code and verification URL that the app will use to prompt the user to authenticate in the next step. This request also returns a device verification code that the app must use to receive an access token and check the status of user authentication.

The endpoint takes the following input parameters.

Parameter name	Type	Description
client_id	string	Required. The client ID you received from GitHub for your app.
scope	string	A space-delimited list of the scopes that your app is requesting access to. For more information, see "Scopes for OAuth apps."
By default, the response takes the following form:

device_code=3584d83530557fdd1f46af8289938c8ef79f9dc5&expires_in=900&interval=5&user_code=WDJB-MJHT&verification_uri=https%3A%2F%github.com%2Flogin%2Fdevice
Parameter name	Type	Description
device_code	string	The device verification code is 40 characters and used to verify the device.
user_code	string	The user verification code is displayed on the device so the user can enter the code in a browser. This code is 8 characters with a hyphen in the middle.
verification_uri	string	The verification URL where users need to enter the user_code: https://github.com/login/device.
expires_in	integer	The number of seconds before the device_code and user_code expire. The default is 900 seconds or 15 minutes.
interval	integer	The minimum number of seconds that must pass before you can make a new access token request (POST https://github.com/login/oauth/access_token) to complete the device authorization. For example, if the interval is 5, then you cannot make a new request until 5 seconds pass. If you make more than one request over 5 seconds, then you will hit the rate limit and receive a slow_down error.
You can also receive the response in different formats if you provide the format in the Accept header. For example, Accept: application/json or Accept: application/xml:

Accept: application/json
{
  "device_code": "3584d83530557fdd1f46af8289938c8ef79f9dc5",
  "user_code": "WDJB-MJHT",
  "verification_uri": "https://github.com/login/device",
  "expires_in": 900,
  "interval": 5
}
Accept: application/xml
<OAuth>
  <device_code>3584d83530557fdd1f46af8289938c8ef79f9dc5</device_code>
  <user_code>WDJB-MJHT</user_code>
  <verification_uri>https://github.com/login/device</verification_uri>
  <expires_in>900</expires_in>
  <interval>5</interval>
</OAuth>
Step 2: Prompt the user to enter the user code in a browser
Your device will show the user verification code and prompt the user to enter the code at https://github.com/login/device.

Step 3: App polls GitHub to check if the user authorized the device
POST https://github.com/login/oauth/access_token
Your app will make device authorization requests that poll POST https://github.com/login/oauth/access_token, until the device and user codes expire or the user has successfully authorized the app with a valid user code. The app must use the minimum polling interval retrieved in step 1 to avoid rate limit errors. For more information, see "Rate limits for the device flow."

The user must enter a valid code within 15 minutes (or 900 seconds). After 15 minutes, you will need to request a new device authorization code with POST https://github.com/login/device/code.

Once the user has authorized, the app will receive an access token that can be used to make requests to the API on behalf of a user.

The endpoint takes the following input parameters.

Parameter name	Type	Description
client_id	string	Required. The client ID you received from GitHub for your OAuth app.
device_code	string	Required. The device_code you received from the POST https://github.com/login/device/code request.
grant_type	string	Required. The grant type must be urn:ietf:params:oauth:grant-type:device_code.
By default, the response takes the following form:

access_token=gho_16C7e42F292c6912E7710c838347Ae178B4a&token_type=bearer&scope=repo%2Cgist
You can also receive the response in different formats if you provide the format in the Accept header. For example, Accept: application/json or Accept: application/xml:

Accept: application/json
{
 "access_token": "gho_16C7e42F292c6912E7710c838347Ae178B4a",
  "token_type": "bearer",
  "scope": "repo,gist"
}
Accept: application/xml
<OAuth>
  <access_token>gho_16C7e42F292c6912E7710c838347Ae178B4a</access_token>
  <token_type>bearer</token_type>
  <scope>gist,repo</scope>
</OAuth>
Rate limits for the device flow
When a user submits the verification code on the browser, there is a rate limit of 50 submissions in an hour per application.

If you make more than one access token request (POST https://github.com/login/oauth/access_token) within the required minimum timeframe between requests (or interval), you'll hit the rate limit and receive a slow_down error response. The slow_down error response adds 5 seconds to the last interval. For more information, see the Errors for the device flow.

Error codes for the device flow
Error code	Description
authorization_pending	This error occurs when the authorization request is pending and the user hasn't entered the user code yet. The app is expected to keep polling the POST https://github.com/login/oauth/access_token request without exceeding the interval, which requires a minimum number of seconds between each request.
slow_down	When you receive the slow_down error, 5 extra seconds are added to the minimum interval or timeframe required between your requests using POST https://github.com/login/oauth/access_token. For example, if the starting interval required at least 5 seconds between requests and you get a slow_down error response, you must now wait a minimum of 10 seconds before making a new request for an OAuth access token. The error response includes the new interval that you must use.
expired_token	If the device code expired, then you will see the token_expired error. You must make a new request for a device code.
unsupported_grant_type	The grant type must be urn:ietf:params:oauth:grant-type:device_code and included as an input parameter when you poll the OAuth token request POST https://github.com/login/oauth/access_token.
incorrect_client_credentials	For the device flow, you must pass your app's client ID, which you can find on your app settings page. The client_secret is not needed for the device flow.
incorrect_device_code	The device_code provided is not valid.
access_denied	When a user clicks cancel during the authorization process, you'll receive a access_denied error and the user won't be able to use the verification code again.
device_flow_disabled	Device flow has not been enabled in the app's settings. For more information, see "Device flow."
For more information, see the "OAuth 2.0 Device Authorization Grant."`,
  ],
  done: '',
  examples: [],
  tests: [],
}
