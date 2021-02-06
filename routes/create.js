var express = require("express"),
    path = require('path')

// Models
var User    = require("../models/user.js");
var Artwork = require("../models/artwork.js");

// Router
var router = express.Router();

// Middleware
var middlewareObj = require("../middleware/index.js");

router.get("/", middlewareObj.isLoggedIn, middlewareObj.hasAvailableArtworkSlots, function(req, res) {
    let reqPath = path.join(__dirname, '../') + '/public/html';
    
    res.sendFile('workspace.html', {root : reqPath});
});

router.post("/", function(req, res) {
    var author = {
        id: req.user._id,
        username: req.user.username
    };

    var image = {
        data: req.body.image,
    };

    var newArtwork = {name: "", img: image, description: "", author: author, test: req.body.image};

    Artwork.create(newArtwork, function(err, newlyCreated) {
        if (err) {
            console.log(err);
        } else {
            req.user.artworks.push(newlyCreated);
            req.user.save();

            // ID Will be replaced with artwork id  http://localhost:3000/artwork/6012715edac7df16fc37facc
            res.redirect("/artwork/" + newlyCreated._id);
        }
    });
})

module.exports = router;