var middlewareObj = {};

middlewareObj.isLoggedIn = function(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    
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