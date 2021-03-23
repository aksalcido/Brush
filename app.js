// Imported Libraries
var express = require("express"),
    app = express(),
    flash = require("connect-flash"),
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

// ENVIRONMENT VARIABLES
const BRUSH_DATABASE_PASSWORD = process.env.BrushMongoosePassword;
const BRUSH_DATABASE_URL1     = process.env.BrushDatabaseURL1;
const BRUSH_DATABASE_URL2     = process.env.BrushDatabaseURL2;

// Global Host Variables
const PORT = process.env.PORT || 3000;

// Global Database Variables
const usingLocalDatabase = true;
const connectionParams = {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true 
}

// for now local database
var DATABASE_URL = "mongodb://localhost:27017/brush_database";

// ===== END VIDEO ===== // 
if (usingLocalDatabase) {
    var DROP_DATABASE = false;

    if (!DROP_DATABASE) {
        // Setup (if not created already) and Connect the Mongoose Database
        mongoose.connect(DATABASE_URL, connectionParams)
        .then( () => console.log("Connected to Local database") )
        .catch(error => console.log(error.message));      
    } else {
        mongoose.connect(DATABASE_URL, connectionParams)
        .then(() => { db.dropDatabase(function(err, result) {
            if (err) throw err;
            console.log("Operation Success ? " + result);
            db.close();
        })})
        .catch(error => console.log(error.message));
    }
}
// Using Mongod Atlas Database
else {
    DATABASE_URL = BRUSH_DATABASE_URL1 + BRUSH_DATABASE_PASSWORD + BRUSH_DATABASE_URL2;
    
    mongoose.connect(DATABASE_URL,connectionParams)
        .then( () => {
            console.log('Connected to Atlas database ')
        })
        .catch( (err) => {
            console.error(`Error connecting to the database. \n${err}`);
    })
}

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

// Enables Flash
app.use(flash());

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

// Middleware
var middlewareObj = require("./middleware/index.js");
const { config } = require("process");


// MIDDLEWARE that will run for every single route
app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    // Middleware is ran and then next route
    next();
});


app.use("/", authRoutes);
app.use("/create", createRoutes);
app.use("/artwork", artworkRoutes);
app.use("/profile", userRoutes);


app.listen(PORT, '127.0.0.1', function() {
    console.log("Brush Server started");
});