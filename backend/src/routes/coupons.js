import { Router } from 'express';
import { Coupon } from '../models/Coupon.js';
import { adminRequired } from '../middleware/auth.js';

const router = Router();

/** Public: validate coupon for cart subtotal (pre-GST). */
router.post('/validate', async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) return res.status(400).json({ error: 'Code required' });
    const sub = Number(subtotal) || 0;
    const coupon = await Coupon.findOne({ code: String(code).toUpperCase().trim() });
    if (!coupon || !coupon.active) {
      return res.status(400).json({ valid: false, error: 'Invalid coupon' });
    }
    if (new Date() > coupon.expiresAt) {
      return res.status(400).json({ valid: false, error: 'Coupon expired' });
    }
    if (sub < coupon.minOrderValue) {
      return res.status(400).json({
        valid: false,
        error: `Minimum order value is ₹${coupon.minOrderValue}`,
      });
    }
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = Math.round(sub * (coupon.value / 100) * 100) / 100;
    } else {
      discount = Math.min(coupon.value, sub);
    }
    res.json({
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount,
      minOrderValue: coupon.minOrderValue,
      expiresAt: coupon.expiresAt,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/', adminRequired, async (_req, res) => {
  const list = await Coupon.find().sort({ createdAt: -1 }).lean();
  res.json(list);
});

router.post('/', adminRequired, async (req, res) => {
  try {
    const c = await Coupon.create({
      ...req.body,
      code: String(req.body.code || '').toUpperCase().trim(),
    });
    res.status(201).json(c);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id', adminRequired, async (req, res) => {
  const c = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!c) return res.status(404).json({ error: 'Not found' });
  res.json(c);
});

router.delete('/:id', adminRequired, async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
