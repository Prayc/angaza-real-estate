//backend/models/Maintenance.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Maintenance = sequelize.define('Maintenance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'in-progress', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'emergency'),
    defaultValue: 'normal',
  },
  createdBy: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Users',
      key: 'id',
    },
    allowNull: false,
  },
  unitId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Units',
      key: 'id',
    },
    allowNull: false,
  },
  completedAt: {
    type: DataTypes.DATE,
  },
  assignedTo: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
});

module.exports = Maintenance;
