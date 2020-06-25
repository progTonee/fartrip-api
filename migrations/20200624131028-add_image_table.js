'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('image',
      {
        id: {
          field: 'id',
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true
        },
        accountId: {
          field: 'account_id',
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            key: 'id',
            model: 'account'
          }
        },
        image: {
          field: 'image',
          type: Sequelize.STRING,
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
        }
      },
      { cherset: 'utf8', collate: 'utf8_unicode_ci' }
    );
  },

  down: queryInterface => {
    return queryInterface.dropTable('image');
  }
};