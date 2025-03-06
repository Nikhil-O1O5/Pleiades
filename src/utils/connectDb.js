import mongoose from "mongoose";

export const connectDb = async() => {
  const url = process.env.MONGO_DB_URL
  if(!url){
    throw new Error("MONGO_DB_URL is not defined in the environment variables.");
  }

  try {
    await mongoose.connect(url);
    console.log("Database Connected Successfully");
  } catch (error) {
    console.error("Error connecting to the database:", error);
    process.exit(1); 
  }
}
