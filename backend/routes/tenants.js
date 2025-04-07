// backend/routes/tenants.js
const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { User, Lease, Unit, Property, Payment } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const router = express.Router();

// backend/routes/tenants.js - create tenant endpoint
router.post(
  '/',
  authenticate,
  authorize(['admin', 'landlord', 'property_manager']),
  async (req, res) => {
    try {
      const { name, email, password, phone } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }

      console.log('Creating tenant with creator ID:', req.user.id); // Add logging

      // Create new tenant with createdBy field set to the current user's ID
      const tenant = await User.create({
        name,
        email,
        password,
        phone,
        role: 'tenant',
        createdBy: req.user.id, // Set the creator ID here
      });

      res.status(201).json({
        message: 'Tenant created successfully',
        tenant: {
          id: tenant.id,
          name: tenant.name,
          email: tenant.email,
          phone: tenant.phone,
          role: tenant.role,
          createdBy: tenant.createdBy,
        },
      });
    } catch (error) {
      console.error('Create tenant error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get all tenants - Updated with role-based access control
router.get(
  '/',
  authenticate,
  authorize(['admin', 'landlord', 'property_manager']),
  async (req, res) => {
    try {
      let where = { role: 'tenant' };
      let includeOptions = [
        {
          model: Lease,
          as: 'leases',
          include: [
            {
              model: Unit,
              as: 'unit',
              include: [
                {
                  model: Property,
                  as: 'property',
                },
              ],
            },
          ],
        },
        {
          model: Payment,
          as: 'payments',
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ];

      console.log('Request query params:', req.query);
      console.log('User making request:', req.user.id, req.user.role);

      // If requesting only the tenants created by this user (for assignment)
      if (req.query.createdBy === 'own' && req.user.role === 'landlord') {
        // Debug log
        console.log('Filtering tenants by createdBy:', req.user.id);

        where = {
          role: 'tenant',
          createdBy: Number(req.user.id), // Explicitly cast to number
        };

        console.log('Query where clause:', where);

        // For assignment, we need simpler data
        const ownTenants = await User.findAll({
          where: where,
          attributes: { exclude: ['password'] },
          order: [['createdAt', 'DESC']],
        });

        console.log('Found tenants count:', ownTenants.length);

        // Let's check all tenants with this landlord's ID regardless of role
        const allCreated = await User.findAll({
          where: { createdBy: req.user.id },
          attributes: ['id', 'name', 'email', 'role', 'createdBy'],
        });

        console.log('All users created by this user:', allCreated.length);
        console.log(
          'All created users details:',
          JSON.stringify(allCreated, null, 2)
        );

        // As a fallback, let's return all tenants if none are found
        if (ownTenants.length === 0) {
          const allTenants = await User.findAll({
            where: { role: 'tenant' },
            attributes: { exclude: ['password'] },
            limit: 10, // Limit for safety
          });

          console.log(
            'Fallback: returning all tenants count:',
            allTenants.length
          );
          return res.status(200).json(allTenants);
        }

        return res.status(200).json(ownTenants);
      }

      // For landlords, the normal filter applies
      if (req.user.role === 'landlord') {
        console.log('Landlord filter - normal view');

        // Find all properties owned by this landlord
        const properties = await Property.findAll({
          where: { landlordId: req.user.id },
          attributes: ['id'],
        });

        const propertyIds = properties.map((property) => property.id);
        console.log('Landlord properties:', propertyIds);

        if (propertyIds.length === 0) {
          // If landlord has no properties, only show tenants they created
          console.log('Landlord has no properties, showing created tenants');
          where.createdBy = req.user.id;
        } else {
          // Find tenants that have leases in units that belong to the landlord's properties
          console.log('Finding tenants in landlord properties');

          try {
            // Use a raw query to get tenants with leases in landlord's properties
            const [tenantIds] = await sequelize.query(`
              SELECT DISTINCT u.id 
              FROM Users u
              JOIN Leases l ON u.id = l.tenantId
              JOIN Units un ON l.unitId = un.id
              JOIN Properties p ON un.propertyId = p.id
              WHERE u.role = 'tenant'
              AND p.landlordId = ${req.user.id}
            `);

            console.log(
              'Tenant IDs from raw query:',
              tenantIds.map((t) => t.id)
            );

            if (tenantIds.length > 0) {
              where = {
                role: 'tenant',
                id: { [Op.in]: tenantIds.map((t) => t.id) },
              };
            } else {
              // No tenants found, show created tenants as fallback
              where.createdBy = req.user.id;
            }
          } catch (queryError) {
            console.error('Error executing raw query:', queryError);
            // Fallback to simpler approach
            where.createdBy = req.user.id;
          }
        }
      }

      console.log('Final where clause for main query:', where);

      const tenants = await User.findAll({
        where: where,
        attributes: { exclude: ['password'] },
        include: includeOptions,
        order: [['createdAt', 'DESC']],
      });

      console.log('Final tenants count:', tenants.length);

      res.status(200).json(tenants);
    } catch (error) {
      console.error('Get tenants error:', error);
      res.status(500).json({
        message: 'Server error',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }
);

// Get tenant by ID
// Get tenant by ID - Updated with role-based access control
router.get(
  '/:id',
  authenticate,
  authorize(['admin', 'property_manager', 'landlord']),
  async (req, res) => {
    try {
      const tenant = await User.findOne({
        where: { id: req.params.id, role: 'tenant' },
        attributes: { exclude: ['password'] },
        include: [
          {
            model: Lease,
            as: 'leases',
            include: [
              {
                model: Unit,
                as: 'unit',
                include: [
                  {
                    model: Property,
                    as: 'property',
                  },
                ],
              },
            ],
          },
          {
            model: Payment,
            as: 'payments',
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email'],
          },
        ],
      });

      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      // For landlords, check if:
      // 1. Tenant has a lease in one of their properties, OR
      // 2. Landlord created this tenant
      if (req.user.role === 'landlord') {
        const hasLeaseInLandlordProperty = tenant.leases.some(
          (lease) =>
            lease.unit &&
            lease.unit.property &&
            lease.unit.property.landlordId === req.user.id
        );

        const wasCreatedByLandlord =
          tenant.creator && tenant.creator.id === req.user.id;

        // Log for debugging
        console.log('Tenant access check:', {
          hasLeaseInProperty: hasLeaseInLandlordProperty,
          wasCreatedByLandlord: wasCreatedByLandlord,
          tenantCreatedBy: tenant.createdBy,
          landlordId: req.user.id,
        });

        if (!hasLeaseInLandlordProperty && !wasCreatedByLandlord) {
          return res.status(403).json({
            message: 'Not authorized to access this tenant',
          });
        }
      }

      res.status(200).json(tenant);
    } catch (error) {
      console.error('Get tenant error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update tenant
router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'landlord', 'property_manager']),
  async (req, res) => {
    try {
      const { name, email, phone, isActive } = req.body;

      const tenant = await User.findOne({
        where: { id: req.params.id, role: 'tenant' },
      });

      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      // Update tenant details
      tenant.name = name || tenant.name;
      tenant.email = email || tenant.email;
      tenant.phone = phone || tenant.phone;
      tenant.isActive = isActive !== undefined ? isActive : tenant.isActive;

      await tenant.save();

      res.status(200).json({
        message: 'Tenant updated successfully',
        tenant: {
          id: tenant.id,
          name: tenant.name,
          email: tenant.email,
          phone: tenant.phone,
          isActive: tenant.isActive,
          role: tenant.role,
        },
      });
    } catch (error) {
      console.error('Update tenant error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete tenant
router.delete(
  '/:id',
  authenticate,
  authorize(['admin', 'landlord']),
  async (req, res) => {
    try {
      const tenant = await User.findOne({
        where: { id: req.params.id, role: 'tenant' },
        include: [
          {
            model: Lease,
            as: 'leases',
          },
        ],
      });

      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      // Check if tenant has active leases
      const hasActiveLeases = tenant.leases.some(
        (lease) => lease.status === 'active'
      );

      if (hasActiveLeases) {
        // You could either prevent deletion or handle the cleanup
        // For now, we'll allow deletion with a warning (handled in the frontend)

        // Terminate all active leases
        await Promise.all(
          tenant.leases
            .filter((lease) => lease.status === 'active')
            .map(async (lease) => {
              lease.status = 'terminated';
              await lease.save();

              // Update unit status to vacant
              await Unit.update(
                { status: 'vacant' },
                { where: { id: lease.unitId } }
              );
            })
        );
      }

      // Delete the tenant
      await tenant.destroy();

      res.status(200).json({
        message: 'Tenant deleted successfully',
      });
    } catch (error) {
      console.error('Delete tenant error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
