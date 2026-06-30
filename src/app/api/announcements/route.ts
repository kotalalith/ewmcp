import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Announcement from "@/models/Announcement";

export async function GET() {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json([
        { _id: "1", title: "Q3 Company All-Hands Meeting", content: "Join us for our quarterly all-hands this Friday at 3 PM.", type: "Company", pinned: true, priority: "High", createdByName: "Admin User", createdAt: new Date() },
        { _id: "2", title: "Office Closed on July 4th", content: "The office will be closed on Independence Day.", type: "Company", pinned: false, priority: "Medium", createdByName: "Admin User", createdAt: new Date() },
      ]);
    }
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const announcements = await Announcement.find({ $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }] }).sort({ pinned: -1, createdAt: -1 });
    return NextResponse.json(announcements);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
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

    const role = (session.user as any).role;
    if (!["Administrator", "Manager"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const announcement = await Announcement.create({
      ...data,
      createdBy: session.user?.email,
      createdByName: session.user?.name,
    });
    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!process.env.MONGODB_URI) return NextResponse.json({ success: true });
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (!["Administrator", "Manager"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, ...updates } = await req.json();
    const ann = await Announcement.findByIdAndUpdate(id, updates, { new: true });
    return NextResponse.json(ann);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update announcement" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!process.env.MONGODB_URI) return NextResponse.json({ success: true });
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (!["Administrator", "Manager"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    await Announcement.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete announcement" }, { status: 500 });
  }
}
