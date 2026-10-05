const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const env = require('../config/env');
const { User } = require('../models');

const googleClient = new OAuth2Client(env.googleClientId || undefined);

const signToken = (user) => jwt.sign(
  { id: user.id, role: user.role },
  env.jwtSecret,
  { expiresIn: env.jwtExpiresIn }
);

const signRegistrationToken = (payload) => jwt.sign(
  { ...payload, flow: 'registration' },
  env.jwtSecret,
  { expiresIn: '15m' }
);

const verifyRegistrationToken = (token) => {
  const payload = jwt.verify(token, env.jwtSecret);
  if (payload.flow !== 'registration') {
    throw new Error('Invalid registration token');
  }
  return payload;
};

const signPhoneVerificationToken = (payload) => jwt.sign(
  { ...payload, flow: 'phone_verification' },
  env.jwtSecret,
  { expiresIn: '15m' }
);

const verifyPhoneVerificationToken = (token) => {
  const payload = jwt.verify(token, env.jwtSecret);
  if (payload.flow !== 'phone_verification') {
    throw new Error('Invalid phone verification token');
  }
  return payload;
};

const loginWithGoogle = async ({ idToken }) => {
  if (!env.googleClientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.googleClientId
  });

  const payload = ticket.getPayload();
  let user = await User.findOne({ where: { email: payload.email } });

  if (user) {
    if (!user.google_id) {
      user.google_id = payload.sub;
      user.is_verified = true;
      await user.save();
    }

    return {
      requiresRegistration: false,
      token: signToken(user),
      user
    };
  }

  return {
    requiresRegistration: true,
    authType: 'google',
    registrationToken: signRegistrationToken({
      authType: 'google',
      google_id: payload.sub,
      email: payload.email || null,
      name: payload.name || null
    }),
    prefill: {
      name: payload.name || '',
      email: payload.email || ''
    }
  };
};

module.exports = {
  signToken,
  signRegistrationToken,
  verifyRegistrationToken,
  signPhoneVerificationToken,
  verifyPhoneVerificationToken,
  loginWithGoogle
};
