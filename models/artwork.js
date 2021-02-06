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
    ],
    favorites: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]
});

ArtworkSchema.pre('update', function(next) {
    this.model('User').update(
        { },
        { "$pull": { "artworks": this._id } },
        { "multi": true },
        next
    );
});

module.exports = mongoose.model("Artwork", ArtworkSchema);