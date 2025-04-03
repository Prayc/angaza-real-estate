// backend/routes/leases.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticate, authorize } = require('../middleware/auth');
const { Lease, User, Unit } = require('../models');
const router = express.Router();
const { Op } = require('sequelize');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/leases');
  },
  filename: (req, file, cb) => {
    cb(null, `lease-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (extname) {
      return cb(null, true);
    }

    cb(new Error('Only images and documents are allowed!'));
  },
});

// backend/routes/leases.js
// Update the GET all leases endpoint

// Get all leases
router.get('/', authenticate, async (req, res) => {
  try {
    // Filter leases based on user role and query params
    let where = {};
    let include = [
      {
        model: User,
        as: 'tenant',
        attributes: ['id', 'name', 'email', 'phone'],
      },
      {
        model: Unit,
        as: 'unit',
        include: [
          {
            association: 'property',
          },
        ],
      },
    ];

    // Query parameter filters
    if (req.query.status) {
      where.status = req.query.status;
    }

    // Role-based filtering
    if (req.user.role === 'tenant') {
      // Tenants can only see their own leases
      where.tenantId = req.user.id;
    } else if (req.user.role === 'landlord') {
      // For landlords, we need to filter by properties they own
      // This requires a more complex query structure
      const { Property } = require('../models');

      // Get the properties owned by this landlord
      const properties = await Property.findAll({
        where: { landlordId: req.user.id },
        attributes: ['id'],
      });

      const propertyIds = properties.map((property) => property.id);

      if (propertyIds.length === 0) {
        // If landlord has no properties, return empty array
        return res.status(200).json([]);
      }

      // Modify the include to filter units by property
      include = [
        {
          model: User,
          as: 'tenant',
          attributes: ['id', 'name', 'email', 'phone'],
        },
        {
          model: Unit,
          as: 'unit',
          required: true,
          include: [
            {
              association: 'property',
              required: true,
              where: {
                id: { [Op.in]: propertyIds },
                landlordId: req.user.id,
              },
            },
          ],
        },
      ];
    }
    // Admin and property_manager see all leases by default

    const leases = await Lease.findAll({
      where,
      include,
      order: [['createdAt', 'DESC']], // Most recent leases first
    });

    res.status(200).json(leases);
  } catch (error) {
    console.error('Get leases error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Get lease by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const lease = await Lease.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'tenant',
          attributes: ['id', 'name', 'email', 'phone'],
        },
        {
          model: Unit,
          as: 'unit',
          include: [
            {
              association: 'property',
            },
          ],
        },
      ],
    });

    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }

    // Check if user has permission to view this lease
    if (req.user.role === 'tenant' && lease.tenantId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.status(200).json(lease);
  } catch (error) {
    console.error('Get lease error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new lease
router.post(
  '/',
  authenticate,
  authorize(['admin', 'property_manager', 'landlord']),
  upload.single('leaseDocument'),
  async (req, res) => {
    try {
      const {
        startDate,
        endDate,
        rentAmount,
        securityDeposit,
        tenantId,
        unitId,
      } = req.body;

      // Parse and format dates properly
      const formattedStartDate = new Date(startDate);
      const formattedEndDate = new Date(endDate);

      // Check if dates are valid
      if (isNaN(formattedStartDate) || isNaN(formattedEndDate)) {
        return res.status(400).json({
          message: 'Invalid date format. Please use YYYY-MM-DD format.',
        });
      }

      // Get the unit with its associated property
      const unit = await Unit.findByPk(unitId, {
        include: [{ association: 'property' }],
      });

      if (!unit) {
        return res.status(404).json({ message: 'Unit not found' });
      }

      // Create lease
      const lease = await Lease.create({
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        rentAmount,
        securityDeposit,
        status: 'active',
        tenantId,
        unitId,
        leaseDocument: req.file ? `/uploads/leases/${req.file.filename}` : null,
      });

      // Update unit status to occupied
      await unit.update({ status: 'occupied' });

      // Decrease the available units count in the property
      if (unit.property) {
        await unit.property.update({
          availableUnits: Math.max(0, unit.property.availableUnits - 1),
        });
      }

      res.status(201).json({
        message: 'Lease created successfully',
        lease,
      });
    } catch (error) {
      console.error('Create lease error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update lease
router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'property_manager', 'landlord']),
  upload.single('leaseDocument'),
  async (req, res) => {
    try {
      const { startDate, endDate, rentAmount, securityDeposit, status } =
        req.body;

      const lease = await Lease.findByPk(req.params.id);
      if (!lease) {
        return res.status(404).json({ message: 'Lease not found' });
      }

      // Update lease
      lease.startDate = startDate || lease.startDate;
      lease.endDate = endDate || lease.endDate;
      lease.rentAmount = rentAmount || lease.rentAmount;
      lease.securityDeposit = securityDeposit || lease.securityDeposit;
      lease.status = status || lease.status;

      if (req.file) {
        lease.leaseDocument = `/uploads/leases/${req.file.filename}`;
      }

      await lease.save();

      // If lease is terminated, update unit status to vacant
      if (status === 'terminated') {
        await Unit.update(
          { status: 'vacant' },
          { where: { id: lease.unitId } }
        );
      }

      res.status(200).json({
        message: 'Lease updated successfully',
        lease,
      });
    } catch (error) {
      console.error('Update lease error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
