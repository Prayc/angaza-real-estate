// backend/routes/payments.js
const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { Payment, Lease, User } = require('../models');
const router = express.Router();

// Get all payments
router.get('/', authenticate, async (req, res) => {
  try {
    // Filter payments based on user role
    let where = {};

    if (req.user.role === 'tenant') {
      where.tenantId = req.user.id;
    }

    const payments = await Payment.findAll({
      where,
      include: [
        {
          model: User,
          as: 'tenant',
          attributes: ['id', 'name', 'email', 'phone'],
        },
        {
          model: Lease,
        },
      ],
    });

    res.status(200).json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get payment by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'tenant',
          attributes: ['id', 'name', 'email', 'phone'],
        },
        {
          model: Lease,
        },
      ],
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if tenant has permission to view this payment
    if (req.user.role === 'tenant' && payment.tenantId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.status(200).json(payment);
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new payment
router.post('/', authenticate, async (req, res) => {
  try {
    const { amount, paymentType, paymentMethod, reference, leaseId } = req.body;

    // Get tenant ID from lease if admin or property manager is creating the payment
    let tenantId = req.user.id;

    if (req.user.role !== 'tenant') {
      const lease = await Lease.findByPk(leaseId);
      if (!lease) {
        return res.status(404).json({ message: 'Lease not found' });
      }
      tenantId = lease.tenantId;
    }

    // Create payment
    const payment = await Payment.create({
      amount,
      paymentDate: new Date(),
      paymentType,
      paymentMethod,
      status: 'completed', // Assuming payment is completed immediately
      reference,
      tenantId,
      leaseId,
    });

    res.status(201).json({
      message: 'Payment recorded successfully',
      payment,
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update payment status
router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'property_manager']),
  async (req, res) => {
    try {
      const { status } = req.body;

      const payment = await Payment.findByPk(req.params.id);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      // Update payment status
      payment.status = status;
      await payment.save();

      res.status(200).json({
        message: 'Payment status updated successfully',
        payment,
      });
    } catch (error) {
      console.error('Update payment error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
