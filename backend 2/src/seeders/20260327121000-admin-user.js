'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('users', [{
      name: 'Admin User',
      email: 'admin@roomfinder.com',
      phone: '+10000000000',
      role: 'admin',
      is_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    }], { ignoreDuplicates: true });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: 'admin@roomfinder.com' });
  }
};
