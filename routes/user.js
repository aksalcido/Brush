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

const upload = multer({ storage: storage });

router.get("/", function(req, res) {
    console.log(res.locals.currentUser);
    if (res.locals.currentUser) {
        res.redirect("/profile/" + res.locals.currentUser.username);
        //res.render("profile");
    } else {
        res.redirect("/login");
    }   
});

// Maybe add search by id as well
router.get("/:username", function(req, res) {
    User.findOne({username: new RegExp('^' + req.params.username + '$', "i")}).populate("artworks").populate("profileComments").exec(function(err, foundUser) {
        if (err || !foundUser) {
            console.log("Could not find user");
            res.redirect("/home");
        } else {
            res.render("user/profile", {user: foundUser});
        }
    });
});    

// EDIT - Edit User Profile Information
router.get("/:id/edit", function(req, res) {
    User.findById(req.params.id, function(err, foundUser) {
        if (err) {
            console.log(err);
            res.redirect("/home");
        } else {
            res.render("user/edit", {user: foundUser});
        }
    });
});

// PUT - Edits the User Profile Information
router.put("/:id", upload.single('file'), function(req, res, next) {
    // If User uploading a profile picture
    if (req.file)
        req.body.user.profilePicture = req.file.filename;
    
    User.findByIdAndUpdate(req.params.id, req.body.user, function(err, updatedUser) {
        if (err) {
            console.log(err);
            res.redirect("/home");
        } else {
            res.redirect("/profile/" + updatedUser.username);
        }
    });
});


router.post("/:id/comment", middlewareObj.isLoggedIn, function(req, res) {
    User.findById(req.params.id, function(err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            Comment.create(req.body.comment, function(err, comment) {
                if (err) {
                    console.log(err);
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
            console.log(err);
            res.redirect("/home");
        } else {
            User.findById(req.params.id, function(err, foundUser) {
                if (err) {
                    console.log(err);
                } else {
                    res.redirect("/profile/" + foundUser.username);
                }
            })
        }
    });
});



module.exports = router;