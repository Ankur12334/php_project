const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RoomImage = sequelize.define('RoomImage', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  room_id: { type: DataTypes.INTEGER, allowNull: false },
  image_url: { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: 'room_images'
});

module.exports = RoomImage;
