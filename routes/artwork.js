var express = require("express");

// Models
var Artwork = require("../models/artwork.js");
var User    = require("../models/user.js");
var Comment = require("../models/comment.js");
var Rating  = require("../models/rating.js");

// Router
var router = express.Router();

// Middleware
var middlewareObj = require("../middleware/index.js");

router.get("/artwork", function(req, res) {
    console.log(res.locals.currentUser);
    res.render("artwork/index");
});

router.get("/:id", function(req, res) {
    Artwork.findById(req.params.id).populate("comments").populate("likes").exec(function(err, foundArtwork) {
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
            res.redirect("/artwork/" + req.params.id);
        } else {
            res.redirect("/profile");
        }
    });
});

router.put("/:id/like", middlewareObj.isLoggedIn, function(req, res) {
    // Check if User has already liked the Artwork
    User.findById(res.locals.currentUser, function(err, foundUser) {
        if (err) {
            console.log(err);
            res.redirect("/home");
        } else {
            Artwork.findByIdAndUpdate(req.params.id, {
                $addToSet: { likes: foundUser._id }
            }, {
                new: true
            }).exec(function(err, updatedArtwork) {
                if (err) {

                } else {
                    console.log("Saving");
                    foundUser.likes.push(updatedArtwork);
                    foundUser.save();
                    res.redirect("/artwork/" + updatedArtwork._id);
                }
            });
        }
    });
});

router.put("/:id/unlike", middlewareObj.isLoggedIn, function(req, res) {
    // Check if User has already liked the Artwork
    User.findById(res.locals.currentUser, function(err, foundUser) {
        if (err) {
            console.log(err);
            res.redirect("/home");
        } else {
            // Remove
        }
    });
});


router.put("/:id/favorite", middlewareObj.isLoggedIn, function(req, res) {
    User.findById(res.locals.currentUser, function(err, foundUser) {
        if (err) {
            console.log(err);
            res.redirect("/home");
        } else {
            Artwork.findByIdAndUpdate(req.params.id, {
                $addToSet: { favorites: foundUser._id }
            }, {
                new: true
            }).exec(function(err, updatedArtwork) {
                if (err) {
                    return res.status(422).json({error: err});
                } else {
                    foundUser.favorites.push(updatedArtwork);
                    foundUser.save();

                    res.redirect("/artwork/" + updatedArtwork._id);
                }
            });
        }
    });
});

router.put("/:id/unfavorite", middlewareObj.isLoggedIn, function(req, res) {

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