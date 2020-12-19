const { Mongoose } = require("mongoose");

var express = require("express"),
    app = express();

// Global Variables
var BASE_PORT = 3000;

// App checks for "ejs" files in the view so we don't have to manually type '.ejs'
app.set("view engine", "ejs");

// Serve everything in the public directory
app.use(express.static(__dirname + '/public'));

app.get("/home", function(req, res) {
    res.render("home");
});

app.get('/', function(req, res) {
    res.render("landing");
});

app.listen(BASE_PORT, '127.0.0.1', function() {
    console.log("Brush Server started");
});