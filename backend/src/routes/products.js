import { Router } from 'express';
import { Product } from '../models/Product.js';
import { adminRequired } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const {
      q,
      category,
      minPrice,
      maxPrice,
      size,
      featured,
      trending,
      page = 1,
      limit = 12,
    } = req.query;
    const filter = {};
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { description: rx }, { tags: rx }];
    }
    if (category) filter.category = category;
    if (minPrice != null || maxPrice != null) {
      filter.price = {};
      if (minPrice != null) filter.price.$gte = Number(minPrice);
      if (maxPrice != null) filter.price.$lte = Number(maxPrice);
    }
    if (size) filter.sizes = size;
    if (featured === 'true') filter.featured = true;
    if (trending === 'true') filter.trending = true;

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Product.countDocuments(filter),
    ]);
    res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/slug/:slug', async (req, res) => {
  const p = await Product.findOne({ slug: req.params.slug }).lean();
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});

router.get('/:id', async (req, res) => {
  const p = await Product.findById(req.params.id).lean();
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});

router.post('/', adminRequired, async (req, res) => {
  try {
    const p = await Product.create(req.body);
    res.status(201).json(p);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id', adminRequired, async (req, res) => {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/:id', adminRequired, async (req, res) => {
  const p = await Product.findByIdAndDelete(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

export default router;
