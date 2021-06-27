// Router
const router = require("express").Router();

// Models
const Artwork = require("../models/artwork.js");
const User    = require("../models/user.js");
const Comment = require("../models/comment.js");

// Middleware
const middlewareObj = require("../middleware/index.js");

// Searchbar on Navbar by search query and relevance 
router.get("/search", (req, res) => {
    if (req.query.q) {
        let regex = new RegExp(escapeRegex(req.query.q), 'gi');
        let limit = 20;
        let sortType = {likesTotal: -1};

        // Search for Artwork by regex, sortType, and limit
        Artwork.find({"name": regex}).sort(sortType).limit(limit).exec((err, foundArtworks) => {
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
router.get("/:id", (req, res) => {
    let page = req.query.page ? (req.query.page >= 1 ? req.query.page : 1) : 1;
    let limit = 10;

    Artwork.findById(req.params.id).populate({
        path: "comments",
        options: {
            sort: { createdAt: -1, _id: 1 },
        }}).populate("likes").exec((err, foundArtwork) => {
            if (err) {
                req.flash("error", `No Artwork found for ID: '${req.params.id}'`);
                res.redirect("/home");
            } else {
                res.render("artwork/show", {artwork: foundArtwork, page: page, limit: limit});
            }
    });
});

// Edit Artwork
router.get("/:id/edit", middlewareObj.isLoggedIn, middlewareObj.validateArtworkOwnership, (req, res) => {
    Artwork.findById(req.params.id, (err, foundArtwork) => {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/home");
        } else {
            res.render("artwork/edit", {artwork: foundArtwork});
        }
    });
});

// Update Edited Artwork
router.put("/:id", middlewareObj.isLoggedIn, middlewareObj.validateArtworkOwnership, (req, res) => {
    Artwork.findByIdAndUpdate(req.params.id, req.body.artwork, (err, updatedArtwork) => {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/profile");
        } else {
            res.redirect("/artwork/" + req.params.id);
        }
    });
});

// Delete Artwork
router.delete("/:id", middlewareObj.isLoggedIn, middlewareObj.validateArtworkOwnership, (req, res) => {
    Artwork.findByIdAndDelete(req.params.id, (err) => {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/artwork/" + req.params.id);
        } else {
            // Remove Artwork from other Models referencing it
            User.updateOne({ _id: req.user._id }, {$pull: {artworks: req.params.id}}, (err, updatedUser) => {
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
router.put("/:id/like", middlewareObj.isLoggedIn, (req, res) => {
    Artwork.findByIdAndUpdate(req.params.id, {
        $addToSet: { likes: req.user._id },
        $inc: { likesTotal: 1 }
    }, {
        new: true
    }).exec((err, updatedArtwork) => {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/home");
        } else {
            req.user.likes.push(updatedArtwork);
            req.user.save();
            res.redirect("/artwork/" + updatedArtwork._id);
        }
    });
});

// Unlike Artwork
router.put("/:id/unlike", middlewareObj.isLoggedIn, (req, res) => {
    User.updateOne({ _id: req.user._id }, {$pull: {likes: req.params.id}}, (err, updatedUser) => {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/home");
        } else {
            Artwork.updateOne({ _id: req.params.id }, {
                $pull: {likes: req.user._id},
                $inc: { likesTotal: -1 }
            }, (err, updatedArtwork) => {
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
router.put("/:id/favorite", middlewareObj.isLoggedIn, (req, res) => {
    Artwork.findByIdAndUpdate(req.params.id, {
        $addToSet: { favorites: req.user._id },
        $inc: { favoritesTotal: 1 }
    }, {
        new: true
    }).exec((err, updatedArtwork) => {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/home");
        } else {
            // Push Artwork to User that favorites
            req.user.favorites.push(updatedArtwork._id);
            req.user.save();

            res.redirect("/artwork/" + updatedArtwork._id);
        }
    });
});

// Unfavorite Artwork
router.put("/:id/unfavorite", middlewareObj.isLoggedIn, (req, res) => {
    // Remove artwork id from User favorites
    User.updateOne({ _id: req.user._id }, {$pull: {favorites: req.params.id}}, (err, updatedUser) => {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/home");
        } else {
            // Remove user id from Artwork favorites and decrement favoriteTotal
            Artwork.updateOne({ _id: req.params.id }, {
                $pull: {favorites: req.user._id}, 
                $inc: { favoritesTotal: -1 }
            }, (err, updatedArtwork) => {
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
router.post("/:id/comment", middlewareObj.isLoggedIn, (req, res) => {
    // Lookup Artwork by ID
    Artwork.findById(req.params.id, (err, artwork) => {
        if (err) {
            req.flash("error", err.message);
            res.redirect("home");
        } else {
            // Create New Comment
            Comment.create(req.body.comment, (err, comment) => {
                if (err) {
                    req.flash("error", err.message);
                    res.redirect("/home");
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
router.delete("/:id/comment/:comment_id", middlewareObj.isLoggedIn, middlewareObj.validateCommentOwnership, (req, res) => {
    Comment.findByIdAndDelete(req.params.comment_id, (err) => {
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