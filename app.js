// Imported Libraries
var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    passport = require("passport");
    LocalStrategy = require("passport-local");

// Imported Models
var User = require("./models/user.js");


// Global Variables
var BASE_PORT = 3000;



// Setup (if not created already) and Connect the Mongoose Database 
mongoose.connect("mongodb://localhost:27017/brush_database", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then( () => console.log("Connected to DB!") )
.catch(error => console.log(error.message));


// Set up BodyParser to handle HTTP POST reqs
app.use(bodyParser.urlencoded({extended: true}));

// App checks for "ejs" files in the view so we don't have to manually type '.ejs'
app.set("view engine", "ejs");

// Serve everything in the public directory
app.use(express.static(__dirname + '/public'));


// Set up Session and Passport Authentication with Users
var session = require("express-session");

app.use(session({
    secret: "Once again another passowrd",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// MIDDLEWARE that will run for every single route
app.use(function(req, res, next) {
    res.locals.currentUser = req.user;

    // Middleware is ran and then next route
    next();
});





// Landing Page
app.get('/', function(req, res) {
    res.render("landing.ejs");
});

// Home Page
app.get("/home", function(req, res) {
    res.render("home.ejs");
});

// Create Page
app.get("/create", function(req, res) {
    res.sendFile('workspace.html', {root : __dirname + '/public/html'});
});


app.get("/learn", function(req, res) {
    res.render("learn");
});


// Login Page
app.get("/login", function(req, res) {
    res.render("login");
});

// Profile Page
app.get("/profile", function(req, res) {
    if (res.locals.currentUser) {
        res.render("profile");
    } else {
        res.redirect("/login");
    }
});


app.post("/login", passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/login"
}), function(req, res) {}
);

// Logout Page
app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/home");
});

// Register Page
app.get("/register", function(req, res) {
    res.render("register");
});

app.post("/register", function(req, res) {
    var newUser = new User({username: req.body.username});

    User.register(newUser, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            return res.redirect("register");
        }
        
        passport.authenticate("local")(req, res, function() {
            res.redirect("/home");
        })
    })
});


// Images Page
app.get("/images", function(req, res) {
    res.send("Images Page");
});

app.get("/images/:id", function(req, res) {
    res.send("Image : " + req.params.id);
});





// Save Page
app.get("/save", function(req, res) {
    res.send("Save Page");
});

app.listen(BASE_PORT, '127.0.0.1', function() {
    console.log("Brush Server started");
});