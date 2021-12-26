// These registration tokens come from the client FCM SDKs.
const registrationTokens = [
  'YOUR_REGISTRATION_TOKEN_1',
  // …
  'YOUR_REGISTRATION_TOKEN_N',
];

const message = {
  data: {score: '850', time: '2:45'},
  tokens: registrationTokens,
};

getMessaging().sendMulticast(message)
  .then((response) => {
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(registrationTokens[idx]);
        }
      });
      console.log('List of tokens that caused failures: ' + failedTokens);
    }
  });