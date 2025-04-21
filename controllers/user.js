import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendEmailSignup, transporter } from "../utils/mail.js";
import { loginUserValidator, registerUserValidator, updateUserValidator, addPaymentMethodValidator, forgotPasswordValidator, resetPasswordValidator } from "../validators/user.js";
import { UserModel } from "../models/user.js";

export const registerUser = async (req, res, next) => {
    try {
        // validate user info
        const { error, value } = registerUserValidator.validate(req.body);
        if (error) {
            return res.status(422).json({ error: error.details[0].message });
        }

        // Safely access email and username values
        const normalizedEmail = value.email ? value.email.toLowerCase() : value.email;
        const normalizedUserName = value.userName ? value.userName.toLowerCase() : value.userName;

        // check if user doesn't already exist
        const existingUser = await UserModel.findOne({
            $or: [
                { userName: normalizedUserName },
                { email: normalizedEmail }
            ]
        });

        if (existingUser) {
            return res.status(409).json({ error: 'User already exists!' });
        }

        // hash plaintext password
        const hashedPassword = bcrypt.hashSync(value.password, 10);

        // create user record in database
        const newUser = await UserModel.create({
            ...value,
            email: normalizedEmail,
            password: hashedPassword
        });

        // Generate token
        const accessTokenSignup = jwt.sign(
            { id: newUser._id },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "24h" }
        );

        // send registration email to user
        try {
            // Define a basic template if registerUserMailTemplate is undefined
            const emailTemplate = `<p>Welcome, ${value.userName}! Your account has been created successfully.</p>`;

            await transporter.sendMail({
                from: 'ibrah.webdev@gmail.com',
                to: value.email,
                subject: 'Registration Successful',
                html: emailTemplate,
            });
        } catch (emailError) {
            console.error("Error sending email:", emailError);
            // Continue registration process even if email fails
        }

        // return response
        return res.status(201).json({
            message: "User created successfully!",
            accessTokenSignup,
        });
    } catch (err) {
        console.error("Registration error:", err);
        return res.status(500).json({ error: "Registration failed. Please try again." });
    }
}

export const loginUser = async (req, res, next) => {
    try {
        // Validate login info
        const { error, value } = loginUserValidator.validate(req.body);
        if (error) {
            return res.status(422).json({ error: error.details[0].message });
        }

        // Find user by username or email
        const user = await UserModel.findOne({
            $or: [
                { userName: value.userName },
                { email: value.email }
            ]
        });

        // Check if user exists
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isPasswordValid = bcrypt.compareSync(value.password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const accessToken = jwt.sign(
            { id: user._id, role: user.role || 'buyer' },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "24h" }
        );

        // Return user data and token
        return res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                userName: user.userName,
                email: user.email,
                role: user.role || 'buyer'
            },
            accessToken
        });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Login failed. Please try again." });
    }
};

export const updateUser = async (req, res, next) => {
    //  Validate request body
    const { error, value } = updateUserValidator.validate(req.body);
    if (error) {
        return res.status(422).json(error);
    }
    //  Update user in database
    const result = await UserModel.findByIdAndUpdate(
        req.params.id,
        value,
        { new: true }
    );
    // return response
    res.status(200).json(result);
}

export const getAuthenticatedUser = async (req, res, next) => {
    // Get user by id using req.auth.id
    try {
        const result = await UserModel
            .findById(req.auth.id)
            .select({ password: false });

        if (!result) {
            return res.status(404).json({ error: 'User not found' });
        }

        //  Return response 
        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching authenticated user:", error);
        res.status(500).json({ error: "Server error" });
    }
}

export const forgotPassword = async (req, res) => {
    try {
        // Validate the request
        const { error, value } = forgotPasswordValidator.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        // Find the user with this email
        const user = await UserModel.findOne({ email: value.email });
        if (!user) {
            return res.status(404).json({ error: 'User with this email does not exist' });
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "1h" }
        );

        // Save the reset token and expiry to the user document
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Send password reset email
        const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        const emailTemplate = `
            <h1>Password Reset</h1>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <a href="${resetURL}" target="_blank">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
        `;

        try {
            await transporter.sendMail({
                from: 'ibrah.webdev@gmail.com',
                to: user.email,
                subject: 'Password Reset Request',
                html: emailTemplate,
            });

            return res.status(200).json({
                message: 'Password reset email sent successfully'
            });
        } catch (emailError) {
            console.error("Error sending reset email:", emailError);
            return res.status(500).json({ error: 'Failed to send reset email' });
        }
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};

export const resetPassword = async (req, res) => {
    try {
        // Validate the request
        const { error, value } = resetPasswordValidator.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        // Verify the token
        let decoded;
        try {
            decoded = jwt.verify(value.token, process.env.JWT_SECRET_KEY);
        } catch (err) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Find the user
        const user = await UserModel.findOne({
            _id: decoded.id,
            resetPasswordToken: value.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Token is invalid or has expired' });
        }

        // Hash the new password
        const hashedPassword = bcrypt.hashSync(value.newPassword, 10);

        // Update user password
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        // Send confirmation email
        try {
            await transporter.sendMail({
                from: 'ibrah.webdev@gmail.com',
                to: user.email,
                subject: 'Password Reset Successful',
                html: `<p>Your password has been successfully reset. If you did not request this change, please contact support immediately.</p>`,
            });
        } catch (emailError) {
            console.error("Error sending confirmation email:", emailError);
            // Continue even if email fails
        }

        return res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};

export const addPaymentMethod = async (req, res) => {
    try {
        // Validate the payment method data
        const { error, value } = addPaymentMethodValidator.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const user = await UserModel.findById(req.auth.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Initialize payment methods array if it doesn't exist
        if (!user.paymentMethods) {
            user.paymentMethods = [];
        }

        // If this is the first payment method or isDefault is true, 
        // set it as default and all others as non-default
        if (value.isDefault || user.paymentMethods.length === 0) {
            // Set all existing methods to non-default
            user.paymentMethods.forEach(method => {
                method.isDefault = false;
            });
            value.isDefault = true;
        }

        // Add the new payment method
        user.paymentMethods.push(value);
        await user.save();

        return res.status(201).json({
            message: 'Payment method added successfully',
            paymentMethod: value
        });
    } catch (error) {
        console.error("Add payment method error:", error);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};

export const getPaymentMethods = async (req, res) => {
    try {
        const user = await UserModel.findById(req.auth.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({
            paymentMethods: user.paymentMethods || []
        });
    } catch (error) {
        console.error("Get payment methods error:", error);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};

export const deletePaymentMethod = async (req, res) => {
    try {
        const { methodId } = req.params;

        const user = await UserModel.findById(req.auth.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Find the payment method to delete
        const methodIndex = user.paymentMethods.findIndex(
            method => method._id.toString() === methodId
        );

        if (methodIndex === -1) {
            return res.status(404).json({ error: 'Payment method not found' });
        }

        // Check if the method to delete is the default
        const isDefault = user.paymentMethods[methodIndex].isDefault;

        // Remove the payment method
        user.paymentMethods.splice(methodIndex, 1);

        // If the deleted method was default and there are other methods,
        // set the first one as default
        if (isDefault && user.paymentMethods.length > 0) {
            user.paymentMethods[0].isDefault = true;
        }

        await user.save();

        return res.status(200).json({
            message: 'Payment method deleted successfully'
        });
    } catch (error) {
        console.error("Delete payment method error:", error);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};

export const updateDefaultPaymentMethod = async (req, res) => {
    try {
        const { methodId } = req.params;

        const user = await UserModel.findById(req.auth.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Find the payment method to set as default
        const methodIndex = user.paymentMethods.findIndex(
            method => method._id.toString() === methodId
        );

        if (methodIndex === -1) {
            return res.status(404).json({ error: 'Payment method not found' });
        }

        // Set all methods to non-default
        user.paymentMethods.forEach(method => {
            method.isDefault = false;
        });

        // Set the selected method as default
        user.paymentMethods[methodIndex].isDefault = true;

        await user.save();

        return res.status(200).json({
            message: 'Default payment method updated successfully',
            paymentMethod: user.paymentMethods[methodIndex]
        });
    } catch (error) {
        console.error("Update default payment method error:", error);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};