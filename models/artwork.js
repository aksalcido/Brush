var mongoose = require("mongoose");

var ArtworkSchema = new mongoose.Schema({
    name: String,
    img: String,
    description: String,
    createdAt: {
        type: Date, default: Date.now
    },
    author: {

    },
    comments: [

    ]
});


module.exports = mongoose.model("Artwork", ArtworkSchema);