const twilio = require('twilio');
const env = require('../config/env');

const devOtpStore = new Map();
const twilioFallbackPhones = new Set();
const canUseTwilio = Boolean(
  env.twilio.accountSid && env.twilio.authToken && env.twilio.verifyServiceSid
);

const twilioClient = canUseTwilio
  ? twilio(env.twilio.accountSid, env.twilio.authToken)
  : null;

const isProd = process.env.NODE_ENV === 'production';

const sendOtp = async (phone) => {
  if (twilioClient) {
    try {
      await twilioClient.verify.v2.services(env.twilio.verifyServiceSid)
        .verifications
        .create({ to: phone, channel: 'sms' });

      twilioFallbackPhones.delete(phone);
      return { success: true };
    } catch (error) {
      if (isProd) {
        throw error;
      }

      // Development fallback when Twilio credentials/config are invalid.
      twilioFallbackPhones.add(phone);
      devOtpStore.set(phone, '123456');
      return {
        success: true,
        devCode: '123456',
        warning: 'Twilio send failed. Using dev OTP fallback.'
      };
    }
  }

  devOtpStore.set(phone, '123456');
  return {
    success: true,
    devCode: '123456'
  };
};

const verifyOtp = async (phone, code) => {
  if (twilioClient && !twilioFallbackPhones.has(phone)) {
    try {
      const result = await twilioClient.verify.v2.services(env.twilio.verifyServiceSid)
        .verificationChecks
        .create({ to: phone, code });
      return result.status === 'approved';
    } catch (error) {
      if (isProd) {
        throw error;
      }

      return devOtpStore.get(phone) === code;
    }
  }

  return devOtpStore.get(phone) === code;
};

module.exports = {
  sendOtp,
  verifyOtp
};
