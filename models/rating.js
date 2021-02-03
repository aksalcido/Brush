var mongoose = require("mongoose");

var ratingSchema = new mongoose.Schema({
    _user: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    _item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artwork'
    },
    value: Boolean
});

module.exports = mongoose.model("Rating", ratingSchema)