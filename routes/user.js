const multer = require("multer");
const router = require('express').Router();

// Models
const User = require("../models/user.js");
const Comment = require("../models/comment.js");

// Router
const path = require('path');

// Middleware
const middlewareObj = require("../middleware/index.js");

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

// GET - Get the profile of currently logged in User OR login form
router.get("/", (req, res) => {
    if (res.locals.currentUser) {
        res.redirect("/profile/" + res.locals.currentUser.username);
    } else {
        res.redirect("/login");
    }   
});

// GET - Get the profile of User with 'username'
router.get("/:username", (req, res) => {
    // page and limit are set for user profile comments
    let page = req.query.page ? (req.query.page >= 1 ? req.query.page : 1) : 1;
    let limit = 15;

    // Find User by username using RegExp
    User.findOne({username: new RegExp('^' + req.params.username + '$', "i")}).populate("artworks").populate({
            path: "profileComments",
            options: { 
                sort: { createdAt: -1, _id: 1 } 
            }
        }).exec((err, foundUser) => {
            if (err || !foundUser) {
                if (err)
                    req.flash("error", err.message);

                if (!foundUser)
                    req.flash("error", "Could not find user with username of: " + req.params.username);

                res.redirect("/home");
            } else {
                // Tally up totalLikes that user 'username' has for all of their artworks
                let totalLikes = 0;

                foundUser.artworks.forEach(aw => totalLikes += aw.likes.length);

                res.render("user/profile", {user: foundUser, totalLikes: totalLikes, page: page, limit: limit});
            }
    });
});    

// GET - Get the followers of User with 'username'
router.get("/:username/followers", (req, res) => {
    // page and limit are for which page of followers the query is based on
    let page = req.query.page ? (req.query.page >= 1 ? req.query.page : 1) : 1;
    let limit = 12;

    User.findOne({username: new RegExp('^' + req.params.username + '$', "i")}).populate({
        path: "followers",
        options: {
            limit: limit,
            skip: (page - 1) * limit
        }
    }).exec((err, foundUser) => {
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

// GET - Get the following of User with 'username'
router.get("/:username/following", (req, res) => {
    // page and limit are for which page of following the query is based on
    let page = req.query.page ? (req.query.page >= 1 ? req.query.page : 1) : 1;
    let limit = 12;

    User.findOne({username: new RegExp('^' + req.params.username + '$', "i")}).populate({
        path: "following",
        options: {
            limit: limit,
            skip: (page - 1) * limit
        }
    }).exec((err, foundUser) => {
        if (err || !foundUser) {
            // Flash if Error Occurs
            if (err)
                req.flash("error", err.message);

            // Flash if Can not find the current username
            if (!foundUser)
                req.flash("error", "Could not find user with username of: " + req.params.username);
            
            res.redirect("/home");
        } else {
            res.render("user/following", {user: foundUser, page: page, limit: limit});
        }
    });
})

// GET - Get the favorites of User with 'username'
router.get("/:username/favorites", (req, res) => {
    // page and limit are for which page of favorites the query is based on
    let page = req.query.page ? (req.query.page >= 1 ? req.query.page : 1) : 1;
    let limit = 12;

    User.findOne({username: new RegExp('^' + req.params.username + '$', "i")}).populate({
        path: 'favorites',
        options: {
            limit: limit,
            skip: (page - 1) * limit
        }
    }).exec((err, foundUser) => {
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

// GET - Get Edit User Profile Form
router.get("/:id/edit", middlewareObj.validateUserEdit, (req, res) => {
    User.findById(req.params.id, (err, foundUser) => {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/home");
        } else {
            res.render("user/edit", {user: foundUser});
        }
    });
});

// PUT - Edits the User Profile Information
router.put("/:id", middlewareObj.validateUserEdit, upload.single('file'), (req, res, next) => {
    // If User uploading a profile picture
    if (req.file)
        req.body.user.profilePicture = req.file.filename;
    
    User.findByIdAndUpdate(req.params.id, req.body.user, (err, updatedUser) => {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/home");
        } else {
            res.redirect("/profile/" + updatedUser.username);
        }
    });
});

// PUT - Follow the User of 'username'
router.put("/:username/follow", middlewareObj.isLoggedIn, (req, res) => {
    // Find User that currentUser is trying to Follow --> foundUser
    User.findOne({username: new RegExp('^' + req.params.username + '$', "i")}).exec((err, foundUser) => {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/home");
        } else {
            // foundUser contains the person currentUser wishes to follow; So we add foundUser to following of currentUser and
            // followers of foundUser.
            User.updateOne({ _id: res.locals.currentUser._id }, {$addToSet: { following : foundUser._id }}, (err, updatedUser) => {
                if (err) {
                    req.flash("error", err.message);
                    res.redirect("/home");
                } else {
                    foundUser.followers.push(res.locals.currentUser._id);
                    foundUser.save();
                    res.redirect("/profile/" + req.params.username);
                }
            });
        }
    });
});

// PUT - Unfollow the User of 'username'
router.put("/:username/unfollow", middlewareObj.isLoggedIn, (req, res) => {
    // Verify that User trying to be unfollowed is a legitimate user
    User.findOne({username: new RegExp('^' + req.params.username + '$', "i")}).exec((err, foundUser) => {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/home");
        } else {
            // Update User that is making the unfollow request (remove foundUser from following)
            User.updateOne({ _id: req.user._id }, {$pull: {following: foundUser._id}}, (err, updatedUnfollowingUser) => {
                if (err) {
                    req.flash("error", err.message);
                    res.redirect("/profile/" + foundUser.username);
                } else {
                    // Update User that is being unfollowed (remove updatedUnfollowingUser from followers)
                    User.updateOne({ _id: foundUser._id }, {$pull: {followers: req.user._id}}, (err, updatedLosingFollowerUser) => {
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

// POST - Create a comment on the profile of user with 'id'
router.post("/:id/comment", middlewareObj.isLoggedIn, (req, res) => {
    User.findById(req.params.id, (err, foundUser) => {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("/home");
        } else {
            // Check if text field contains data
            if (req.body.comment.text.length === 0) {
                req.flash("error", "Comment contains no text");
                return res.redirect("/profile/" + foundUser.username);
            }
        
            Comment.create(req.body.comment, (err, comment) => {
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

// DELETE - Delete a comment of 'comment_id' on the profile of user with 'id'
router.delete("/:id/comment/:comment_id", middlewareObj.isLoggedIn, middlewareObj.validateCommentOwnership, (req, res) => {
    Comment.findByIdAndDelete(req.params.comment_id, (err) => {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/home");
        } else {
            User.findById(req.params.id, (err, foundUser) => {
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