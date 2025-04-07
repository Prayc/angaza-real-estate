// backend/routes/properties.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticate, authorize } = require('../middleware/auth');
const { Property, Unit, Lease, User } = require('../models');
const { cloudinary } = require('../config/cloudinary');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype) {
      return cb(null, true);
    }

    cb(new Error('Only image files are allowed!'));
  },
});

// Get all properties - modified to handle role-based access
router.get('/', authenticate, async (req, res) => {
  try {
    let properties;

    // Admin can see all properties
    if (req.user.role === 'admin') {
      properties = await Property.findAll({
        include: [
          { model: Unit, as: 'units' },
          { model: User, as: 'landlord', attributes: ['id', 'name', 'email'] },
        ],
      });
    }
    // Landlords can only see their own properties
    else if (req.user.role === 'landlord') {
      properties = await Property.findAll({
        where: { landlordId: req.user.id },
        include: [{ model: Unit, as: 'units' }],
      });
    }
    // Tenants and other roles get empty array or limited view
    else {
      properties = [];
    }

    res.status(200).json(properties);
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get property by ID - modified for role-based access
router.get('/:id', authenticate, async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id, {
      include: [
        {
          model: Unit,
          as: 'units',
          include: [
            {
              model: Lease,
              as: 'leases',
              include: [
                {
                  model: User,
                  as: 'tenant',
                  attributes: ['id', 'name', 'email', 'phone'],
                },
              ],
            },
          ],
        },
        { model: User, as: 'landlord', attributes: ['id', 'name', 'email'] },
      ],
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if user has permission to view this property
    if (req.user.role !== 'admin' && property.landlordId !== req.user.id) {
      return res
        .status(403)
        .json({ message: 'Unauthorized access to this property' });
    }

    res.status(200).json(property);
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new property
router.post(
  '/',
  authenticate,
  authorize(['admin', 'landlord']),
  upload.single('image'),
  async (req, res) => {
    try {
      const { name, address, type, description, totalUnits, landlordId } =
        req.body;

      // Parse total units
      const parsedTotalUnits = parseInt(totalUnits) || 0;

      // Determine landlord ID based on role
      let finalLandlordId;

      if (req.user.role === 'admin') {
        if (!landlordId) {
          return res.status(400).json({
            message: 'Admin must specify a landlord for the property',
          });
        }

        const landlord = await User.findOne({
          where: { id: landlordId, role: 'landlord' },
        });

        if (!landlord) {
          return res.status(404).json({
            message: 'Specified landlord not found or not a landlord',
          });
        }

        finalLandlordId = parseInt(landlordId);
      } else {
        finalLandlordId = req.user.id;
      }

      // Handle image upload to Cloudinary
      let imageUrl = null;
      if (req.file) {
        // Convert buffer to base64
        const fileStr = req.file.buffer.toString('base64');
        const fileType = req.file.mimetype;
        const dataURI = `data:${fileType};base64,${fileStr}`;

        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(dataURI, {
          folder: 'angaza-properties',
          resource_type: 'image',
        });

        imageUrl = uploadResult.secure_url;
      }

      // Create property with Cloudinary image URL
      const property = await Property.create({
        name,
        address,
        type,
        description,
        totalUnits: parsedTotalUnits,
        availableUnits: parsedTotalUnits,
        image: imageUrl,
        landlordId: finalLandlordId,
      });

      res.status(201).json({
        message: 'Property created successfully',
        property,
      });
    } catch (error) {
      console.error('Create property error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update property - role checks remain similar but with clearer authorization
router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'landlord']),
  upload.single('image'),
  async (req, res) => {
    try {
      const {
        name,
        address,
        type,
        description,
        totalUnits,
        featured,
        landlordId,
      } = req.body;

      const property = await Property.findByPk(req.params.id, {
        include: [{ model: Unit, as: 'units' }],
      });

      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }
      
      // Check if user is authorized to update this property
      if (req.user.role !== 'admin' && property.landlordId !== req.user.id) {
        return res
          .status(403)
          .json({ message: 'Unauthorized to update this property' });
      }

      // If admin is updating landlord assignment
      if (req.user.role === 'admin' && landlordId) {
        // Verify the specified landlord exists and is actually a landlord
        const landlord = await User.findOne({
          where: { id: landlordId, role: 'landlord' },
        });

        if (!landlord) {
          return res.status(404).json({
            message: 'Specified landlord not found or not a landlord',
          });
        }

        property.landlordId = parseInt(landlordId);
      }

      // Update property fields
      property.name = name || property.name;
      property.address = address || property.address;
      property.type = type || property.type;
      property.description = description || property.description;

      // If totalUnits is changed, we need to recalculate availableUnits
      if (totalUnits && totalUnits !== property.totalUnits) {
        property.totalUnits = totalUnits;

        // Count occupied units
        const occupiedUnitsCount = property.units.filter(
          (unit) => unit.status === 'occupied'
        ).length;

        // Calculate new availableUnits
        property.availableUnits = Math.max(0, totalUnits - occupiedUnitsCount);
      }

      property.featured = featured !== undefined ? featured : property.featured;

      // Handle image upload if provided
      if (req.file) {
        // Convert buffer to base64
        const fileStr = req.file.buffer.toString('base64');
        const fileType = req.file.mimetype;
        const dataURI = `data:${fileType};base64,${fileStr}`;

        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(dataURI, {
          folder: 'angaza-properties',
          resource_type: 'image',
        });
        property.image = uploadResult.secure_url;
      }       

      await property.save();

      res.status(200).json({
        message: 'Property updated successfully',
        property,
      });
    } catch (error) {
      console.error('Update property error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete property - similar authorization pattern
router.delete(
  '/:id',
  authenticate,
  authorize(['admin', 'landlord']),
  async (req, res) => {
    try {
      const property = await Property.findByPk(req.params.id, {
        include: [{ model: Unit, as: 'units' }],
      });

      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }

      // Check if user is authorized to delete this property
      if (req.user.role !== 'admin' && property.landlordId !== req.user.id) {
        return res
          .status(403)
          .json({ message: 'Unauthorized to delete this property' });
      }

      // First, check if there are any active leases on the property's units
      for (const unit of property.units) {
        const activeLeases = await Lease.findOne({
          where: {
            unitId: unit.id,
            status: 'active',
          },
        });

        if (activeLeases) {
          return res.status(400).json({
            message:
              'Cannot delete property with active leases. Please terminate all leases first.',
          });
        }
      }

      // Delete all units associated with the property
      await Unit.destroy({
        where: { propertyId: property.id },
      });

      // Now delete the property
      await property.destroy();

      res.status(200).json({ message: 'Property deleted successfully' });
    } catch (error) {
      console.error('Delete property error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// New endpoint to get all landlords (for admin use when assigning properties)
router.get(
  '/landlords/list',
  authenticate,
  authorize(['admin']),
  async (req, res) => {
    try {
      const landlords = await User.findAll({
        where: { role: 'landlord' },
        attributes: ['id', 'name', 'email'],
      });

      res.status(200).json(landlords);
    } catch (error) {
      console.error('Get landlords error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
