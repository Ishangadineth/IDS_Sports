import mongoose from 'mongoose';

const StreamLinkSchema = new mongoose.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true },
});

const EventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title for the event.'],
    },
    description: {
        type: String,
    },
    coverImage: {
        type: String, // URL for the event thumbnail/banner
    },
    teamA: {
        name: String,
        logo: String,
    },
    teamB: {
        name: String,
        logo: String,
    },
    startTime: {
        type: Date,
        required: [true, 'Please provide a start time for the event.'],
    },
    endTime: {
        type: Date, // Optional end time for auto-ending
    },
    status: {
        type: String,
        enum: ['Scheduled', 'Live', 'Ended', 'Delayed'],
        default: 'Scheduled',
    },
    apiMatchId: {
        type: String, // ID for external cricket API
    },
    useAutomatedScore: {
        type: Boolean,
        default: false,
    },
    manualScore: {
        teamA: String, // e.g., "225/5 (20)"
        teamB: String,
        status: String, // e.g., "Innings Break"
    },
    streamLinks: [StreamLinkSchema],
}, { timestamps: true });

export default mongoose.models.Event || mongoose.model('Event', EventSchema);
