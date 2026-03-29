import mongoose from 'mongoose';

const timelineEntrySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['placed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
      required: true,
    },
    at: { type: Date, default: Date.now },
    note: { type: String },
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    price: Number,
    quantity: { type: Number, required: true, min: 1 },
    size: String,
    gstRate: { type: Number },
  },
  { _id: false }
);

const gstBreakdownSchema = new mongoose.Schema(
  {
    subtotal: Number,
    discount: Number,
    taxableAmount: Number,
    gstPercent: Number,
    cgst: Number,
    sgst: Number,
    totalGst: Number,
    shipping: Number,
    grandTotal: Number,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    couponCode: { type: String },
    billing: {
      name: String,
      email: String,
      phone: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    gst: gstBreakdownSchema,
    payment: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending',
      },
      method: String,
      paidAt: Date,
    },
    orderStatus: {
      type: String,
      enum: ['placed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'placed',
    },
    timeline: [timelineEntrySchema],
    estimatedDelivery: { type: Date },
    deliveryAgent: {
      name: String,
      phone: String,
      latitude: { type: Number },
      longitude: { type: Number },
      updatedAt: Date,
    },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
