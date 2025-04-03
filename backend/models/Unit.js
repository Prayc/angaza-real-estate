//backend/models/Unit.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Unit = sequelize.define('Unit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  unitNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING, // e.g., "1BHK", "2BHK", "Studio"
    allowNull: false,
  },
  size: {
    type: DataTypes.FLOAT, // in square feet/meters
  },
  rent: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('vacant', 'occupied', 'maintenance'),
    defaultValue: 'vacant',
  },
  description: {
    type: DataTypes.TEXT,
  },
  propertyId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Properties',
      key: 'id',
    },
    allowNull: false,
  },
});

module.exports = Unit;
