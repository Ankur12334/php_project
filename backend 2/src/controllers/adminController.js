const asyncHandler = require('../utils/asyncHandler');
const { User, Room, Booking, RoomImage } = require('../models');

const getDashboard = asyncHandler(async (req, res) => {
  const [totalUsers, totalListings, totalBookings, pendingListings] = await Promise.all([
    User.count(),
    Room.count(),
    Booking.count(),
    Room.count({ where: { status: 'pending' } })
  ]);

  res.json({
    totalUsers,
    totalListings,
    totalBookings,
    pendingListings
  });
});

const updateRoomStatus = (status) => asyncHandler(async (req, res) => {
  const room = await Room.findByPk(req.params.id);
  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }

  room.status = status;
  await room.save();

  res.json({ message: `Room ${status} successfully`, room });
});

const getPendingRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.findAll({
    where: { status: 'pending' },
    include: [{ model: RoomImage, as: 'images' }],
    order: [['created_at', 'DESC']]
  });
  res.json(rooms);
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll({
    attributes: ['id', 'name', 'email', 'phone', 'role', 'is_verified', 'created_at'],
    order: [['created_at', 'DESC']]
  });
  res.json(users);
});

const getReports = asyncHandler(async (req, res) => {
  const [roomsByStatus, bookingsByStatus, usersByRole] = await Promise.all([
    Room.findAll({ attributes: ['status'] }),
    Booking.findAll({ attributes: ['status'] }),
    User.findAll({ attributes: ['role'] })
  ]);

  const countBy = (rows, field) => rows.reduce((acc, row) => {
    acc[row[field]] = (acc[row[field]] || 0) + 1;
    return acc;
  }, {});

  res.json({
    listings: countBy(roomsByStatus, 'status'),
    bookings: countBy(bookingsByStatus, 'status'),
    users: countBy(usersByRole, 'role')
  });
});

module.exports = {
  getDashboard,
  approveRoom: updateRoomStatus('approved'),
  rejectRoom: updateRoomStatus('rejected'),
  getPendingRooms,
  getAllUsers,
  getReports
};
