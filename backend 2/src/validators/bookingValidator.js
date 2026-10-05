const { body } = require('express-validator');

const createBookingValidation = [
  body('roomId').isInt({ min: 1 }),
  body('message').optional({ nullable: true, checkFalsy: true }).isString().isLength({ min: 5, max: 500 })
];

module.exports = {
  createBookingValidation
};
