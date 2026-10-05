'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('bookings', 'message', {
      type: Sequelize.TEXT,
      allowNull: true,
      after: 'end_date'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('bookings', 'message');
  }
};
