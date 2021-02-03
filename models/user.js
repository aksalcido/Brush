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
    createdAt: {
        type: Date, default: Date.now
    },
    artworks: [ 
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Artwork"
        }
    ],
    ratings: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Rating"
        }
    ]
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);