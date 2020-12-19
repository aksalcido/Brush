var express = require("express"),
    app = express(),
    mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/brush_database", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then( () => console.log("Connected to DB!"))
.catch(error => console.log(error.message));

// Global Variables
var BASE_PORT = 3000;

// App checks for "ejs" files in the view so we don't have to manually type '.ejs'
app.set("view engine", "ejs");

// Serve everything in the public directory
app.use(express.static(__dirname + '/public'));

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

// Login Page
app.get("/login", function(req, res) {
    res.render("login");
});

app.post("/login", function(req, res) {
    res.send("LOGGING IN ATTEMPT");
});

// Register Page
app.get("/register", function(req, res) {
    res.render("register");
});

app.post("/register", function(req, res) {
    res.send("REGISTERING ATTEMPT   ");
});

// Save Page
app.get("/save", function(req, res) {
    res.send("Save Page");
});

app.listen(BASE_PORT, '127.0.0.1', function() {
    console.log("Brush Server started");
});