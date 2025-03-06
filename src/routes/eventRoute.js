import express from "express";
import { getAllEvents, getEventById } from "../controllers/eventController.js";

const eventRouter = express.Router();

eventRouter.get("/all",getAllEvents);
eventRouter.get("/:id",getEventById);

export default eventRouter