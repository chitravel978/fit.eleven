import { Router } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { authRequired, adminRequired } from '../middleware/auth.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Coupon } from '../models/Coupon.js';
import { calculateGstBreakdown, computeOrderGstFromItems } from '../utils/gst.js';

const router = Router();

const FREE_SHIPPING_THRESHOLD = 4999;

function emitOrder(io, orderId, payload) {
  if (io) io.to(`order:${orderId}`).emit('order:update', payload);
}

/** Build line items from cart, apply coupon, compute GST — returns { items, gstBreakdown, discount, couponCode } */
async function buildOrderPayload(cartItems, couponCode) {
  const items = [];
  let subtotal = 0;
  for (const c of cartItems) {
    const p = await Product.findById(c.productId);
    if (!p) throw new Error(`Product ${c.productId} not found`);
    const qty = Math.max(1, Number(c.quantity) || 1);
    if (p.stock < qty) throw new Error(`Insufficient stock for ${p.name}`);
    const size = c.size || p.sizes?.[0];
    if (p.sizes?.length && size && !p.sizes.includes(size)) {
      throw new Error(`Invalid size for ${p.name}`);
    }
    const line = {
      product: p._id,
      name: p.name,
      price: p.price,
      quantity: qty,
      size: size || '',
      gstRate: p.gstRate || 18,
    };
    items.push(line);
    subtotal += p.price * qty;
  }
  subtotal = Math.round(subtotal * 100) / 100;

  let discount = 0;
  let appliedCoupon = null;
  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: String(couponCode).toUpperCase().trim(),
      active: true,
    });
    if (coupon && new Date() <= coupon.expiresAt && subtotal >= coupon.minOrderValue) {
      if (coupon.type === 'percentage') {
        discount = Math.round(subtotal * (coupon.value / 100) * 100) / 100;
      } else {
        discount = Math.min(coupon.value, subtotal);
      }
      appliedCoupon = coupon.code;
    }
  }

  const afterDiscount = Math.round((subtotal - discount) * 100) / 100;
  const { effectiveGstPercent } = computeOrderGstFromItems(
    items.map((i) => ({ ...i, price: i.price, quantity: i.quantity, gstRate: i.gstRate }))
  );
  const gstPart = calculateGstBreakdown(afterDiscount, effectiveGstPercent);
  const shipping =
    afterDiscount >= FREE_SHIPPING_THRESHOLD || afterDiscount === 0 ? 0 : 99;
  const grandTotal = Math.round((gstPart.grandTotal + shipping) * 100) / 100;

  return {
    items,
    gstBreakdown: {
      subtotal,
      discount,
      taxableAmount: afterDiscount,
      gstPercent: effectiveGstPercent,
      cgst: gstPart.cgst,
      sgst: gstPart.sgst,
      totalGst: gstPart.totalGst,
      shipping,
      grandTotal,
    },
    couponCode: appliedCoupon,
  };
}

router.post('/preview', authRequired, async (req, res) => {
  try {
    const { cartItems, couponCode } = req.body;
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    const payload = await buildOrderPayload(cartItems, couponCode);
    res.json(payload);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/mine', authRequired, async (req, res) => {
  const list = await Order.find({ user: req.userId })
    .sort({ createdAt: -1 })
    .populate('items.product')
    .lean();
  res.json(list);
});

router.get('/admin/all', adminRequired, async (req, res) => {
  const list = await Order.find()
    .sort({ createdAt: -1 })
    .populate('user', 'email name')
    .populate('items.product')
    .limit(200)
    .lean();
  res.json(list);
});

router.post('/', authRequired, async (req, res) => {
  try {
    const io = req.app.get('io');
    const { cartItems, couponCode, billing } = req.body;
    if (!billing?.name || !billing?.phone || !billing?.addressLine1 || !billing?.city || !billing?.pincode) {
      return res.status(400).json({ error: 'Complete billing address required' });
    }
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const built = await buildOrderPayload(cartItems, couponCode);
    const est = new Date();
    est.setDate(est.getDate() + 5);

    const order = await Order.create({
      user: req.userId,
      items: built.items,
      couponCode: built.couponCode,
      billing,
      gst: built.gstBreakdown,
      orderStatus: 'placed',
      timeline: [{ status: 'placed', at: new Date() }],
      estimatedDelivery: est,
      payment: { status: 'pending' },
    });

    for (const line of built.items) {
      await Product.updateOne({ _id: line.product }, { $inc: { stock: -line.quantity } });
    }

    const amountPaise = Math.round(built.gstBreakdown.grandTotal * 100);
    let razorpayOrder = null;
    if (amountPaise > 0 && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      const rp = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      razorpayOrder = await rp.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt: order._id.toString().slice(0, 40),
        notes: { orderId: order._id.toString() },
      });
      order.payment.razorpayOrderId = razorpayOrder.id;
      await order.save();
    }

    emitOrder(io, order._id.toString(), { orderId: order._id, orderStatus: order.orderStatus });

    res.status(201).json({
      order,
      razorpayOrderId: razorpayOrder?.id,
      amount: amountPaise / 100,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/:id/verify-payment', authRequired, async (req, res) => {
  try {
    const io = req.app.get('io');
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const order = await Order.findOne({ _id: req.params.id, user: req.userId });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.payment.razorpayOrderId && order.payment.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ error: 'Order id mismatch' });
    }

    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (expected !== razorpay_signature) {
      order.payment.status = 'failed';
      await order.save();
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    order.payment.razorpayPaymentId = razorpay_payment_id;
    order.payment.razorpaySignature = razorpay_signature;
    order.payment.status = 'paid';
    order.payment.paidAt = new Date();
    await order.save();

    emitOrder(io, order._id.toString(), { orderId: order._id, payment: 'paid' });
    res.json({ ok: true, order });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Cash-free test path when Razorpay keys missing (dev only) */
router.post('/:id/mock-pay', authRequired, async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available' });
  }
  const order = await Order.findOne({ _id: req.params.id, user: req.userId });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.payment.status = 'paid';
  order.payment.paidAt = new Date();
  await order.save();
  res.json({ ok: true, order });
});

router.get('/:id/track', authRequired, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.userId }).lean();
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json(order);
});

router.patch('/admin/:id/status', adminRequired, async (req, res) => {
  try {
    const io = req.app.get('io');
    const { orderStatus } = req.body;
    const allowed = ['placed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!allowed.includes(orderStatus)) return res.status(400).json({ error: 'Invalid status' });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Not found' });
    order.orderStatus = orderStatus;
    order.timeline.push({ status: orderStatus, at: new Date() });
    await order.save();
    emitOrder(io, order._id.toString(), { orderId: order._id, orderStatus });
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/admin/:id/agent-location', adminRequired, async (req, res) => {
  try {
    const io = req.app.get('io');
    const { latitude, longitude, name, phone } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Not found' });
    order.deliveryAgent = {
      ...order.deliveryAgent,
      latitude: Number(latitude),
      longitude: Number(longitude),
      name: name || order.deliveryAgent?.name,
      phone: phone || order.deliveryAgent?.phone,
      updatedAt: new Date(),
    };
    await order.save();
    emitOrder(io, order._id.toString(), {
      orderId: order._id,
      deliveryAgent: order.deliveryAgent,
    });
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
