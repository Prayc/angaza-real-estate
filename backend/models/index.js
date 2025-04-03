//backend/models/index.js
const User = require('./User');
const Property = require('./Property');
const Unit = require('./Unit');
const Lease = require('./Lease');
const Maintenance = require('./Maintenance');
const Payment = require('./Payment');
const { sequelize } = require('../config/database.js');

// Define relationships
Property.belongsTo(User, { foreignKey: 'landlordId', as: 'landlord' });
User.hasMany(Property, { foreignKey: 'landlordId', as: 'properties' });

Unit.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });
Property.hasMany(Unit, { foreignKey: 'propertyId', as: 'units' });

Lease.belongsTo(User, { foreignKey: 'tenantId', as: 'tenant' });
User.hasMany(Lease, { foreignKey: 'tenantId', as: 'leases' });

Lease.belongsTo(Unit, { foreignKey: 'unitId', as: 'unit' });
Unit.hasMany(Lease, { foreignKey: 'unitId', as: 'leases' });

Maintenance.belongsTo(Unit, { foreignKey: 'unitId', as: 'unit' });
Unit.hasMany(Maintenance, { foreignKey: 'unitId', as: 'maintenanceRequests' });

Maintenance.belongsTo(User, { foreignKey: 'createdBy', as: 'requester' });
Maintenance.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });

Payment.belongsTo(User, { foreignKey: 'tenantId', as: 'tenant' });
User.hasMany(Payment, { foreignKey: 'tenantId', as: 'payments' });

Payment.belongsTo(Lease, { foreignKey: 'leaseId' });
Lease.hasMany(Payment, { foreignKey: 'leaseId', as: 'payments' });

// Add association for tracking which landlord created which tenant
User.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(User, { foreignKey: 'createdBy', as: 'createdUsers' });

// Sync all models with database
const syncDatabase = async () => {
  try {
    // Use force: false and alter: false to prevent automatic table alterations
    // This will only create tables if they don't exist
    await sequelize.sync({ force: false, alter: false });
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Failed to synchronize models:', error);
  }
};

module.exports = {
  User,
  Property,
  Unit,
  Lease,
  Maintenance,
  Payment,
  syncDatabase,
};
