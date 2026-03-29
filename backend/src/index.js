import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { connectDb } from './db.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import couponRoutes from './routes/coupons.js';
import orderRoutes from './routes/orders.js';
import wishlistRoutes from './routes/wishlist.js';
import analyticsRoutes from './routes/analytics.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/admin/analytics', analyticsRoutes);

io.on('connection', (socket) => {
  socket.on('subscribe:order', (orderId) => {
    if (orderId) socket.join(`order:${orderId}`);
  });
  socket.on('unsubscribe:order', (orderId) => {
    if (orderId) socket.leave(`order:${orderId}`);
  });
});

const port = Number(process.env.PORT) || 5000;

connectDb()
  .then(() => {
    server.listen(port, () => console.log(`API + Socket.io on http://localhost:${port}`));
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
