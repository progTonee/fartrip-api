'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('images',
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
          onDelete: 'CASCADE',
          references: {
            key: 'id',
            model: 'accounts'
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
    return queryInterface.dropTable('images');
  }
};
