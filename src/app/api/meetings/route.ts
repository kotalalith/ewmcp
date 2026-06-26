import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
// @ts-ignore
import nodemailer from "nodemailer";
import connectDB from "../../../lib/db";
import Meeting from "@/models/Meeting";

export async function GET(req: Request) {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json([
        { _id: "1", title: "Project Sync", date: "2026-10-15", time: "10:00", type: "Zoom" }
      ]);
    }
    
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const meetings = await Meeting.find().sort({ date: 1, time: 1 });
    return NextResponse.json(meetings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch meetings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, date, time, location, attendees, type } = body;

    if (!process.env.MONGODB_URI) {
      return NextResponse.json({
        _id: Date.now().toString(),
        title, date, time, location, type: type || "Zoom",
        attendees: Array.isArray(attendees) ? attendees : []
      }, { status: 201 });
    }

    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Save to DB
    const newMeeting = await Meeting.create({
      title, date, time, location, type: type || "Zoom", 
      attendees: Array.isArray(attendees) ? attendees : [],
      organizer: session?.user?.email || "Unknown"
    });

    // Nodemailer configuration (Mock transport)
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: process.env.EMAIL_USER || "test@ethereal.email",
        pass: process.env.EMAIL_PASS || "password123",
      },
    });

    const mailOptions = {
      from: `"EWMCP System" <noreply@ewmcp.com>`,
      to: Array.isArray(attendees) ? attendees.join(", ") : "team@ewmcp.com",
      subject: `Meeting Invitation: ${title}`,
      text: `You have been invited to a meeting.\n\nTitle: ${title}\nDate: ${date}\nTime: ${time}\nLocation: ${location}\n\nScheduled by: ${session?.user?.name || 'Admin'}`,
    };

    // await transporter.sendMail(mailOptions);
    console.log("Mock Email Sent:", mailOptions);

    return NextResponse.json(newMeeting, { status: 201 });
  } catch (error) {
    console.error("Meeting Error:", error);
    return NextResponse.json({ error: "Failed to schedule meeting" }, { status: 500 });
  }
}
