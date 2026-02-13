import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please provide a username.'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Please provide a password.'],
    },
    role: {
        type: String,
        enum: ['admin', 'moderator'],
        default: 'moderator',
    },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
