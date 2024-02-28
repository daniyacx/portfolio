const mongoose = require('mongoose');
const express = require("express");
const Chart = require('chart.js');
const axios = require('axios'); // Import axios for making HTTP requests
const app = express();
const session = require("express-session");
const port = 3000;
const collection = require("./config");
var methodOverride = require('method-override');
const bcrypt = require('bcrypt');
const {MongoClient, ObjectId} = require("mongodb");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(methodOverride('_method'));
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie:{
        secure: false,
        maxAge: 24*60*60*1000
    }
}));


app.get("/", (req, res) => {
    res.render("login");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

// Register User
app.post("/signup", async (req, res) => {
    try {
        const data = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            age: req.body.age,
            country: req.body.country,
            gender: req.body.gender,
            email: req.body.email,
            name: req.body.username,
            password: req.body.password,
            role: req.body.role,
        };

        const existingUser = await collection.findOne({ name: data.name });

        if (existingUser) {
            res.send('User already exists. Please choose a different username.');
        } else {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(data.password, saltRounds);
            data.password = hashedPassword;

            const newUser = await collection.create(data);
            console.log(newUser);
            const newUserWithEmail = await collection.findOne({ name: data.name });
            const userEmail = newUserWithEmail.email;
            const { sendWelcomeEmail } = require('./app');

            // Send welcome email to the new user
            sendWelcomeEmail(userEmail);

            res.send('User registered successfully!');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Login user 
app.post("/login", async (req, res) => {
    try {
        const user = await collection.findOne({ name: req.body.username });

        if (!user) {
            res.send("User not found");
            return;
        }

        const isPasswordMatch = await bcrypt.compare(req.body.password, user.password);
        if (!isPasswordMatch) {
            res.send("Incorrect password");
            return;
        }
        req.session.user = user;
        if (user.role === 'admin') {
            return res.redirect("/admin");
        } else {
            res.redirect('/home');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

let db;
async function connect(){
    try{
        const connection = await MongoClient.connect("mongodb://localhost:27017/login");
        db = connection.db();
    }catch(error){
        throw error;
    }
}
connect();

app.get('/home', async (req, res)=>{
    let portfolios = await db.collection("portfolios").find().toArray()
    res.render("home", {portfolios})
});
app.get('/admin/:id', async (req, res)=>{
    if(req.session.user.role == 'admin'){
        let portfolio = await db.collection("portfolios").findOne({_id: new ObjectId(req.params.id)});
        res.render("singlepage", {portfolio});
    }
    else{
        res.status(500).send("No permissions");
    }
});
app.put('/admin/:id', async (req, res)=>{
    let {itemImage1, itemImage2, itemImage3, itemName, itemName2, itemDescription, itemDescription2} = req.body;
    try{
        const id = req.params.id;
        const portfolio = {itemImage1, itemImage2, itemImage3, itemName, itemName2, itemDescription, itemDescription2, timestamp: new Date()};
        const result = await db.collection("portfolios").updateOne({_id: new ObjectId(id)}, {$set: portfolio});
        if(result.modifiedCount === 0){
            res.status(500).send("Portfolio not found");
        }else{
            res.redirect('/admin');
        }
    }catch(error){
        res.status(500).send(error);
    }
});

app.delete('/admin/:id', async (req, res)=>{
    try{
        const id = req.params.id;
        const result = await db.collection("portfolios").deleteOne({_id: new ObjectId(id)});
        if(result.deletedCount === 0){
            res.status(500).send("Portfolio not found");
        }else{
            res.redirect('/admin');
        }
    }catch(error){
        res.status(500).send(error);
    }
});

app.get('/admin', async (req, res) => {
    try{
        let portfolios = await db.collection("portfolios").find().toArray()
        res.render("admin", {portfolios})
    }catch(error){
        res.status(500).send(error);
    }
});

app.post('/admin', async (req, res) => {
    let {itemImage1, itemImage2, itemImage3, itemName, itemName2, itemDescription, itemDescription2} = req.body;
    try{
        const portfolio = {itemImage1, itemImage2, itemImage3, itemName, itemName2, itemDescription, itemDescription2, timestamp: new Date()};
        await db.collection("portfolios").insertOne(portfolio);
        res.redirect('/admin');
    }catch(error){
        res.status(500).send(error);
    }
});

const fetch = require('node-fetch'); 

const API_KEY_STOCKS = 'gYWI2c9eat1HGpdcPC0TzvosZvdPh3ex';
// Route to fetch stock data
app.get('/stocks/:symbol', async (req, res) => {
    const symbol = req.params.symbol;
    const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/2023-01-01/2023-12-31?unadjusted=true&apiKey=${API_KEY_STOCKS}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching stock data:', error);
        res.status(500).send('Error fetching stock data');
    }
});
app.get('/search', async (req, res) => {
    const { keywords } = req.query; 

    try {
        const unsplashResponse = await axios.get('https://api.unsplash.com/search/photos', {
            params: {
                client_id: 'Ye-tAUMzjiXHs9qpneUG7OHXDo0PQ20qAMCBDWLNCfw', 
                query: keywords, 
                per_page: 6 
            }
        });

        const photos = unsplashResponse.data.results;
        res.json({ photos });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});
// Route to fetch a random anime quote by title
app.get('/anime-quote', async (req, res) => {
    try {
        const animeTitle = req.query.title;
        const response = await fetch(`https://animechan.xyz/api/random`);
        const quote = await response.json();
        res.json(quote);
    } catch (error) {
        console.error('Error fetching anime quote:', error);
        res.status(500).send('Error fetching anime quote');
    }
});
// Route to render the graph using EJS template
app.get('/more', (req, res) => {
    res.render('more');
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
