const { body, query } = require('express-validator');

const amenitiesValidator = (value) => {
  if (value === undefined || value === null || value === '') return true;

  if (Array.isArray(value)) return true;

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed);
    } catch (err) {
      // Also allow comma-separated plain string amenities.
      return value.split(',').map((i) => i.trim()).filter(Boolean).length > 0;
    }
  }

  return false;
};

const createRoomValidation = [
  body('title').isString().isLength({ min: 2 }),
  body('description').isString().isLength({ min: 3 }),
  body('price').isFloat({ min: 1 }),
  body('pricing_type').isIn(['night', 'month']),
  body('city').isString().notEmpty(),
  body('state').isString().notEmpty(),
  body('pincode').isString().notEmpty(),
  body('amenities').optional().custom(amenitiesValidator)
];

const updateRoomValidation = [
  body('title').optional().isString().isLength({ min: 2 }),
  body('description').optional().isString().isLength({ min: 3 }),
  body('price').optional().isFloat({ min: 1 }),
  body('pricing_type').optional().isIn(['night', 'month']),
  body('city').optional().isString(),
  body('state').optional().isString(),
  body('pincode').optional().isString(),
  body('amenities').optional().custom(amenitiesValidator)
];

const listRoomsValidation = [
  query('page').optional({ checkFalsy: true }).isInt({ min: 1 }),
  query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 100 }),
  query('minPrice').optional({ checkFalsy: true }).isFloat({ min: 0 }),
  query('maxPrice').optional({ checkFalsy: true }).isFloat({ min: 0 }),
  query('city').optional({ checkFalsy: true }).isString(),
  query('state').optional({ checkFalsy: true }).isString(),
  query('amenities').optional({ checkFalsy: true }).isString()
];

module.exports = {
  createRoomValidation,
  updateRoomValidation,
  listRoomsValidation
};
