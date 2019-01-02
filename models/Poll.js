var mongoose = require('mongoose');

var PollSchema = new mongoose.Schema({
    pollName: String,
    settings: {
        addChoices: Boolean,
        adminAddOnly: Boolean,
        maxChoices: Number,
    },
    foodChoices: [{
        foodName: String,
        voteCount: Number,
        voters: [String],
    }],
    people: [{
        username: String,
        password: String, // stores HASHED password using helpers/hash.js
    }],
});

module.exports = mongoose.model(
    'Poll',
    PollSchema,
);