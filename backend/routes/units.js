// backend/routes/units.js
const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { Property, Unit } = require('../models');
const router = express.Router();

// backend/routes/units.js

// Create a new unit
router.post(
  '/',
  authenticate,
  authorize(['admin', 'property_manager', 'landlord']),
  async (req, res) => {
    try {
      const {
        propertyId,
        unitNumber,
        type,
        size,
        rent,
        status = 'vacant',
      } = req.body;

      // Verify the property exists
      const property = await Property.findByPk(propertyId, {
        include: [{ model: Unit, as: 'units' }],
      });

      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }

      // Check if current user is authorized to add units to this property
      if (req.user.role === 'landlord' && property.landlordId !== req.user.id) {
        return res.status(403).json({
          message: 'Not authorized to add units to this property',
        });
      }

      // Check if we've reached the total units limit
      const currentUnitCount = property.units.length;
      if (currentUnitCount >= property.totalUnits) {
        return res.status(400).json({
          message: `Cannot add more units. Property already has ${currentUnitCount} units out of ${property.totalUnits} total.`,
        });
      }

      // Create the unit
      const unit = await Unit.create({
        propertyId,
        unitNumber,
        type,
        size,
        rent,
        status,
      });

      // If the unit is not vacant, decrease availableUnits
      if (status !== 'vacant') {
        await property.update({
          availableUnits: Math.max(0, property.availableUnits - 1),
        });
      }

      res.status(201).json({
        message: 'Unit created successfully',
        unit,
      });
    } catch (error) {
      console.error('Create unit error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update unit
router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'property_manager', 'landlord']),
  async (req, res) => {
    try {
      const { unitNumber, type, size, rent, status } = req.body;

      const unit = await Unit.findByPk(req.params.id, {
        include: [
          {
            model: Property,
            as: 'property',
            include: [{ model: Unit, as: 'units' }],
          },
        ],
      });

      if (!unit) {
        return res.status(404).json({ message: 'Unit not found' });
      }

      // Check if current user is authorized to update this unit
      if (
        req.user.role === 'landlord' &&
        unit.property.landlordId !== req.user.id
      ) {
        return res.status(403).json({
          message: 'Not authorized to update this unit',
        });
      }

      // Handle property's availableUnits count if status changes
      const oldStatus = unit.status;
      const newStatus = status || oldStatus;

      if (oldStatus !== newStatus && unit.property) {
        if (oldStatus === 'vacant' && newStatus !== 'vacant') {
          // Unit is no longer vacant, decrease available units
          await unit.property.update({
            availableUnits: Math.max(0, unit.property.availableUnits - 1),
          });
        } else if (oldStatus !== 'vacant' && newStatus === 'vacant') {
          // Unit is now vacant, increase available units
          await unit.property.update({
            availableUnits: unit.property.availableUnits + 1,
          });
        }
      }

      // Update unit
      await unit.update({
        unitNumber: unitNumber || unit.unitNumber,
        type: type || unit.type,
        size: size !== undefined ? size : unit.size,
        rent: rent || unit.rent,
        status: newStatus,
      });

      res.status(200).json({
        message: 'Unit updated successfully',
        unit,
      });
    } catch (error) {
      console.error('Update unit error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete unit
router.delete(
  '/:id',
  authenticate,
  authorize(['admin', 'property_manager', 'landlord']),
  async (req, res) => {
    try {
      const unit = await Unit.findByPk(req.params.id, {
        include: [
          {
            model: Property,
            as: 'property',
            include: [{ model: Unit, as: 'units' }],
          },
        ],
      });

      if (!unit) {
        return res.status(404).json({ message: 'Unit not found' });
      }

      // Check if current user is authorized to delete this unit
      if (
        req.user.role === 'landlord' &&
        unit.property.landlordId !== req.user.id
      ) {
        return res.status(403).json({
          message: 'Not authorized to delete this unit',
        });
      }

      // Only adjust availableUnits if the unit was vacant
      if (unit.status === 'vacant' && unit.property) {
        await unit.property.update({
          availableUnits: Math.max(0, unit.property.availableUnits - 1),
        });
      }

      await unit.destroy();

      res.status(200).json({
        message: 'Unit deleted successfully',
      });
    } catch (error) {
      console.error('Delete unit error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get all units - Updated for role-based access control
router.get('/', authenticate, async (req, res) => {
  try {
    // Add filters based on query parameters
    const where = {};

    if (req.query.propertyId) {
      where.propertyId = req.query.propertyId;

      // If a specific property is requested, verify access for landlords
      if (req.user.role === 'landlord') {
        const property = await Property.findByPk(req.query.propertyId);
        if (!property || property.landlordId !== req.user.id) {
          return res.status(403).json({
            message: 'Not authorized to access units for this property',
          });
        }
      }
    }

    if (req.query.status) {
      where.status = req.query.status;
    }

    let units;

    // If user is admin or property_manager, they can see all requested units
    if (req.user.role === 'admin' || req.user.role === 'property_manager') {
      units = await Unit.findAll({
        where,
        include: [
          {
            model: Property,
            as: 'property',
            attributes: ['id', 'name', 'address', 'landlordId'],
          },
        ],
      });
    }
    // For landlords, limit to their properties
    else if (req.user.role === 'landlord') {
      // If no specific property is requested, get all units from all properties owned by this landlord
      if (!req.query.propertyId) {
        units = await Unit.findAll({
          where,
          include: [
            {
              model: Property,
              as: 'property',
              attributes: ['id', 'name', 'address', 'landlordId'],
              where: { landlordId: req.user.id }, // Filter by landlord ID
            },
          ],
        });
      } else {
        // If a specific property was requested and access was already verified above
        units = await Unit.findAll({
          where,
          include: [
            {
              model: Property,
              as: 'property',
              attributes: ['id', 'name', 'address', 'landlordId'],
            },
          ],
        });
      }
    }
    // For tenants or other roles, return empty or filtered list
    else {
      units = [];
    }

    res.status(200).json(units);
  } catch (error) {
    console.error('Get units error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unit by ID - Updated for role-based access control
router.get('/:id', authenticate, async (req, res) => {
  try {
    const unit = await Unit.findByPk(req.params.id, {
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'name', 'address', 'landlordId'],
        },
      ],
    });

    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    // Check if user has permission to view this unit
    if (
      req.user.role === 'landlord' &&
      unit.property.landlordId !== req.user.id
    ) {
      return res.status(403).json({
        message: 'Not authorized to access this unit',
      });
    }

    res.status(200).json(unit);
  } catch (error) {
    console.error('Get unit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
module.exports = router;
