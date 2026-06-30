import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Ticket from "@/models/Ticket";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    if (!process.env.MONGODB_URI) {
      return NextResponse.json([
        { _id: "1", ticketId: "TKT-0001", title: "VPN not connecting", description: "Cannot connect to VPN from home.", category: "IT Support", priority: "High", status: "Open", createdByName: "Employee User", createdAt: new Date(), comments: [] },
      ]);
    }
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    let query: any = {};
    if (!["Administrator", "Manager"].includes(role)) {
      query.$or = [{ createdBy: session.user?.email }, { assignedTo: session.user?.email }];
    }
    if (status && status !== "All") query.status = status;

    const tickets = await Ticket.find(query).sort({ createdAt: -1 });
    return NextResponse.json(tickets);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ _id: Date.now().toString(), ticketId: "TKT-0001", ...data, status: "Open", comments: [] }, { status: 201 });
    }
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check if adding a comment to existing ticket
    if (data.ticketId && data.comment) {
      const ticket = await Ticket.findByIdAndUpdate(
        data.ticketId,
        { $push: { comments: { author: session.user?.email, authorName: session.user?.name, content: data.comment, createdAt: new Date() } } },
        { new: true }
      );
      return NextResponse.json(ticket);
    }

    const ticket = await Ticket.create({
      title: data.title,
      description: data.description,
      category: data.category || "Other",
      priority: data.priority || "Medium",
      createdBy: session.user?.email,
      createdByName: session.user?.name,
      status: "Open",
    });
    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!process.env.MONGODB_URI) return NextResponse.json({ success: true });
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, status, assignedTo, assignedToName, comment } = await req.json();
    const updates: any = {};
    if (status) {
      updates.status = status;
      if (status === "Resolved") updates.resolvedAt = new Date();
    }
    if (assignedTo) { updates.assignedTo = assignedTo; updates.assignedToName = assignedToName; }
    if (comment) {
      const ticket = await Ticket.findByIdAndUpdate(
        id,
        { ...updates, $push: { comments: { author: session.user?.email, authorName: session.user?.name, content: comment, createdAt: new Date() } } },
        { new: true }
      );
      return NextResponse.json(ticket);
    }

    const ticket = await Ticket.findByIdAndUpdate(id, updates, { new: true });
    return NextResponse.json(ticket);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!process.env.MONGODB_URI) return NextResponse.json({ success: true });
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== "Administrator") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    await Ticket.findByIdAndDelete(searchParams.get("id"));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 });
  }
}
