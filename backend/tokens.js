const { AccessToken } = require('twilio').jwt;

const generateToken = (identity, room, config) => {
  const token = new AccessToken(
    config.twilio.accountSid,
    config.twilio.apiKey,
    config.twilio.apiSecret,
    { identity: identity }
  );

  const videoGrant = new AccessToken.VideoGrant({ room: room });
  token.addGrant(videoGrant);
  token.identity = identity;

  return token;
};

module.exports = { generateToken };