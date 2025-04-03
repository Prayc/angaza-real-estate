//backend/models/Lease.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Lease = sequelize.define('Lease', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  rentAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  securityDeposit: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'terminated'),
    defaultValue: 'active',
  },
  tenantId: {
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
  leaseDocument: {
    type: DataTypes.STRING, // path to uploaded document
  },
});

module.exports = Lease;
