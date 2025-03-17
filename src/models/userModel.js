import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Name is required"],
        unique: true
    },
    email:{
        type: String,
        required: [true, "Email is required"],
        unique: true
    },
    password:{
        type: String,
        required: [true, "Password is required"]
    },
    isVerified:{
        type: Boolean,
        default: false
    },
    role:{
        type: String,
        enum: ["admin", "user","manager"],
        default: "admin"
    },
    forgotPasswordToken: String,
    forgotPasswordTokenExpire: Date,
    verifyToken: String,
    verifyTokenExpiry: Date,
    provider: {
        type: String,
        default: "credentials"
    }
})

const User = mongoose.models.users || mongoose.model("users", userSchema);

export default User;