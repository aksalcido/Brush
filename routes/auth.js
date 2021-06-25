const passport = require("passport");

// Router 
const router = require('express').Router();

// Models 
const User = require("../models/user.js");
const Artwork = require("../models/artwork.js");

// Middleware
const middlewareObj = require("../middleware/index.js");

// ===== Main Pages =====
router.get('/', (req, res) => {
    res.render("main/landing.ejs");
});

router.get("/home", (req, res) => {
    Artwork.find({likesTotal: { $gt: 4 }}, (err, artworks) => {
        if (err) {
            req.flash("error", err.message);
        } else {
            res.render("home", {artworks: shuffle(artworks)});
        }
    });
});

function shuffle(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;
  
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

router.get("/discover", (req, res) => {
    // Page, sortType, limit for pagination
    let page = req.query.page ? (req.query.page >= 1 ? req.query.page : 1) : 1;
    let sortType = {likesTotal: -1, _id: 1};
    let limit = 10;

    if (req.query.type) {
        if (req.query.type === "favorites") {
            sortType = {favoritesTotal: -1};
        }
        if (req.query.type === "random") {
            sortType = { };
        }
    }

    Artwork.find({}).sort(sortType).skip((page - 1) * limit).limit(limit).exec((err, result) => {
        if (err) {
            req.flash("error", err.message);
        } else {
            if (req.query.type === "random")
                result = shuffle(result);

            res.render("main/discover", {artworks: result, page: page, limit: limit});
        }
    });
});

// ===== Authorization =====
router.get("/register", (req, res) => {
    res.render("auth/register");
});

router.post("/register", middlewareObj.usernameToLowerCase, middlewareObj.validateUsername, (req, res) => {
    // Ensure that the User chose a correct password and not mistyped
    if (req.body.password != req.body.confirm_password) {
        req.flash("error", "Password confirmation does not match");
        res.redirect("register");
    } else {
        // Create new User to be registered with username and default description
        var newUser = new User({username: req.body.username, description: "Hello, I just joined Brush!", age:"", location:""});

        User.register(newUser, req.body.password, (err, user) => {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("register");
            }
            
            // After successful registration, sign in the user
            passport.authenticate("local")(req, res, () => {
                req.flash("success", "Welcome to Brush " + user.username);
                res.redirect("/home");
            });
        });
    }
});

router.get("/login", (req, res) => {
    res.render("auth/login");
});

router.post("/login", middlewareObj.usernameToLowerCase, passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/login",
    failureFlash: 'Invalid username or password.' 
}), (req, res) => { 
});

router.get("/logout", (req, res) => {
    req.logout();
    req.flash("success", "Logged out!");
    res.redirect("/home");
});

module.exports = router;