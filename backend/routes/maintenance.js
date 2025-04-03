// backend/routes/maintenance.js
const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { Maintenance, Unit, Property, User, Lease } = require('../models');
const router = express.Router();

// Get all maintenance requests with role-based filtering
router.get('/', authenticate, async (req, res) => {
  try {
    let where = {};
    let include = [
      {
        model: Unit,
        as: 'unit',
        include: [
          {
            model: Property,
            as: 'property',
            include: [
              {
                model: User,
                as: 'landlord',
                attributes: ['id', 'name', 'email', 'phone'],
              },
            ],
          },
        ],
      },
      {
        model: User,
        as: 'requester',
        attributes: ['id', 'name', 'email', 'phone'],
      },
      {
        model: User,
        as: 'assignee',
        attributes: ['id', 'name', 'email', 'phone'],
      },
    ];

    // Filter based on user role
    if (req.user.role === 'tenant') {
      // Tenants can only see their own requests
      where.createdBy = req.user.id;
    } else if (req.user.role === 'landlord') {
      // Landlords can see requests for units in their properties
      include = [
        {
          model: Unit,
          as: 'unit',
          required: true,
          include: [
            {
              model: Property,
              as: 'property',
              required: true,
              where: { landlordId: req.user.id },
              include: [
                {
                  model: User,
                  as: 'landlord',
                  attributes: ['id', 'name', 'email', 'phone'],
                },
              ],
            },
          ],
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'email', 'phone'],
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'phone'],
        },
      ];
    }

    // Apply status filter if provided
    if (req.query.status) {
      where.status = req.query.status;
    }

    // Apply unit filter if provided
    if (req.query.unitId) {
      where.unitId = req.query.unitId;
    }

    // Apply property filter if provided
    if (req.query.propertyId) {
      include[0].include[0].where = {
        ...(include[0].include[0].where || {}),
        id: req.query.propertyId,
      };
    }

    const maintenanceRequests = await Maintenance.findAll({
      where,
      include,
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(maintenanceRequests);
  } catch (error) {
    console.error('Get maintenance requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get maintenance request by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const maintenanceRequest = await Maintenance.findByPk(req.params.id, {
      include: [
        {
          model: Unit,
          as: 'unit',
          include: [
            {
              model: Property,
              as: 'property',
              include: [
                {
                  model: User,
                  as: 'landlord',
                  attributes: ['id', 'name', 'email', 'phone'],
                },
              ],
            },
          ],
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'email', 'phone'],
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'phone'],
        },
      ],
    });

    if (!maintenanceRequest) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Check permissions
    const isOwnRequest = maintenanceRequest.createdBy === req.user.id;
    const isLandlord =
      req.user.role === 'landlord' &&
      maintenanceRequest.unit?.property?.landlordId === req.user.id;
    const isAdmin =
      req.user.role === 'admin' || req.user.role === 'property_manager';

    if (!isOwnRequest && !isLandlord && !isAdmin) {
      return res
        .status(403)
        .json({ message: 'Not authorized to view this maintenance request' });
    }

    res.status(200).json(maintenanceRequest);
  } catch (error) {
    console.error('Get maintenance request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new maintenance request
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, unitId, priority } = req.body;

    // Validate unit exists
    const unit = await Unit.findByPk(unitId, {
      include: [{ model: Property, as: 'property' }],
    });

    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    // Check if tenant has access to the unit (for tenants only)
    if (req.user.role === 'tenant') {
      const hasLease = await Lease.findOne({
        where: {
          unitId,
          tenantId: req.user.id,
          status: 'active',
        },
      });

      if (!hasLease) {
        return res
          .status(403)
          .json({ message: 'You are not a tenant of this unit' });
      }
    }

    // Create the maintenance request
    const maintenanceRequest = await Maintenance.create({
      title,
      description,
      unitId,
      priority: priority || 'normal',
      status: 'pending',
      createdBy: req.user.id,
      assignedTo: unit.property.landlordId, // Assign to landlord by default
    });

    res.status(201).json({
      message: 'Maintenance request created successfully',
      maintenanceRequest,
    });
  } catch (error) {
    console.error('Create maintenance request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update maintenance request
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { status, priority, notes, assignedTo } = req.body;

    const maintenanceRequest = await Maintenance.findByPk(req.params.id, {
      include: [
        {
          model: Unit,
          as: 'unit',
          include: [{ model: Property, as: 'property' }],
        },
      ],
    });

    if (!maintenanceRequest) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Check permissions for updating
    const isOwnRequest = maintenanceRequest.createdBy === req.user.id;
    const isLandlord =
      req.user.role === 'landlord' &&
      maintenanceRequest.unit?.property?.landlordId === req.user.id;
    const isAdmin =
      req.user.role === 'admin' || req.user.role === 'property_manager';

    // Tenants can only update their own requests and can't change status
    if (req.user.role === 'tenant') {
      if (!isOwnRequest) {
        return res
          .status(403)
          .json({ message: 'Not authorized to update this request' });
      }

      // Tenants can only update description and notes, not status
      if (status) {
        return res
          .status(403)
          .json({ message: 'Tenants cannot change request status' });
      }
    }

    // Check if landlord has permission
    if (req.user.role === 'landlord' && !isLandlord) {
      return res
        .status(403)
        .json({ message: 'Not authorized to update this request' });
    }

    // Update the request
    if (req.user.role === 'tenant') {
      // Limited update for tenants
      if (req.body.description)
        maintenanceRequest.description = req.body.description;
      if (notes) maintenanceRequest.notes = notes;
    } else {
      // Full update for landlords, admins, property managers
      if (status) maintenanceRequest.status = status;
      if (priority) maintenanceRequest.priority = priority;
      if (notes) maintenanceRequest.notes = notes;
      if (assignedTo) maintenanceRequest.assignedTo = assignedTo;
    }

    await maintenanceRequest.save();

    res.status(200).json({
      message: 'Maintenance request updated successfully',
      maintenanceRequest,
    });
  } catch (error) {
    console.error('Update maintenance request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
