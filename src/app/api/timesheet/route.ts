import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Timesheet from "@/models/Timesheet";

function getWeekBounds(dateStr?: string) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const day = d.getDay(); // 0=Sun
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    weekStart: monday.toISOString().split("T")[0],
    weekEnd: sunday.toISOString().split("T")[0],
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const weekStart = searchParams.get("weekStart");
    const all = searchParams.get("all");

    if (!process.env.MONGODB_URI) {
      const { weekStart: ws, weekEnd: we } = getWeekBounds();
      return NextResponse.json([{
        _id: "1", userId: "employee@test.com", userName: "Employee User",
        weekStart: ws, weekEnd: we, entries: [], totalHours: 0, status: "Draft"
      }]);
    }
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    let query: any = {};

    if (!["Administrator", "Manager"].includes(role) || !all) {
      query.userId = session.user?.email;
    }
    if (weekStart) query.weekStart = weekStart;

    const timesheets = await Timesheet.find(query).sort({ weekStart: -1 });
    return NextResponse.json(timesheets);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch timesheets" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ _id: Date.now().toString(), ...data }, { status: 201 });
    }
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { weekStart, weekEnd } = getWeekBounds(data.weekStart);
    const totalHours = (data.entries || []).reduce((sum: number, e: any) => sum + (e.hours || 0), 0);

    // Upsert: if a timesheet for this week exists, update it
    const timesheet = await Timesheet.findOneAndUpdate(
      { userId: session.user?.email, weekStart },
      {
        userId: session.user?.email,
        userName: session.user?.name,
        weekStart, weekEnd,
        entries: data.entries || [],
        totalHours,
        status: data.status || "Draft",
        notes: data.notes,
      },
      { upsert: true, new: true }
    );
    return NextResponse.json(timesheet, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save timesheet" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!process.env.MONGODB_URI) return NextResponse.json({ success: true });
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, status } = await req.json();
    const role = (session.user as any).role;

    const updates: any = { status };
    if (["Approved", "Rejected"].includes(status) && ["Administrator", "Manager"].includes(role)) {
      updates.approvedBy = session.user?.email;
      updates.approvedAt = new Date();
    }

    const ts = await Timesheet.findByIdAndUpdate(id, updates, { new: true });
    return NextResponse.json(ts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update timesheet" }, { status: 500 });
  }
}
