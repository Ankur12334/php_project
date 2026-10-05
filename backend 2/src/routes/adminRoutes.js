const express = require('express');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const {
  getDashboard,
  approveRoom,
  rejectRoom,
  getPendingRooms,
  getAllUsers,
  getReports
} = require('../controllers/adminController');

const router = express.Router();

router.use(auth, role('admin'));

router.get('/dashboard', getDashboard);
router.get('/rooms/pending', getPendingRooms);
router.put('/rooms/:id/approve', approveRoom);
router.put('/rooms/:id/reject', rejectRoom);
router.get('/users', getAllUsers);
router.get('/reports', getReports);

module.exports = router;
