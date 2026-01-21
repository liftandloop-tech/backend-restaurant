//new
const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['Food', 'Service', 'Ambiance', 'Cleanliness', 'Value', 'Other'],
        default: 'Other'
    }
}, { timestamps: true });

// export default mongoose.model('Feedback', FeedbackSchema);

module.exports = mongoose.model("Feedback", FeedbackSchema);