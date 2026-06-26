import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ error: "Cannot create account in Mock DB mode. Please configure MONGODB_URI." }, { status: 503 });
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: "Email is already in use" }, { status: 409 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || "Employee",
    });

    // Don't send password back
    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error("Signup Error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
