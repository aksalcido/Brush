// Imported Models
var Artwork = require("../models/artwork");
var Comment = require("../models/comment");

// Export Middleware
var middlewareObj = {};

// Validates if there is a current user logged in, otherwise redirects to Login Page
middlewareObj.isLoggedIn = function(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect("../../login");
}

// Validates if the User is currently trying to edit their own profile
middlewareObj.validateUserEdit = function(req, res, next) {
    if (req.isAuthenticated()) {
        if (req.params.id != res.locals.currentUser._id) {
            req.flash("error", "You do not have permission to do that");
            res.redirect("/home");
        } else {
            next(); 
        }
    } else {
        res.redirect("../../login");
    }
}

// Validates if the Current User owns the current Artwork upon edit or deletion
middlewareObj.validateArtworkOwnership = function(req, res, next) {
    Artwork.findById(req.params.id, function(err, foundArtwork) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/home");
        } else {
            if (foundArtwork.author.id.equals(req.user._id)) {
                next();
            } else {
                req.flash("error", "You don't have permission to do that");
                res.redirect("/artwork/" + foundArtwork._id);
            }
        }
    });
}

// Validates if the Current User owns the Comment that was created when trying to edit (not implemented) or delete
middlewareObj.validateCommentOwnership = function(req, res, next) {
    Comment.findById(req.params.comment_id, function(err, foundComment) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/home");
        } else {
            if (foundComment.author.id.equals(req.user._id)) {
                next();
            } else {
                req.flash("error", "You don't have permission to do that");
                res.redirect("/home");
            }
        }
    });
}

// Validates if the Current User has reached the Maximum Artwork Slots for their Profile (Each User has 21 Free Splots)
middlewareObj.hasAvailableArtworkSlots = function(req, res, next) {    
    if (req.user.artworks.length < 21) {
        return next();
    } else { 
        req.flash("error", "You have already created the maximum amount of works!");
        res.redirect("/profile/" + req.user.username);
    }
}

// Alters the Username and changes to Lowercase so that Users can not register with the same Username in different cases
middlewareObj.usernameToLowerCase = function(req, res, next) {
    req.body.username = req.body.username.toLowerCase();
    next();
}

// Validates the Username and ensures it is at least 2 characters long and not greater than 20
middlewareObj.validateUsername = function(req, res, next) {
    if (req.body.username.length <= 2 || req.body.username.length > 20) {
        req.flash("error", "Username must be greater than 2 and not exceed length 20");
        res.redirect("/register");
    } else {
        next();
    }
}

// Vaguely Validates the Password (Not Implemented Completely)
middlewareObj.validatePassword = function(req, res, next) {
    let re = new RegExp("^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$");
    
    console.log(re.test(req.body.password));

    if (!re.test(req.body.password)) {
        req.flash("error", "Password must be Minimum eight characters with at least one letter, number, and special character.");
        res.redirect("/register");
    } else {
        next();
    }
}


module.exports = middlewareObj;