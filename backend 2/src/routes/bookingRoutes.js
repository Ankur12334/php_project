const express = require('express');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const validate = require('../middleware/validate');
const { createBooking, getUserBookings, getOwnerNotifications } = require('../controllers/bookingController');
const { createBookingValidation } = require('../validators/bookingValidator');

const router = express.Router();

router.post('/', auth, role('user'), createBookingValidation, validate, createBooking);
router.get('/user', auth, role('user'), getUserBookings);
router.get('/owner', auth, role('user'), getOwnerNotifications);

module.exports = router;
