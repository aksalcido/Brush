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

router.get("/:id", function(req, res) {
    /*
    const page = req.query.page;
    const limit = req.query.limit;

    const startIndex = (page - 1) * limit;
    */
   const page = req.query.page ? req.query.page : 1;


    Artwork.findById(req.params.id).populate("comments").populate("likes").exec(function(err, foundArtwork) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/home");
        } else {
            res.render("artwork/show", {artwork: foundArtwork, page: page});
        }
    });
});


router.get("/:id/edit", middlewareObj.isLoggedIn, middlewareObj.validateArtworkOwnership, function(req, res) {
    Artwork.findById(req.params.id, function(err, foundArtwork) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/home");
        } else {
            res.render("artwork/edit", {artwork: foundArtwork});
        }
    });
});

router.put("/:id", middlewareObj.isLoggedIn, middlewareObj.validateArtworkOwnership, function(req, res) {
    Artwork.findByIdAndUpdate(req.params.id, req.body.artwork, function(err, updatedArtwork) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/profile");
        } else {
            res.redirect("/artwork/" + req.params.id);
        }
    });
});

router.delete("/:id", middlewareObj.isLoggedIn, middlewareObj.validateArtworkOwnership, function(req, res) {
    Artwork.findByIdAndDelete(req.params.id, function(err) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/artwork/" + req.params.id);
        } else {
            // Remove Artwork from other Models referencing it

            res.redirect("/profile");
        }
    });
});

router.put("/:id/like", middlewareObj.isLoggedIn, function(req, res) {
    Artwork.findByIdAndUpdate(req.params.id, {
        $addToSet: { likes: req.user._id }
    }, {
        new: true
    }).exec(function(err, updatedArtwork) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/home");
        } else {
            console.log("Saving");
            req.user.likes.push(updatedArtwork);
            req.user.save();
            res.redirect("/artwork/" + updatedArtwork._id);
        }
    });
});

router.put("/:id/unlike", middlewareObj.isLoggedIn, function(req, res) {
    User.updateOne({ _id: req.user._id }, {$pull: {likes: req.params.id}}, function(err, updatedUser) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/home");
        } else {
            Artwork.updateOne({ _id: req.params.id }, {$pull: {likes: req.user._id}}, function(err, updatedArtwork) {
                if (err) {
                    req.flash("error", err.message);
                    res.redirect("/home");
                } else {
                    res.redirect("/artwork/" + req.params.id);
                }
            });
        }
    });
});


router.put("/:id/favorite", middlewareObj.isLoggedIn, function(req, res) {
    Artwork.findByIdAndUpdate(req.params.id, {
        $addToSet: { favorites: req.user._id }
    }, {
        new: true
    }).exec(function(err, updatedArtwork) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/home");
        } else {
            req.user.favorites.push(updatedArtwork);
            req.user.save();

            res.redirect("/artwork/" + updatedArtwork._id);
        }
    });
});

router.put("/:id/unfavorite", middlewareObj.isLoggedIn, function(req, res) {
    User.updateOne({ _id: req.user._id }, {$pull: {favorites: req.params.id}}, function(err, updatedUser) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/home");
        } else {
            Artwork.updateOne({ _id: req.params.id }, {$pull: {favorites: req.user._id}}, function(err, updatedArtwork) {
                if (err) {
                    req.flash("error", err.message);
                    res.redirect("/home");
                } else {
                    res.redirect("/artwork/" + req.params.id);
                }
            });
        }
    });
});

// Comment Stuff
router.post("/:id/comment", middlewareObj.isLoggedIn, function(req, res) {
    // Lookup Artwork by ID
    Artwork.findById(req.params.id, function(err, artwork) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("home");
        } else {
            // Create New Comment
            Comment.create(req.body.comment, function(err, comment) {
                if (err) {
                    console.log(err);
                } else {
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

router.delete("/:id/comment/:comment_id", middlewareObj.isLoggedIn, middlewareObj.validateCommentOwnership, function(req, res) {
    Comment.findByIdAndDelete(req.params.comment_id, function(err) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/artwork/" + req.params.id);
        } else {
            // Flash
            res.redirect("/artwork/" + req.params.id);
        }
    });
});


module.exports = router;