// Imported Models
var Artwork = require("../models/artwork");
var Comment = require("../models/comment");

//const url = require('url');

// Export Middleware
var middlewareObj = {};


middlewareObj.isLoggedIn = function(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    
    /*
    // Want to avoid calling back a put request
    if (req.originalMethod  === 'GET')
        req.session.returnTo = req._parsedOriginalUrl.path
    else if (req.originalMethod === "POST")
        req.session.returnTo = req.originalUrl.substring(0, req.originalUrl.lastIndexOf('/'));
    else
        req.session.returnTo = '/home'
    console.log(req.session.returnTo);
    */

    res.redirect("../../login");
}


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


middlewareObj.hasAvailableArtworkSlots = function(req, res, next) {
    console.log(req.user.artworks.length);
    
    if (req.user.artworks.length < 21) {
        return next();
    }

    req.flash("error", "You have already created the maximum amount of works!");
    res.redirect("/home");
}



module.exports = middlewareObj;