import { Schema, model } from "mongoose";
import normalize from "normalize-mongoose";

const userSchema = new Schema({
    userName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'buyer', enum: ['buyer', 'admin', 'superadmin'] },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    paymentMethods: [{
        type: { type: String, enum: ['credit_card', 'paypal', 'momo'] },
        details: { type: Schema.Types.Mixed },
        isDefault: { type: Boolean, default: false }
    }]
}, {
    timestamps: true
});

userSchema.plugin(normalize)
export const UserModel = model('User', userSchema);