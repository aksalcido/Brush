var mongoose = require("mongoose");

var ArtworkSchema = new mongoose.Schema({
    name: String,
    img: {
        data: Buffer,
        contentType: String
    },
    description: String,
    createdAt: {
        type: Date, default: Date.now
    },
    author: {
        name: String
    },
    comments: [

    ]
});


module.exports = mongoose.model("Artwork", ArtworkSchema);