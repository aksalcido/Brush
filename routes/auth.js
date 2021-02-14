var express = require("express"),
    passport = require("passport");

// Models 
var User = require("../models/user.js");
var Artwork = require("../models/artwork.js");

// Router 
var router = express.Router();

// Middleware
var middlewareObj = require("../middleware/index.js");

// ===== Main Pages =====
router.get('/', function(req, res) {
    res.render("landing.ejs");
});


router.get("/home", function(req, res) {
    Artwork.find({}, function(err, artworks) {
        if (err) {
            req.flash("error", err.message);
        } else {
            res.render("home", {artworks: artworks});
        }
    });
});

router.get("/discover", function(req, res) {
    var page = req.query.page ? (req.query.page >= 1 ? req.query.page : 1) : 1;
    const limit = 10;

    var sortType = {likesTotal: -1};

    if (req.query.type) {
        if (req.query.type === "favorites") {
            sortType = {favoritesTotal: -1};
        }
    }

    Artwork.find({}).sort(sortType).skip((page - 1) * limit).limit(limit).exec(function(err, result) {
        if (err) {
            req.flash("error", err.message);
        } else {
            res.render("discover", {artworks: result, page: page, limit: limit});
        }
    });
});

// ===== Authorization =====
router.get("/register", function(req, res) {
    res.render("auth/register");
});

router.post("/register", function(req, res) {
    // plug in default profileImage
    var newUser = new User({username: req.body.username, profileImage: "", description: "Test", age:"", location:""});

    User.register(newUser, req.body.password, function(err, user) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("auth/register");
        }
        
        passport.authenticate("local")(req, res, function() {
            req.flash("success", "Welcome to YelpCamp " + user.username);
            res.redirect("/home");
        });
    });
});

router.get("/login", function(req, res) {
    res.render("auth/login");
});

/*
router.post("/login", passport.authenticate("local"), function(req, res) {
    res.redirect(req.session.returnTo || '/home');
    delete req.session.returnTo;

});
*/

router.post("/login", passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/login"
}), function(req, res) {}
);




router.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "Logged out!");
    res.redirect("/home");
});

module.exports = router;