var express = require("express");
var handlebars = require("express-handlebars");
var bodyParser = require("body-parser");
var cheerio = require("cheerio");
var request = require("request");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var Promise = require("bluebird");


// Regquire all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

//Initialize Express

var app = express();

//Middleware

//logging requests

app.use(logger("dev"));

//Body-Parser

app.use(bodyParser.urlencoded({ extended: false}));

//Static Directory

app.use(express.static("public"));

//Connect to Mongo DB

mongoose.Promise = Promise;
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/working"

mongoose.connect("mongodb://localhost/working",{
	useMongoClient: true
});

//MONGODB_URI: mongodb://heroku_5h1xp7q5:eabdjack7fr55ggr0852968lij@ds259255.mlab.com:59255/heroku_5h1xp7q5


//Routes

//Scraping Route

app.get("/scrape", function(req, res) {
	axios.get("https://www.techcrunch.com/").then(function(response) {
		var $ = cheerio.load(response.data);
		
		//console.log("Getting here......."+ response.data)

	$("title").each(function(i, element) {

		var result = {};
		
		
		result.title = $(this)
			.children("a")
			.text();
		result.link = $(this)
			.children("a")
			.attr("href");


		db.Article
			.create(result)
			.then(function(dbArticle){
			
				res.send("Scrape Complete");

			})		
			.catch(function(err){
				res.json(err);
			});
	});

	});
});


app.get("/articles", function(req, res) {
	

	db.Article
	.find({})
	.then(function(dbArticle) {
		res.json(dbArticle);
	})
	.catch(function(err){
		res.json(err);
	});
});

app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article
    .findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note
    .create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.listen(PORT, function(){
	console.log("Server running on port "+ PORT + "!!")
})

