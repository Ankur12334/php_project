const { body } = require('express-validator');

const indianPhoneRule = /^[6-9]\d{9}$/;

const googleAuthValidation = [
  body('idToken').isString().notEmpty()
];

const sendOtpValidation = [
  body('phone').matches(indianPhoneRule).withMessage('Phone must be a valid 10-digit Indian mobile number')
];

const verifyOtpValidation = [
  body('phone').matches(indianPhoneRule).withMessage('Phone must be a valid 10-digit Indian mobile number'),
  body('code').isString().isLength({ min: 4, max: 8 }),
  body('registrationToken').optional({ nullable: true, checkFalsy: true }).isString()
];

const completeRegistrationValidation = [
  body('registrationToken').isString().notEmpty(),
  body('name').isString().isLength({ min: 2 }),
  body('email').optional({ nullable: true, checkFalsy: true }).isEmail(),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .matches(indianPhoneRule)
    .withMessage('Phone must be a valid 10-digit Indian mobile number'),
  body('phoneVerificationToken').optional({ nullable: true, checkFalsy: true }).isString()
];

module.exports = {
  googleAuthValidation,
  sendOtpValidation,
  verifyOtpValidation,
  completeRegistrationValidation
};
