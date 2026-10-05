'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('bookings', 'start_date', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });

    await queryInterface.changeColumn('bookings', 'end_date', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('bookings', 'start_date', {
      type: Sequelize.DATEONLY,
      allowNull: false
    });

    await queryInterface.changeColumn('bookings', 'end_date', {
      type: Sequelize.DATEONLY,
      allowNull: false
    });
  }
};
