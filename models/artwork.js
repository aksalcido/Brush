var mongoose = require("mongoose");
var mongoosePaginate = require('mongoose-paginate-v2');

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
    likesTotal: { type: Number, default: 0 },
    likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
    ],
    favoritesTotal: { type: Number, default: 0},
    favorites: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]
});

module.exports = mongoose.model("Artwork", ArtworkSchema);