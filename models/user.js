var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    profilePicture: String,
    email: String,
    description: String,
    age: String,
    location: String,
    gender: String,
    totalComments: {type: Number, default: 0},
    createdAt: {
        type: Date, default: Date.now
    },
    artworks: [ 
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Artwork"
        }
    ],
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Artwork"
        }
    ],
    profileComments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);