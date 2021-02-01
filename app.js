// Imported Libraries
var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    methodOverride = require('method-override');

// Routes
var authRoutes = require("./routes/auth"),
    userRoutes = require("./routes/user"),
    createRoutes = require("./routes/create");
    artworkRoutes = require("./routes/artwork");

// Imported Models
var User = require("./models/user.js");
var Artwork = require("./models/artwork.js");
var Comment = require("./models/comment.js");

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

// Allows us to parse JSON in POST Requests of limit 50mb
app.use(bodyParser.json( {limit: '50mb'} ));

// App checks for "ejs" files in the view so we don't have to manually type '.ejs'
app.set("view engine", "ejs");

// Serve everything in the public directory
app.use(express.static(__dirname + '/public'));

// Allows us to make put and delete requests when providing '_method'
app.use(methodOverride("_method"));

// Set up Session and Passport Authentication with Users
var session = require("express-session");
const artwork = require("./models/artwork.js");
const e = require("express");

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

// Middleware
var middlewareObj = require("./middleware/index.js");

// MIDDLEWARE that will run for every single route
app.use(function(req, res, next) {
    res.locals.currentUser = req.user;

    // Middleware is ran and then next route
    next();
});


app.use("/", authRoutes);
app.use("/create", createRoutes);
app.use("/artwork", artworkRoutes);
app.use("/profile", userRoutes);


app.listen(BASE_PORT, '127.0.0.1', function() {
    console.log("Brush Server started");
});