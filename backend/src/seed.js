import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDb } from './db.js';
import { User } from './models/User.js';
import { Product } from './models/Product.js';
import { Coupon } from './models/Coupon.js';

const products = [
  {
    name: 'Obsidian Pro Jersey',
    slug: 'obsidian-pro-jersey',
    category: 'jerseys',
    subcategory: 'basketball',
    description:
      'Oversized street jersey in premium mesh. Drop shoulders, gold embroidered crest, limited drop.',
    price: 4499,
    compareAtPrice: 5999,
    images: [
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
      'https://images.unsplash.com/photo-1515524738708-3279986ccc4e?w=800&q=80',
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 40,
    featured: true,
    trending: true,
    gstRate: 12,
    tags: ['streetwear', 'oversized', 'sports'],
  },
  {
    name: 'Gold Line Football Kit',
    slug: 'gold-line-football-kit',
    category: 'jerseys',
    subcategory: 'football',
    description: 'Breathable performance fabric with metallic gold accents. Match-day ready.',
    price: 3799,
    images: ['https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=800&q=80'],
    sizes: ['M', 'L', 'XL', 'XXL'],
    stock: 55,
    featured: true,
    gstRate: 12,
    tags: ['sports', 'jersey'],
  },
  {
    name: 'Stealth Limited Sneaker',
    slug: 'stealth-limited-sneaker',
    category: 'shoes',
    subcategory: 'limited',
    description: 'Hand-numbered pair. Cushioned sole, black-on-black with gold eyelets.',
    price: 12999,
    compareAtPrice: 15999,
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80',
    ],
    sizes: ['7', '8', '9', '10', '11'],
    stock: 18,
    featured: true,
    trending: true,
    gstRate: 18,
    tags: ['sneakers', 'limited'],
  },
  {
    name: 'Court Classic Low',
    slug: 'court-classic-low',
    category: 'shoes',
    subcategory: 'sneakers',
    description: 'Minimal leather upper, white contrast sole. Everyday luxury.',
    price: 8999,
    images: ['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80'],
    sizes: ['7', '8', '9', '10', '11', '12'],
    stock: 32,
    trending: true,
    gstRate: 18,
    tags: ['sneakers', 'streetwear'],
  },
  {
    name: 'Midnight Rider Leather Jacket',
    slug: 'midnight-rider-leather-jacket',
    category: 'leather-jackets',
    subcategory: 'biker',
    description: 'Full-grain leather, asymmetric zip, quilted shoulders. Built to age beautifully.',
    price: 28999,
    compareAtPrice: 34999,
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80',
      'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=800&q=80',
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 12,
    featured: true,
    gstRate: 18,
    tags: ['luxury', 'biker', 'leather'],
  },
  {
    name: 'Sovereign Bomber Leather',
    slug: 'sovereign-bomber-leather',
    category: 'leather-jackets',
    subcategory: 'luxury',
    description: 'Slim bomber cut in Italian lambskin. Satin lining, gold hardware.',
    price: 35999,
    images: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80'],
    sizes: ['M', 'L', 'XL'],
    stock: 8,
    featured: true,
    gstRate: 18,
    tags: ['luxury', 'bomber'],
  },
];

async function run() {
  await connectDb();
  await Coupon.deleteMany({});
  await Coupon.insertMany([
    {
      code: 'SAVE10',
      type: 'percentage',
      value: 10,
      expiresAt: new Date('2027-12-31'),
      minOrderValue: 2000,
      active: true,
    },
    {
      code: 'FLAT200',
      type: 'flat',
      value: 200,
      expiresAt: new Date('2027-12-31'),
      minOrderValue: 1500,
      active: true,
    },
  ]);

  const adminEmail = 'admin@luxestreet.in';
  const passwordHash = await bcrypt.hash('admin123', 10);
  await User.findOneAndUpdate(
    { email: adminEmail },
    {
      $set: { passwordHash, name: 'Admin', role: 'admin' },
      $setOnInsert: { email: adminEmail },
    },
    { upsert: true }
  );

  await Product.deleteMany({});
  await Product.insertMany(products);

  console.log('Seed complete. Admin:', adminEmail, '/ admin123');
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
