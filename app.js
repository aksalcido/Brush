const { Mongoose } = require("mongoose");

var express = require("express"),
    app = express();

// Global Variables
var BASE_PORT = 3000;




app.get('/', function(req, res) {
    res.send("hello");
});

app.listen(BASE_PORT, '127.0.0.1', function() {
    console.log("Brush Server started");
});