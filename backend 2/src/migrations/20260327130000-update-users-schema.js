'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('users');

    if (!Object.prototype.hasOwnProperty.call(tableDescription, 'password_hash')) {
      await queryInterface.addColumn('users', 'password_hash', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    // Normalize legacy role values before enum narrowing.
    await queryInterface.sequelize.query("UPDATE users SET role='user' WHERE role IN ('owner','customer')");

    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('admin', 'user'),
      allowNull: false,
      defaultValue: 'user'
    });
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeColumn('users', 'password_hash');
    } catch (err) {
      // Ignore if already removed.
    }

    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('owner', 'customer', 'admin'),
      allowNull: false,
      defaultValue: 'customer'
    });

    await queryInterface.sequelize.query("UPDATE users SET role='customer' WHERE role='user'");
  }
};
