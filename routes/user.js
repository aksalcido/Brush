var express = require("express");

// Models
var User = require("../models/user.js");

// Router
var router = express.Router();

// Middleware
var middlewareObj = require("../middleware/index.js");

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
    User.findOne({username: new RegExp('^' + req.params.username + '$', "i")}).populate("artworks").exec(function(err, foundUser) {
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
router.put("/:id", function(req, res) {
    console.log(req.params.user);
    User.findByIdAndUpdate(req.params.id, req.params.user, function(err, updatedUser) {
        if (err) {
            console.log(err);
            res.redirect("/home");
        } else {
            console.log("Updated: " + updatedUser);
            res.redirect("/profile/" + updatedUser.username);
        }
    });
});

module.exports = router;