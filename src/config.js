const mongoose = require('mongoose');
const connect = mongoose.connect("mongodb://localhost:27017/login");

// Check database connected or not
connect.then(() => {
    console.log("Database Connected Successfully");
})
.catch(() => {
    console.log("Database cannot be Connected");
})

// Create Schema
const Loginschema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true 
    },
    name: {
        type:String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'regular'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now // Default creation date is current date/time
    }
});

const collection = mongoose.model("users", Loginschema);

module.exports = collection;