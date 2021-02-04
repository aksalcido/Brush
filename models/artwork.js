var mongoose = require("mongoose");

var ArtworkSchema = new mongoose.Schema({
    name: String,
    img: {
        data: String,
        contentType: String
    },
    description: String,
    createdAt: {
        type: Date, default: Date.now
    },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ],
    likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
    ]
});


module.exports = mongoose.model("Artwork", ArtworkSchema);