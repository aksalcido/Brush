// Imported Libraries
var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    methodOverride = require('method-override');

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


app.use(methodOverride("_method"));

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


// ===== Landing Page =====
app.get('/', function(req, res) {
    res.render("landing.ejs");
});

// ===== Home Page =====
app.get("/home", function(req, res) {
    res.render("home.ejs");
});

// ===== Learn Page =====
app.get("/learn", function(req, res) {
    res.render("learn");
});

// ===== Create Page =====
app.get("/create", isLoggedIn, function(req, res) {
    res.sendFile('workspace.html', {root : __dirname + '/public/html'});
});

app.post("/create", function(req, res) {
    var author = {
        id: req.user._id,
        username: req.user.username
    };

    var image = {
        data: req.body.image,
    };

    var newArtwork = {name: "", img: image, description: "", author: author, test: req.body.image};

    Artwork.create(newArtwork, function(err, newlyCreated) {
        if (err) {
            console.log(err);
        } else {
            User.findById(req.user._id, function (err, foundUser) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Saving");
                    foundUser.artworks.push(newlyCreated);
                    foundUser.save();
                }
            });

            // ID Will be replaced with artwork id  http://localhost:3000/artwork/6012715edac7df16fc37facc
            res.redirect("/artwork/" + newlyCreated._id);
        }
    });
})


// ===== Profile Page =====
app.get("/profile", function(req, res) {
    console.log(res.locals.currentUser);
    if (res.locals.currentUser) {
        res.render("profile");
    } else {
        res.redirect("/login");
    }   
});

app.get("/profile/:username", function(req, res) {
    User.findOne({username: new RegExp('^' + req.params.username + '$', "i")}).populate("artworks").exec(function(err, foundUser) {
        if (err) {
            console.log("Couldn't find user");
        } else {
            res.render("profile", {user: foundUser});
        }
    });
});

// ===== Artwork =====
app.get("/artwork", function(req, res) {
    console.log(res.locals.currentUser);
    res.render("artwork/index");
});

app.get("/artwork/:id", function(req, res) {
    Artwork.findById(req.params.id).populate("comments").exec(function(err, foundArtwork) {
        if (err) {
            console.log(err);
        } else {
            console.log(foundArtwork.image);
            res.render("artwork/show", {artwork: foundArtwork});
        }
    });
});

app.post("/artwork/:id/comment", isLoggedIn, function(req, res) {
    // Lookup Artwork by ID
    Artwork.findById(req.params.id, function(err, artwork) {
        if (err) {
            console.log(err);
            res.redirect("home");
        } else {
            // Create New Comment
            Comment.create(req.body.comment, function(err, comment) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Creating Comment...");
                    // Update info concerning the new comment
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();

                    // Store comment onto artwork
                    artwork.comments.push(comment);
                    artwork.save();
                
                    res.redirect("/artwork/" + artwork._id);    
                }
            });
        }
    });
});

// ===== Authorization =====
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

app.get("/login", function(req, res) {
    res.render("login");
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/login"
}), function(req, res) {}
);

app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/home");
});

// ===== Middleware ======
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    
    res.redirect("../../login");
}

app.listen(BASE_PORT, '127.0.0.1', function() {
    console.log("Brush Server started");
});