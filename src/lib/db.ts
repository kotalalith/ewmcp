import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async () => {
  if (!MONGODB_URI) {
    console.warn("⚠️ MONGODB_URI not found in env. Running in mock DB mode.");
    return; // Bypass connection if no URI (for dev/UI testing)
  }

  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
  }
};

export default connectDB;
