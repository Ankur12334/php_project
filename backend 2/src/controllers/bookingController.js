const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const { Booking, Room, RoomImage, User } = require('../models');

const createBooking = asyncHandler(async (req, res) => {
  const { roomId, message } = req.body;

  const room = await Room.findByPk(roomId);
  if (!room || room.status !== 'approved') {
    return res.status(404).json({ message: 'Room not available' });
  }

  if (room.owner_id === req.user.id) {
    return res.status(400).json({ message: 'You cannot connect to your own listing' });
  }

  const existing = await Booking.findOne({
    where: {
      user_id: req.user.id,
      room_id: roomId,
      status: { [Op.in]: ['pending', 'confirmed'] }
    }
  });

  if (existing) {
    return res.status(409).json({ message: 'You already sent a connect request for this property' });
  }

  const defaultMessage = `${req.user.name || 'A user'} is interested in this property and trying to connect with you.`;
  const finalMessage = String(message || '').trim() || defaultMessage;

  const booking = await Booking.create({
    user_id: req.user.id,
    room_id: roomId,
    start_date: null,
    end_date: null,
    message: finalMessage,
    status: 'pending'
  });

  res.status(201).json({
    message: 'Connect request sent to owner',
    data: booking
  });
});

const getUserBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.findAll({
    where: { user_id: req.user.id },
    include: [{
      model: Room,
      as: 'room',
      include: [{ model: RoomImage, as: 'images' }, { model: User, as: 'owner', attributes: ['id', 'name', 'phone', 'email'] }]
    }],
    order: [['created_at', 'DESC']]
  });

  res.json(bookings);
});

const getOwnerNotifications = asyncHandler(async (req, res) => {
  const requests = await Booking.findAll({
    include: [
      {
        model: User,
        as: 'customer',
        attributes: ['id', 'name', 'email', 'phone']
      },
      {
        model: Room,
        as: 'room',
        attributes: ['id', 'title', 'city', 'state', 'owner_id'],
        where: { owner_id: req.user.id }
      }
    ],
    order: [['created_at', 'DESC']]
  });

  res.json(requests);
});

module.exports = {
  createBooking,
  getUserBookings,
  getOwnerNotifications
};
