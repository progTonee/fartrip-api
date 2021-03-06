'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('accounts',
      {
        id: {
          field: 'id',
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true
        },
        roleId: {
          field: 'role_id',
          type: Sequelize.INTEGER,
          allowNull: false,
          onDelete: 'CASCADE',
          references: {
            key: 'id',
            model: 'roles'
          }
        },
        email: {
          field: 'email',
          type: Sequelize.STRING(255),
          allowNull: false
        },
        password: {
          field: 'password',
          type: Sequelize.STRING,
          allowNull: false
        },
        name: {
          field: 'name',
          type: Sequelize.STRING(20),
          allowNull: false
        },
        age: {
          field: 'age',
          type: Sequelize.STRING(20),
          allowNull: false
        },
        createdDateTime: {
          field: 'created_date_time',
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        modifiedDateTime: {
          field: 'modified_date_time',
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
      },
      { charset: 'utf8', collate: 'utf8_unicode_ci' }
    );
  },

  down: queryInterface => {
    return queryInterface.dropTable('accounts');
  }
};
