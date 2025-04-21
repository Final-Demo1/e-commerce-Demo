import { CartModel } from "../models/cartModel.js";
import { productModel } from "../models/products.js";
import { UserModel } from "../models/user.js";
import { addToCartValidator, updateCartItemValidator, checkoutCartValidator } from "../validators/cartValidator.js";
import { transporter } from "../utils/mail.js";

// Get the current user's cart
export const getCart = async (req, res) => {
    try {
        // Find cart for authenticated user
        const cart = await CartModel.findOne({ userId: req.auth.id });

        // If no cart exists yet, return an empty cart
        if (!cart) {
            return res.status(200).json({
                items: [],
                totalItems: 0,
                totalAmount: 0
            });
        }

        return res.status(200).json(cart);
    } catch (error) {
        console.error("Get cart error:", error);
        return res.status(500).json({ error: "Failed to retrieve cart" });
    }
};

// Add an item to the cart
export const addToCart = async (req, res) => {
    try {
        // Validate request
        const { error, value } = addToCartValidator.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        // Find the product
        const product = await productModel.findById(value.productId);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        // Check if product has sufficient quantity
        if (product.quantity < value.quantity) {
            return res.status(400).json({
                error: "Not enough stock available",
                availableQuantity: product.quantity
            });
        }

        // Find or create cart for this user
        let cart = await CartModel.findOne({ userId: req.auth.id });

        if (!cart) {
            // Create a new cart if one doesn't exist
            cart = new CartModel({
                userId: req.auth.id,
                items: []
            });
        }

        // Check if product already exists in cart
        const existingItemIndex = cart.items.findIndex(
            item => item.productId.toString() === value.productId
        );

        if (existingItemIndex !== -1) {
            // Update quantity if product is already in cart
            cart.items[existingItemIndex].quantity += value.quantity;
        } else {
            // Add new item to cart
            cart.items.push({
                productId: product._id,
                quantity: value.quantity,
                price: product.price,
                name: product.name,
                picture: product.pictures && product.pictures.length > 0 ? product.pictures[0] : null
            });
        }

        // Save the cart
        await cart.save();

        return res.status(200).json(cart);
    } catch (error) {
        console.error("Add to cart error:", error);
        return res.status(500).json({ error: "Failed to add item to cart" });
    }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
    try {
        const { itemId } = req.params;

        // Validate request
        const { error, value } = updateCartItemValidator.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        // Find the cart
        const cart = await CartModel.findOne({ userId: req.auth.id });
        if (!cart) {
            return res.status(404).json({ error: "Cart not found" });
        }

        // Find the item in the cart
        const itemIndex = cart.items.findIndex(
            item => item._id.toString() === itemId
        );

        if (itemIndex === -1) {
            return res.status(404).json({ error: "Item not found in cart" });
        }

        // Get the product to check available quantity
        const product = await productModel.findById(cart.items[itemIndex].productId);
        if (!product) {
            return res.status(404).json({ error: "Product no longer exists" });
        }

        // Check if product has sufficient quantity
        if (product.quantity < value.quantity) {
            return res.status(400).json({
                error: "Not enough stock available",
                availableQuantity: product.quantity
            });
        }

        // Update the quantity
        cart.items[itemIndex].quantity = value.quantity;

        // Save the cart
        await cart.save();

        return res.status(200).json(cart);
    } catch (error) {
        console.error("Update cart item error:", error);
        return res.status(500).json({ error: "Failed to update cart item" });
    }
};

// Remove an item from the cart
export const removeCartItem = async (req, res) => {
    try {
        const { itemId } = req.params;

        // Find the cart
        const cart = await CartModel.findOne({ userId: req.auth.id });
        if (!cart) {
            return res.status(404).json({ error: "Cart not found" });
        }

        // Find the item in the cart
        const itemIndex = cart.items.findIndex(
            item => item._id.toString() === itemId
        );

        if (itemIndex === -1) {
            return res.status(404).json({ error: "Item not found in cart" });
        }

        // Remove the item
        cart.items.splice(itemIndex, 1);

        // Save the cart
        await cart.save();

        return res.status(200).json(cart);
    } catch (error) {
        console.error("Remove cart item error:", error);
        return res.status(500).json({ error: "Failed to remove item from cart" });
    }
};

// Clear the cart
export const clearCart = async (req, res) => {
    try {
        // Find the cart
        const cart = await CartModel.findOne({ userId: req.auth.id });
        if (!cart) {
            return res.status(404).json({ error: "Cart not found" });
        }

        // Clear all items
        cart.items = [];

        // Save the cart
        await cart.save();

        return res.status(200).json({
            message: "Cart cleared successfully",
            cart
        });
    } catch (error) {
        console.error("Clear cart error:", error);
        return res.status(500).json({ error: "Failed to clear cart" });
    }
};

// Process checkout
export const checkout = async (req, res) => {
    try {
        // Validate checkout data
        const { error, value } = checkoutCartValidator.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        // Find the user's cart
        const cart = await CartModel.findOne({ userId: req.auth.id });
        if (!cart) {
            return res.status(404).json({ error: "Cart not found" });
        }

        if (cart.items.length === 0) {
            return res.status(400).json({ error: "Cart is empty" });
        }

        // Find the user to get payment method details
        const user = await UserModel.findById(req.auth.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if user has payment methods
        if (!user.paymentMethods || user.paymentMethods.length === 0) {
            return res.status(400).json({
                error: "No payment methods available. Please add a payment method before checkout."
            });
        }

        // Verify payment method exists for user
        const paymentMethod = user.paymentMethods.find(
            method => method._id.toString() === value.paymentMethodId
        );

        if (!paymentMethod) {
            return res.status(404).json({ error: "Payment method not found" });
        }

        // Verify inventory for all items
        for (const item of cart.items) {
            const product = await productModel.findById(item.productId);

            if (!product) {
                return res.status(404).json({
                    error: `Product "${item.name}" is no longer available`
                });
            }

            if (product.quantity < item.quantity) {
                return res.status(400).json({
                    error: `Not enough inventory for "${product.name}"`,
                    product: product.name,
                    requested: item.quantity,
                    available: product.quantity
                });
            }
        }

        // Update inventory (reduce quantities)
        for (const item of cart.items) {
            await productModel.findByIdAndUpdate(
                item.productId,
                { $inc: { quantity: -item.quantity } }
            );
        }

        // Create order (this would normally be defined in an order model)
        // For now, we're just simulating the order creation
        const orderData = {
            userId: req.auth.id,
            items: cart.items,
            totalAmount: cart.totalAmount,
            paymentMethod: {
                type: paymentMethod.type,
                // Don't send sensitive details to client
                isDefault: paymentMethod.isDefault,
            },
            shippingAddress: value.shippingAddress,
            status: 'processing',
            orderNumber: generateOrderNumber(),
            orderDate: new Date()
        };

        // Clear the cart after successful order
        cart.items = [];
        await cart.save();

        // Send order confirmation email
        try {
            const emailTemplate = `
                <h1>Order Confirmation</h1>
                <p>Thank you for your order!</p>
                <p>Order Number: ${orderData.orderNumber}</p>
                <p>Total: $${orderData.totalAmount.toFixed(2)}</p>
                <p>Your order is being processed and will be shipped soon.</p>
            `;

            await transporter.sendMail({
                from: 'ibrah.webdev@gmail.com',
                to: user.email,
                subject: 'Order Confirmation',
                html: emailTemplate,
            });
        } catch (emailError) {
            console.error("Error sending order confirmation email:", emailError);
            // Continue order processing even if email fails
        }

        return res.status(200).json({
            message: "Order placed successfully",
            order: orderData
        });
    } catch (error) {
        console.error("Checkout error:", error);
        return res.status(500).json({ error: "Failed to process checkout" });
    }
};

// Helper function to generate random order number
function generateOrderNumber() {
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD-${timestamp}-${random}`;
} 