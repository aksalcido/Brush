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
    res.render("main/landing.ejs");
});

router.get("/home", function(req, res) {
    Artwork.find({likesTotal: { $gt: 4 }},
        function(err, artworks) {
        if (err) {
            req.flash("error", err.message);
        } else {
            res.render("home", {artworks: shuffle(artworks)});
        }
    });
});

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
}

router.get("/discover", function(req, res) {
    var page = req.query.page ? (req.query.page >= 1 ? req.query.page : 1) : 1;
    var sortType = {likesTotal: -1, _id: 1};
    const limit = 10;

    if (req.query.type) {
        if (req.query.type === "favorites") {
            sortType = {favoritesTotal: -1};
        }
        if (req.query.type === "random") {
            sortType = { };
        }
    }

    Artwork.find({}).sort(sortType).skip((page - 1) * limit).limit(limit).exec(function(err, result) {
        if (err) {
            req.flash("error", err.message);
        } else {
            if (req.query.type === "random")
                result = shuffle(result);

                console.log("Page: " + page);
                console.log("result.length: " + result.length);

            res.render("main/discover", {artworks: result, page: page, limit: limit});
        }
    });
});

// ===== Authorization =====
router.get("/register", function(req, res) {
    res.render("auth/register");
});

router.post("/register", middlewareObj.usernameToLowerCase, middlewareObj.validateUsername, function(req, res) {
    // Ensure that the User chose a correct password and not mistyped
    if (req.body.password != req.body.confirm_password) {
        req.flash("error", "Password confirmation does not match");
        res.redirect("register");
    } else {
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
    }
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

router.post("/login", middlewareObj.usernameToLowerCase, passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/login",
    failureFlash: 'Invalid username or password.' 
}), function(req, res) { 
});




router.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "Logged out!");
    res.redirect("/home");
});

module.exports = router;