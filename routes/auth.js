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
    var randomArtwork = [];
    
    Artwork.countDocuments({}, function(err, count) {
        if (err) {
            console.log(err);
        } else {
            for (var i = 0; i < 6; i++) {
                var random = Math.floor(Math.random() * count)
                Artwork.findOne().skip(random).exec(
                    function (err, result) {
                        randomArtwork.push(result._id);
                    }
                );
            }
        }
    });

    console.log(randomArtwork.length);

    res.render("home.ejs", {randomArtwork: randomArtwork});
});

router.get("/learn", function(req, res) {
    res.render("learn");
});

// ===== Authorization =====
router.get("/register", function(req, res) {
    res.render("register");
});

router.post("/register", function(req, res) {
    // plug in default profileImage
    var newUser = new User({username: req.body.username, profileImage: "", description: "Test", age:"", location:""});

    User.register(newUser, req.body.password, function(err, user) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("register");
        }
        
        passport.authenticate("local")(req, res, function() {
            req.flash("success", "Welcome to YelpCamp " + user.username);
            res.redirect("/home");
        });
    });
});

router.get("/login", function(req, res) {
    res.render("login");
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