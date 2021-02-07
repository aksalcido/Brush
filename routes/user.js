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

// Get stream (API) for feeds -- implement LATER


// Handles Image Upload for Profile Pictures
const upload = multer({ storage: storage });

router.get("/", function(req, res) {
    console.log(res.locals.currentUser);
    if (res.locals.currentUser) {
        res.redirect("/profile/" + res.locals.currentUser.username);
    } else {
        res.redirect("/login");
    }   
});

router.get("/:username", function(req, res) {
    User.findOne({username: new RegExp('^' + req.params.username + '$', "i")}).populate("artworks").populate("profileComments").exec(function(err, foundUser) {
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

            console.log(totalLikes);

            res.render("user/profile", {user: foundUser, totalLikes: totalLikes});
        }
    });
});    

router.get("/:username/followers", function(req, res) {
    User.findOne({username: new RegExp('^' + req.params.username + '$', "i")}).populate("followers").exec(function(err, foundUser) {
        if (err || !foundUser) {
            if (err)
                req.flash("error", err.message);
    
            if (!foundUser)
                req.flash("error", "Could not find user with username of: " + req.params.username);
            
            res.redirect("/home");
        } else {
            res.render("user/followers", {user: foundUser});
        }
    });
})

router.get("/:username/following", function(req, res) {
    User.findOne({username: new RegExp('^' + req.params.username + '$', "i")}).populate("following").exec(function(err, foundUser) {
        if (err || !foundUser) {
            if (err)
                req.flash("error", err.message);
    
            if (!foundUser)
                req.flash("error", "Could not find user with username of: " + req.params.username);

            res.redirect("/home");
        } else {
            res.render("user/following", {user: foundUser});
        }
    });
})

router.get("/:username/favorites", function(req, res) {
    User.findOne({username: new RegExp('^' + req.params.username + '$', "i")}).populate("favorites").exec(function(err, foundUser) {
        if (err || !foundUser) {
            if (err)
                req.flash("error", err.message);
                
            if (!foundUser)
                req.flash("error", "Could not find user with username of: " + req.params.username);

            res.redirect("/home");
        } else {
            res.render("user/favorites", {user: foundUser});
        }
    });
})


// EDIT - Edit User Profile Information
router.get("/:id/edit", function(req, res) {
    User.findById(req.params.id, function(err, foundUser) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/home");
        } else {
            res.render("user/edit", {user: foundUser});
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
            User.findByIdAndUpdate(res.locals.currentUser._id, {
                $addToSet: { following : foundUser._id }
            }, {
                new: true
            }).exec(function(err, updatedUser) {
                if (err) {
                    console.log("Error completing the follow request");
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
    res.send("Follow clicked");
});



// PUT - Edits the User Profile Information
router.put("/:id", upload.single('file'), function(req, res, next) {
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

router.post("/:id/comment", middlewareObj.isLoggedIn, function(req, res) {
    User.findById(req.params.id, function(err, foundUser) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/home");
        } else {
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

router.delete("/:id/comment/:comment_id", function(req, res) {
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