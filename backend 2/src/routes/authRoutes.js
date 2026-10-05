const express = require('express');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimit');
const { googleAuth, sendOtp, verifyOtp, completeRegistration } = require('../controllers/authController');
const {
  googleAuthValidation,
  sendOtpValidation,
  verifyOtpValidation,
  completeRegistrationValidation
} = require('../validators/authValidator');

const router = express.Router();

router.post('/google', authLimiter, googleAuthValidation, validate, googleAuth);
router.post('/otp/send', authLimiter, sendOtpValidation, validate, sendOtp);
router.post('/otp/verify', authLimiter, verifyOtpValidation, validate, verifyOtp);
router.post('/register', authLimiter, completeRegistrationValidation, validate, completeRegistration);

module.exports = router;
