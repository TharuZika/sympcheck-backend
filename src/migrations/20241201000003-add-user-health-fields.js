'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'birthday', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    
    await queryInterface.addColumn('users', 'weight', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
    });
    
    await queryInterface.addColumn('users', 'height', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
    });
    
    await queryInterface.addColumn('users', 'bmi', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'birthday');
    await queryInterface.removeColumn('users', 'weight');
    await queryInterface.removeColumn('users', 'height');
    await queryInterface.removeColumn('users', 'bmi');
  }
};
