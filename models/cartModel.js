import { Schema, model, Types } from "mongoose";
import normalize from "normalize-mongoose";

const cartItemSchema = new Schema({
    productId: {
        type: Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    price: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    // Store picture URL from product for quick access
    picture: {
        type: String
    }
});

const cartSchema = new Schema({
    userId: {
        type: Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [cartItemSchema],
    // Track totals at cart level for quick access
    totalItems: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    // Payment information to be used during checkout
    paymentMethodId: {
        type: Types.ObjectId,
        ref: 'User.paymentMethods'
    }
}, {
    timestamps: true
});

// Middleware to calculate and update cart totals before saving
cartSchema.pre('save', function (next) {
    // Calculate total items
    this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);

    // Calculate total amount
    this.totalAmount = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);

    next();
});

cartSchema.plugin(normalize);
export const CartModel = model('Cart', cartSchema); 