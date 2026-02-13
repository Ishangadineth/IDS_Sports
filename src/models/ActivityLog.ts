import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
    },
    action: {
        type: String,
        required: true,
    },
    details: {
        type: String,
    },
    ipAddress: {
        type: String,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

// TTL Index: Expires after 48 hours (172800 seconds)
ActivityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 172800 });

export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);
