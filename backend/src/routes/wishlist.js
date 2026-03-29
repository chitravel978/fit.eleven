import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';

const router = Router();

router.get('/', authRequired, async (req, res) => {
  const user = await User.findById(req.userId).populate('wishlist').lean();
  res.json(user?.wishlist || []);
});

router.post('/:productId', authRequired, async (req, res) => {
  const p = await Product.findById(req.params.productId);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  await User.updateOne({ _id: req.userId }, { $addToSet: { wishlist: p._id } });
  const user = await User.findById(req.userId).populate('wishlist').lean();
  res.json(user.wishlist);
});

router.delete('/:productId', authRequired, async (req, res) => {
  await User.updateOne({ _id: req.userId }, { $pull: { wishlist: req.params.productId } });
  const user = await User.findById(req.userId).populate('wishlist').lean();
  res.json(user.wishlist);
});

export default router;
