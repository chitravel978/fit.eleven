import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    category: {
      type: String,
      enum: ['jerseys', 'shoes', 'leather-jackets'],
      required: true,
    },
    subcategory: { type: String },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number },
    images: [{ type: String }],
    sizes: [{ type: String }],
    stock: { type: Number, required: true, default: 0 },
    featured: { type: Boolean, default: false },
    trending: { type: Boolean, default: false },
    gstRate: { type: Number, enum: [12, 18], default: 18 },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

export const Product = mongoose.model('Product', productSchema);
