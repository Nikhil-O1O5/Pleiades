import mongoose from 'mongoose';
import dotenv from 'dotenv';
import eventModel from '../models/eventModel.js';

dotenv.config("../../.env");

const events = [
    {
        eventname: "Codewar",
        date: new Date("2025-03-10"),
        venue: "Main Auditorium",
        shortDescription: "Competitive coding event",
        price: 50,
        organizerName: "Sanjana",
        organizerEmail: "sanjana@example.com",
        organizerPhoneNo: "1234567890",
        rules: ["No AI tools", "Individual participation only"]
    },
    {
        eventname: "Tech Talk",
        date: new Date("2025-03-15"),
        venue: "Room 101",
        shortDescription: "Insights into AI",
        price: 100,
        organizerName: "John Doe",
        organizerEmail: "john@example.com",
        organizerPhoneNo: "9876543210",
        rules: ["Open for all", "Registration required"]
    }
];

const seedDB = async () => {
    const URL = "mongodb+srv://nikhilbasutkar01:jg6JmnVd3IWTwk6T@cluster0.f1kyz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    console.log(URL);
    if(!URL){
        throw new Error("MONGO_DB_URL is not defined in the environment variables.");
    }
    try {
        await mongoose.connect(URL);
        console.log("Connected to DB");

        await eventModel.deleteMany();
        console.log("Existing events cleared");

        await eventModel.insertMany(events);
        console.log("Events inserted successfully!");

        mongoose.connection.close();
    } catch (error) {
        console.error("Error inserting Events into DB:", error);
    }
};

seedDB();
