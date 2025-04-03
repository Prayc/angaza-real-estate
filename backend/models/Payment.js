//backend/models/Payment.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  paymentDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  paymentType: {
    type: DataTypes.ENUM('rent', 'deposit', 'maintenance', 'other'),
    allowNull: false,
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'bank_transfer', 'mobile_money', 'card'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending',
  },
  reference: {
    type: DataTypes.STRING,
  },
  tenantId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Users',
      key: 'id',
    },
    allowNull: false,
  },
  leaseId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Leases',
      key: 'id',
    },
    allowNull: false,
  },
});

module.exports = Payment;
