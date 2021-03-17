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

// Searchbar on Navbar by search query and relevance 
router.get("/search", function(req, res) {
    if (req.query.q) {
        const regex = new RegExp(escapeRegex(req.query.q), 'gi');
        const limit = 20;
        const sortType = {likesTotal: -1};

        Artwork.find({"name": regex}).sort(sortType).limit(limit).exec(function(err, foundArtworks) {
            if (err) {
                req.flash("error", err.message);
                res.redirect("/home");
            } else {
                res.render("artwork/search", {artworks: foundArtworks});
            }
        });
    } else {
        res.redirect("/home");
    }
})

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


// Get Artwork Profile
router.get("/:id", function(req, res) {
    var page = req.query.page ? (req.query.page >= 1 ? req.query.page : 1) : 1;
    const limit = 10;

    Artwork.findById(req.params.id).populate({
        path: "comments",
        options: {
            sort: { createdAt: -1, _id: 1 },
        }}).populate("likes").exec(function(err, foundArtwork) {
            if (err) {
                req.flash("error", err.message);
                res.redirect("/home");
            } else {
                res.render("artwork/show", {artwork: foundArtwork, page: page, limit: limit});
            }
    });
});

// Edit Artwork
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

// Update Editd Artwork
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

// Delete Artwork
router.delete("/:id", middlewareObj.isLoggedIn, middlewareObj.validateArtworkOwnership, function(req, res) {
    Artwork.findByIdAndDelete(req.params.id, function(err) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/artwork/" + req.params.id);
        } else {
            // Remove Artwork from other Models referencing it
            User.updateOne({ _id: req.user._id }, {$pull: {artworks: req.params.id}}, function(err, updatedUser) {
                if (err) {
                    req.flash("error", err.message);
                    res.redirect("/home");
                } else {
                    res.redirect("/profile");
                }
            })
        }
    });
});

// Like Artwork
router.put("/:id/like", middlewareObj.isLoggedIn, function(req, res) {
    Artwork.findByIdAndUpdate(req.params.id, {
        $addToSet: { likes: req.user._id },
        $inc: { likesTotal: 1 }
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

// Unlike Artwork
router.put("/:id/unlike", middlewareObj.isLoggedIn, function(req, res) {
    User.updateOne({ _id: req.user._id }, {$pull: {likes: req.params.id}}, function(err, updatedUser) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/home");
        } else {
            Artwork.updateOne({ _id: req.params.id }, {
                $pull: {likes: req.user._id},
                $inc: { likesTotal: -1 }
            }, function(err, updatedArtwork) {
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

// Favorite Artwork
router.put("/:id/favorite", middlewareObj.isLoggedIn, function(req, res) {
    Artwork.findByIdAndUpdate(req.params.id, {
        $addToSet: { favorites: req.user._id },
        $inc: { favoritesTotal: 1 }
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

// Unfavorite Artwork
router.put("/:id/unfavorite", middlewareObj.isLoggedIn, function(req, res) {
    User.updateOne({ _id: req.user._id }, {$pull: {favorites: req.params.id}}, function(err, updatedUser) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/home");
        } else {
            Artwork.updateOne({ _id: req.params.id }, {
                $pull: {favorites: req.user._id}, 
                $inc: { favoritesTotal: -1 }
            }, function(err, updatedArtwork) {
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

// Post a comment on an Artwork
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

// Delete a comment made on an Artwork
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