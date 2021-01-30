var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    createdAt: {
        type: Date, default: Date.now
    },
    artworks: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Artwork"
        }
    ]
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);