var express = require("express");
var multer = require("multer");

// Models
var User = require("../models/user.js");
var Comment = require("../models/comment.js");

// Router
var router = express.Router();
var path = require('path');

// Middleware
var middlewareObj = require("../middleware/index.js");

// Setting up Multer
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./public/uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
})

// Handles Image Upload for Profile Pictures
const upload = multer({ storage: storage });

router.get("/", function(req, res) {
    if (res.locals.currentUser) {
        res.redirect("/profile/" + res.locals.currentUser.username);
    } else {
        res.redirect("/login");
    }   
});

router.get("/:username", function(req, res) {
    var page = req.query.page ? (req.query.page >= 1 ? req.query.page : 1) : 1;
    const limit = 15;

    User.findOne({username: new RegExp('^' + req.params.username + '$', "i")}).populate("artworks").populate({
        path: "profileComments",
        options: {
            sort: { createdAt: -1, _id: 1 },
        }}).exec(function(err, foundUser) {
            if (err || !foundUser) {
                if (err)
                    req.flash("error", err.message);

                if (!foundUser)
                    req.flash("error", "Could not find user with username of: " + req.params.username);

                res.redirect("/home");
            } else {
                var totalLikes = 0;

                foundUser.artworks.forEach( (aw) => {
                    totalLikes += aw.likes.length;
                });

                res.render("user/profile", {user: foundUser, totalLikes: totalLikes, page: page, limit: limit});
            }
    });
});    

router.get("/:username/followers", function(req, res) {
    var page = req.query.page ? (req.query.page >= 1 ? req.query.page : 1) : 1;
    const limit = 12;

    User.findOne({username: new RegExp('^' + req.params.username + '$', "i")}).populate({
        path: "followers",
        options: {
            limit: limit,
            skip: (page - 1) * limit
        }
    }).exec(function(err, foundUser) {
        if (err || !foundUser) {
            if (err)
                req.flash("error", err.message);
    
            if (!foundUser)
                req.flash("error", "Could not find user with username of: " + req.params.username);
            
            res.redirect("/home");
        } else {
            res.render("user/followers", {user: foundUser, page: page, limit: limit});
        }
    });
})

router.get("/:username/following", function(req, res) {
    var page = req.query.page ? (req.query.page >= 1 ? req.query.page : 1) : 1;
    const limit = 12;

    User.findOne({username: new RegExp('^' + req.params.username + '$', "i")}).populate({
        path: "following",
        options: {
            limit: limit,
            skip: (page - 1) * limit
        }
    }).exec(function(err, foundUser) {
        if (err || !foundUser) {
            if (err)
                req.flash("error", err.message);
    
            if (!foundUser)
                req.flash("error", "Could not find user with username of: " + req.params.username);
            
            res.redirect("/home");
        } else {
            res.render("user/following", {user: foundUser, page: page, limit: limit});
        }
    });
})

router.get("/:username/favorites", function(req, res) {
    var page = req.query.page ? (req.query.page >= 1 ? req.query.page : 1) : 1;
    const limit = 12;

    User.findOne({username: new RegExp('^' + req.params.username + '$', "i")}).populate({
        path: 'favorites',
        options: {
            limit: limit,
            skip: (page - 1) * limit
        }
    }).exec(function(err, foundUser) {
        if (err || !foundUser) {
            if (err)
                req.flash("error", err.message);
                
            if (!foundUser)
                req.flash("error", "Could not find user with username of: " + req.params.username);

            res.redirect("/home");
        } else {
            res.render("user/favorites", {user: foundUser, page: page, limit: limit});
        }
    });
})

// EDIT - Edit User Profile Information
router.get("/:id/edit", middlewareObj.validateUserEdit, function(req, res) {
    User.findById(req.params.id, function(err, foundUser) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/home");
        } else {
            res.render("user/edit", {user: foundUser});
        }
    });
});

// PUT - Edits the User Profile Information
router.put("/:id", middlewareObj.validateUserEdit, upload.single('file'), function(req, res, next) {
    // If User uploading a profile picture
    if (req.file)
        req.body.user.profilePicture = req.file.filename;
    
    User.findByIdAndUpdate(req.params.id, req.body.user, function(err, updatedUser) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/home");
        } else {
            res.redirect("/profile/" + updatedUser.username);
        }
    });
});

// Follow
router.get("/:username/follow", middlewareObj.isLoggedIn, function(req, res) {
    // Find User that currentUser is trying to Follow -- foundUser
    User.findOne({username: new RegExp('^' + req.params.username + '$', "i")}).exec(function(err, foundUser) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/home");
        } else {
            // foundUser contains the person currentUser wishes to follow; So we add foundUser to following of currentUser and
            // followers of foundUser.
            User.findByIdAndUpdate(res.locals.currentUser._id, { $addToSet: { following : foundUser._id } }, { new: true }).exec(function(err, updatedUser) {
                if (err) {
                    req.flash("error", err.message);
                    res.redirect("/home");
                } else {
                    foundUser.followers.push(updatedUser);
                    foundUser.save();
                    res.redirect("/profile/" + req.params.username);
                }
            });
        }
    });
});

router.get("/:username/unfollow", middlewareObj.isLoggedIn, function(req, res) {
    // Verify that User trying to be unfollowed is a real user
    User.findOne({username: new RegExp('^' + req.params.username + '$', "i")}).exec(function(err, foundUser) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/home");
        } else {
            // Update User that is making the unfollow request (remove foundUser from following)
            User.updateOne({ _id: req.user._id }, {$pull: {following: foundUser._id}}, function(err, updatedUnfollowingUser) {
                if (err) {
                    req.flash("error", err.message);
                    res.redirect("/profile/" + foundUser.username);
                } else {
                    // Update User that is being unfollowed (remove updatedUnfollowingUser from followers)
                    User.updateOne({ _id: foundUser._id }, {$pull: {followers: req.user._id}}, function(err, updatedLosingFollowerUser) {
                        if (err) {
                            req.flash("error", err.message);
                            res.redirect("/profile/" + updatedUnfollowingUser.username);
                        } else {
                            res.redirect("/profile/" + foundUser.username);
                        }
                    });
                }
            });
        }
    });
});

router.post("/:id/comment", middlewareObj.isLoggedIn, function(req, res) {
    User.findById(req.params.id, function(err, foundUser) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("/home");
        } else {
            // (!str.replace(/\s/g, '').length)
            
            // Check if text field contains data
            if (req.body.comment.text.length === 0) {
                req.flash("error", "Comment contains no text");
                return res.redirect("/profile/" + foundUser.username);
            }
        
            Comment.create(req.body.comment, function(err, comment) {
                if (err) {
                    req.flash("error", err.message);
                    res.redirect("/home");
                } else {
                    // Update the comment Credentials
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();
                    
                    User.update({name: req.user.username}, {$inc: {totalComments: 1}});
                    
                    // Push the comment onto the User's Profile Comments (The one whos profile was commented on)
                    foundUser.profileComments.push(comment);
                    foundUser.save();

                    // Redirect to that same User's Profile
                    res.redirect("/profile/" + foundUser.username);
                }
            });
        }
    });

});

router.delete("/:id/comment/:comment_id", middlewareObj.isLoggedIn, middlewareObj.validateCommentOwnership, function(req, res) {
    Comment.findByIdAndDelete(req.params.comment_id, function(err) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/home");
        } else {
            User.findById(req.params.id, function(err, foundUser) {
                if (err) {
                    req.flash("error", err.message);
                } else {
                    res.redirect("/profile/" + foundUser.username);
                }
            })
        }
    });
});



module.exports = router;