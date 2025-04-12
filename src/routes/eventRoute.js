import express from "express";
import userAuth from "../middleware/userMiddleware.js";
import { getAllEvents, getEventById } from "../controllers/eventController.js";

const eventRouter = express.Router();

eventRouter.get("/all", userAuth, getAllEvents);
eventRouter.get("/:id", userAuth, getEventById);

export default eventRouter