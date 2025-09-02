const { OAuth2Client } = require('google-auth-library');

// Initialize OAuth clients
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Verify Google token
const verifyGoogleToken = async (token) => {
  const ticket = await googleClient.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  
  return ticket.getPayload();
};

// Verify Facebook token
const verifyFacebookToken = async (accessToken) => {
  const response = await fetch(
    `https://graph.facebook.com/me?fields=id,email,first_name,last_name,picture&access_token=${accessToken}`
  );
  
  if (!response.ok) {
    throw new Error('Invalid Facebook token');
  }

  return await response.json();
};

// Transform OAuth user data to standard format
const transformOAuthUser = (provider, userData) => {
  switch (provider) {
    case 'google':
      return {
        email: userData.email,
        firstName: userData.given_name,
        lastName: userData.family_name,
        thirdPartyId: userData.sub,
        thirdPartyProvider: 'google'
      };
    
    case 'facebook':
      return {
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        thirdPartyId: userData.id,
        thirdPartyProvider: 'facebook'
      };
    
    case 'apple':
      return {
        email: userData.email,
        firstName: userData.given_name,
        lastName: userData.family_name,
        thirdPartyId: userData.sub,
        thirdPartyProvider: 'apple'
      };
    
    default:
      throw new Error(`Unsupported OAuth provider: ${provider}`);
  }
};

module.exports = {
  googleClient,
  verifyGoogleToken,
  verifyFacebookToken,
  transformOAuthUser
};