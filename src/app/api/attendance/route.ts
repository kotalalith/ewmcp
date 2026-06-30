import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Attendance from "@/models/Attendance";

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // YYYY-MM format
    const userId = searchParams.get("userId");

    if (!process.env.MONGODB_URI) {
      return NextResponse.json([
        { _id: "1", userId: "employee@test.com", userName: "Employee User", date: getTodayStr(), clockIn: new Date(), status: "Present", totalHours: 0, breaks: [] }
      ]);
    }
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    let query: any = {};

    if (!["Administrator", "Manager"].includes(role)) {
      query.userId = session.user?.email;
    } else if (userId) {
      query.userId = userId;
    }

    if (month) {
      query.date = { $regex: `^${month}` };
    }

    const records = await Attendance.find(query).sort({ date: -1 });
    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action } = await req.json(); // 'clock-in' | 'clock-out' | 'break-start' | 'break-end'
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ success: true, action });
    }
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const today = getTodayStr();
    const userId = session.user?.email!;
    const userName = session.user?.name!;
    const now = new Date();

    let record = await Attendance.findOne({ userId, date: today });

    if (action === "clock-in") {
      if (record) {
        return NextResponse.json({ error: "Already clocked in today" }, { status: 400 });
      }
      record = await Attendance.create({
        userId, userName, date: today,
        clockIn: now, status: "Present", breaks: []
      });
    } else if (action === "clock-out") {
      if (!record || !record.clockIn) {
        return NextResponse.json({ error: "Not clocked in" }, { status: 400 });
      }
      const totalMs = now.getTime() - new Date(record.clockIn).getTime();
      // Subtract break time
      let breakMs = 0;
      for (const b of record.breaks) {
        if (b.end) breakMs += new Date(b.end).getTime() - new Date(b.start).getTime();
      }
      const totalHours = parseFloat(((totalMs - breakMs) / 3600000).toFixed(2));
      record = await Attendance.findOneAndUpdate(
        { userId, date: today },
        { clockOut: now, totalHours },
        { new: true }
      );
    } else if (action === "break-start") {
      record = await Attendance.findOneAndUpdate(
        { userId, date: today },
        { $push: { breaks: { start: now } } },
        { new: true }
      );
    } else if (action === "break-end") {
      // Find the last open break and close it
      if (!record) return NextResponse.json({ error: "No record found" }, { status: 404 });
      const breaks = record.breaks;
      const lastBreakIdx = breaks.findLastIndex((b: any) => !b.end);
      if (lastBreakIdx === -1) return NextResponse.json({ error: "No open break" }, { status: 400 });
      breaks[lastBreakIdx].end = now;
      record = await Attendance.findOneAndUpdate(
        { userId, date: today },
        { breaks },
        { new: true }
      );
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update attendance" }, { status: 500 });
  }
}
