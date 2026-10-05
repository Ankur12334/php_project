const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const { User } = require('../models');
const {
  loginWithGoogle,
  signToken,
  signRegistrationToken,
  verifyRegistrationToken,
  signPhoneVerificationToken,
  verifyPhoneVerificationToken
} = require('../services/authService');
const otpService = require('../services/otpService');

const normalizeIndianPhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 10) {
    return digits;
  }
  return '';
};

const buildPhoneVariants = (normalized) => [normalized, `+91${normalized}`];

const googleAuth = asyncHandler(async (req, res) => {
  const result = await loginWithGoogle(req.body);
  res.json(result);
});

const sendOtp = asyncHandler(async (req, res) => {
  const normalizedPhone = normalizeIndianPhone(req.body.phone);
  const phoneVariants = buildPhoneVariants(normalizedPhone);

  const existingUser = await User.findOne({ where: { phone: { [Op.in]: phoneVariants } } });
  const otpPhone = `+91${normalizedPhone}`;
  const result = await otpService.sendOtp(otpPhone);

  res.json({
    message: 'OTP sent successfully',
    userExists: Boolean(existingUser),
    ...(process.env.NODE_ENV !== 'production'
      ? { devCode: result.devCode, warning: result.warning }
      : {})
  });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const normalizedPhone = normalizeIndianPhone(req.body.phone);
  const { code, registrationToken } = req.body;
  const otpPhone = `+91${normalizedPhone}`;
  const isValid = await otpService.verifyOtp(otpPhone, code);

  if (!isValid) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  if (registrationToken) {
    let regPayload;
    try {
      regPayload = verifyRegistrationToken(registrationToken);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid registration token' });
    }

    if (regPayload.authType !== 'google') {
      return res.status(400).json({ message: 'OTP verification context is invalid' });
    }

    const phoneVariants = buildPhoneVariants(normalizedPhone);
    const existingUser = await User.findOne({ where: { phone: { [Op.in]: phoneVariants } } });
    if (existingUser) {
      return res.status(409).json({ message: 'Phone number is already registered. Please login with phone OTP.' });
    }

    return res.json({
      verified: true,
      phone: normalizedPhone,
      phoneVerificationToken: signPhoneVerificationToken({
        authType: 'google',
        google_id: regPayload.google_id,
        phone: normalizedPhone
      })
    });
  }

  const phoneVariants = buildPhoneVariants(normalizedPhone);
  const user = await User.findOne({ where: { phone: { [Op.in]: phoneVariants } } });

  if (user) {
    if (!user.is_verified) {
      user.is_verified = true;
      await user.save();
    }

    return res.json({
      requiresRegistration: false,
      token: signToken(user),
      user
    });
  }

  return res.json({
    requiresRegistration: true,
    authType: 'phone',
    registrationToken: signRegistrationToken({ authType: 'phone', phone: normalizedPhone }),
    prefill: { phone: normalizedPhone }
  });
});

const completeRegistration = asyncHandler(async (req, res) => {
  const { registrationToken, name, email, phone, phoneVerificationToken } = req.body;
  const payload = verifyRegistrationToken(registrationToken);

  const userData = {
    name,
    role: 'user',
    is_verified: true
  };

  if (payload.authType === 'phone') {
    userData.phone = payload.phone;
    if (email) {
      userData.email = email;
    }
  }

  if (payload.authType === 'google') {
    const normalizedPhone = normalizeIndianPhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ message: 'Phone number is required for Google registration' });
    }

    if (!phoneVerificationToken) {
      return res.status(400).json({ message: 'Please verify your phone number with OTP before registration' });
    }

    let verificationPayload;
    try {
      verificationPayload = verifyPhoneVerificationToken(phoneVerificationToken);
    } catch (err) {
      return res.status(400).json({ message: 'Phone verification expired. Please verify OTP again.' });
    }

    if (
      verificationPayload.authType !== 'google' ||
      verificationPayload.google_id !== payload.google_id ||
      verificationPayload.phone !== normalizedPhone
    ) {
      return res.status(400).json({ message: 'Phone verification does not match registration details' });
    }

    userData.google_id = payload.google_id;
    userData.email = payload.email || email || null;
    userData.phone = normalizedPhone;
  }

  const uniqueChecks = [];
  if (userData.email) uniqueChecks.push({ email: userData.email });
  if (userData.phone) {
    const phoneVariants = buildPhoneVariants(userData.phone);
    uniqueChecks.push({ phone: { [Op.in]: phoneVariants } });
  }

  if (uniqueChecks.length) {
    const existing = await User.findOne({ where: { [Op.or]: uniqueChecks } });
    if (existing) {
      return res.status(409).json({ message: 'User already exists. Please login.' });
    }
  }

  const user = await User.create(userData);

  res.status(201).json({
    token: signToken(user),
    user
  });
});

module.exports = {
  googleAuth,
  sendOtp,
  verifyOtp,
  completeRegistration
};
