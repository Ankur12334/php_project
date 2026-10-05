const sequelize = require('../config/db');
const User = require('./User');
const Room = require('./Room');
const RoomImage = require('./RoomImage');
const Booking = require('./Booking');

User.hasMany(Room, { foreignKey: 'owner_id', as: 'rooms' });
Room.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

Room.hasMany(RoomImage, { foreignKey: 'room_id', as: 'images', onDelete: 'CASCADE' });
RoomImage.belongsTo(Room, { foreignKey: 'room_id' });

User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'customer' });

Room.hasMany(Booking, { foreignKey: 'room_id', as: 'bookings' });
Booking.belongsTo(Room, { foreignKey: 'room_id', as: 'room' });

module.exports = {
  sequelize,
  User,
  Room,
  RoomImage,
  Booking
};
