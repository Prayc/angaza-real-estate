//backend/models/Property.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Property = sequelize.define('Property', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('residential', 'commercial', 'mixed-use'),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  totalUnits: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  availableUnits: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  image: {
    type: DataTypes.STRING,
  },
  landlordId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
});

module.exports = Property;
