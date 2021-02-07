var middlewareObj = {};

//const url = require('url');

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

middlewareObj.hasAvailableArtworkSlots = function(req, res, next) {
    console.log(req.user.artworks.length);
    
    if (req.user.artworks.length < 21) {
        return next();
    }

    res.redirect("/home");
}

module.exports = middlewareObj;