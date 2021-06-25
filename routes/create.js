const path = require('path');

// Router
const router = require('express').Router();

// Models
const Artwork = require("../models/artwork.js");

// Middleware
const middlewareObj = require("../middleware/index.js");

router.get("/", middlewareObj.isLoggedIn, middlewareObj.hasAvailableArtworkSlots, (req, res) => {
    let reqPath = path.join(__dirname, '../') + '/public/html';
    
    res.sendFile('workspace.html', {root : reqPath});
});

router.post("/", (req, res) => {
    // author is set to the current user
    let author = { id: req.user._id, username: req.user.username };
    // image is set to the image data of the body request
    let image = { data: req.body.image };
    // newArtwork object is created with empty name/description and author/image
    let newArtwork = {name: "", img: image, description: "", author: author};

    Artwork.create(newArtwork, (err, newlyCreated) => {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/home");
        } else {
            // Push newlyCreated artwork to the current User's Artworks
            req.user.artworks.push(newlyCreated);
            req.user.save();

            res.redirect("/artwork/" + newlyCreated._id);
        }
    });
})

module.exports = router;