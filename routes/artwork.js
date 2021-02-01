var express = require("express");

// Models
var Artwork = require("../models/artwork.js");
var Comment = require("../models/comment.js");

// Router
var router = express.Router();

// Middleware
var middlewareObj = require("../middleware/index.js");

router.get("/artwork", function(req, res) {
    console.log(res.locals.currentUser);
    res.render("artwork/index");
});

router.get("/:id", function(req, res) {
    Artwork.findById(req.params.id).populate("comments").exec(function(err, foundArtwork) {
        if (err) {
            console.log(err);
        } else {
            console.log(foundArtwork.image);
            res.render("artwork/show", {artwork: foundArtwork});
        }
    });
});

// NEED TO CHECK ARTWORK OWNERSHIP MIDDLEWARE TO PREVENT JUST EDITING 
router.get("/:id/edit", function(req, res) {
    Artwork.findById(req.params.id, function(err, foundArtwork) {
        if (err) {
            console.log(err);
        } else {
            res.render("artwork/edit", {artwork: foundArtwork});
        }
    });
});

router.put("/:id", function(req, res) {
    Artwork.findByIdAndUpdate(req.params.id, req.body.artwork, function(err, updatedArtwork) {
        if (err) {
            console.log(err);
            res.redirect("/profile");
        } else {
            res.redirect("/artwork/" + req.params.id);
        }
    });
});

router.delete("/:id", function(req, res) {
    Artwork.findByIdAndDelete(req.params.id, function(err) {
        if (err) {
            res.redirect("/artwork/:id");
        } else {
            res.redirect("/profile");
        }
    });
});


// Comment Stuff
router.post("/:id/comment", middlewareObj.isLoggedIn, function(req, res) {
    // Lookup Artwork by ID
    Artwork.findById(req.params.id, function(err, artwork) {
        if (err) {
            console.log(err);
            res.redirect("home");
        } else {
            // Create New Comment
            Comment.create(req.body.comment, function(err, comment) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Creating Comment...");
                    // Update info concerning the new comment
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();

                    // Store comment onto artwork
                    artwork.comments.push(comment);
                    artwork.save();
                
                    res.redirect("/artwork/" + artwork._id);    
                }
            });
        }
    });
});

router.delete("/:id/comment/:comment_id", function(req, res) {
    Comment.findByIdAndDelete(req.params.comment_id, function(err) {
        if (err) {
            // Flash
            res.redirect("/artwork/" + req.params.id);
        } else {
            // Flash
            res.redirect("/artwork/" + req.params.id);
        }
    });
});

module.exports = router;