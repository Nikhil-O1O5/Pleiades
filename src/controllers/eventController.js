import eventModel from "../models/eventModel.js";

export const getAllEvents = async (req, res) => {
    try {
        const events = await eventModel.find({}, "-__v");  // excluding __v field
        res.status(200).json({ success: true, events });
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ success: false, message: "Failed to fetch events" });
    }
};

export const getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await eventModel.findById(id).select("-__v"); // this replaces with actual _id
        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }
        res.status(200).json({ success: true, event });
    } catch (error) {
        console.error("Error fetching event by ID:", error);
        res.status(500).json({ success: false, message: "Failed to fetch event" });
    }
};
