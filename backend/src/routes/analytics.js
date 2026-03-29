import { Router } from 'express';
import { adminRequired } from '../middleware/auth.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';

const router = Router();

router.get('/summary', adminRequired, async (_req, res) => {
  const [paidOrders, revenueAgg, productCount] = await Promise.all([
    Order.countDocuments({ 'payment.status': 'paid' }),
    Order.aggregate([
      { $match: { 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$gst.grandTotal' } } },
    ]),
    Product.countDocuments(),
  ]);
  const revenue = revenueAgg[0]?.total || 0;
  const pending = await Order.countDocuments({
    'payment.status': 'pending',
    orderStatus: { $ne: 'cancelled' },
  });
  res.json({
    paidOrders,
    revenue: Math.round(revenue * 100) / 100,
    productCount,
    pendingPayments: pending,
  });
});

export default router;
