const express = require('express');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const {
  listRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  ownerRooms,
  contactOwner
} = require('../controllers/roomController');
const {
  createRoomValidation,
  updateRoomValidation,
  listRoomsValidation
} = require('../validators/roomValidator');

const router = express.Router();

router.get('/', listRoomsValidation, validate, listRooms);
router.get('/my/listings', auth, role('user'), ownerRooms);
router.get('/owner/me', auth, role('user'), ownerRooms);
router.get('/:id/contact', auth, contactOwner);
router.get('/:id', getRoomById);

router.post('/', auth, role('user'), upload.array('images', 8), createRoomValidation, validate, createRoom);
router.put('/:id', auth, role('user'), upload.array('images', 8), updateRoomValidation, validate, updateRoom);
router.delete('/:id', auth, role('user', 'admin'), deleteRoom);

module.exports = router;

