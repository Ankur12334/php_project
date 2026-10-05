const { Op, fn, col, where } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const { Room, RoomImage, User } = require('../models');

const parseAmenities = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  try {
    return JSON.parse(input);
  } catch (err) {
    return String(input).split(',').map((item) => item.trim()).filter(Boolean);
  }
};

const listRooms = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const offset = (page - 1) * limit;

  const filters = {
    status: 'approved'
  };

  if (req.query.city) {
    filters.city = { [Op.like]: `%${req.query.city}%` };
  }
  if (req.query.state) {
    filters.state = { [Op.like]: `%${req.query.state}%` };
  }
  if (req.query.minPrice || req.query.maxPrice) {
    filters.price = {};
    if (req.query.minPrice) filters.price[Op.gte] = Number(req.query.minPrice);
    if (req.query.maxPrice) filters.price[Op.lte] = Number(req.query.maxPrice);
  }

  const amenities = req.query.amenities
    ? req.query.amenities.split(',').map((i) => i.trim()).filter(Boolean)
    : [];

  const whereQuery = { ...filters };
  if (amenities.length) {
    whereQuery[Op.and] = amenities.map((amenity) =>
      where(fn('JSON_CONTAINS', col('amenities'), JSON.stringify(amenity)), 1)
    );
  }

  const { rows, count } = await Room.findAndCountAll({
    where: whereQuery,
    include: [
      { model: RoomImage, as: 'images' },
      { model: User, as: 'owner', attributes: ['id', 'name', 'phone', 'email'] }
    ],
    distinct: true,
    col: 'id',
    order: [['created_at', 'DESC']],
    offset,
    limit
  });

  res.json({
    data: rows,
    meta: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
});

const getRoomById = asyncHandler(async (req, res) => {
  const room = await Room.findByPk(req.params.id, {
    include: [
      { model: RoomImage, as: 'images' },
      { model: User, as: 'owner', attributes: ['id', 'name', 'phone', 'email'] }
    ]
  });

  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }

  if (room.status !== 'approved') {
    if (!req.user || (req.user.role !== 'admin' && req.user.id !== room.owner_id)) {
      return res.status(403).json({ message: 'Room is not publicly available' });
    }
  }

  res.json(room);
});

const createRoom = asyncHandler(async (req, res) => {
  const amenities = parseAmenities(req.body.amenities);
  const room = await Room.create({
    owner_id: req.user.id,
    title: req.body.title,
    description: req.body.description,
    price: req.body.price,
    pricing_type: req.body.pricing_type,
    city: req.body.city,
    state: req.body.state,
    pincode: req.body.pincode,
    amenities,
    status: 'pending'
  });

  if (req.files?.length) {
    await RoomImage.bulkCreate(
      req.files.map((file) => ({
        room_id: room.id,
        image_url: `/uploads/rooms/${file.filename}`
      }))
    );
  }

  const saved = await Room.findByPk(room.id, { include: [{ model: RoomImage, as: 'images' }] });
  res.status(201).json(saved);
});

const updateRoom = asyncHandler(async (req, res) => {
  const room = await Room.findByPk(req.params.id);
  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }

  if (room.owner_id !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const amenities = req.body.amenities ? parseAmenities(req.body.amenities) : room.amenities;

  await room.update({
    title: req.body.title ?? room.title,
    description: req.body.description ?? room.description,
    price: req.body.price ?? room.price,
    pricing_type: req.body.pricing_type ?? room.pricing_type,
    city: req.body.city ?? room.city,
    state: req.body.state ?? room.state,
    pincode: req.body.pincode ?? room.pincode,
    amenities,
    status: 'pending'
  });

  if (req.files?.length) {
    await RoomImage.bulkCreate(
      req.files.map((file) => ({
        room_id: room.id,
        image_url: `/uploads/rooms/${file.filename}`
      }))
    );
  }

  const updated = await Room.findByPk(room.id, { include: [{ model: RoomImage, as: 'images' }] });
  res.json(updated);
});

const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findByPk(req.params.id);
  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }

  if (room.owner_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  await room.destroy();
  res.json({ message: 'Room deleted successfully' });
});

const ownerRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.findAll({
    where: { owner_id: req.user.id },
    include: [{ model: RoomImage, as: 'images' }],
    order: [['created_at', 'DESC']]
  });

  res.json(rooms);
});

const contactOwner = asyncHandler(async (req, res) => {
  const room = await Room.findByPk(req.params.id, {
    include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email', 'phone'] }]
  });
  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }

  res.json({
    owner: room.owner,
    message: 'Use these details to contact the owner directly.'
  });
});

module.exports = {
  listRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  ownerRooms,
  contactOwner
};



