import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Leave from "@/models/Leave";

export async function GET(req: Request) {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json([
        { _id: "1", applicant: "employee@test.com", applicantName: "Employee User", type: "Annual", startDate: "2026-07-01", endDate: "2026-07-03", days: 3, reason: "Family vacation", status: "Pending", createdAt: new Date() },
        { _id: "2", applicant: "employee@test.com", applicantName: "Employee User", type: "Sick", startDate: "2026-06-15", endDate: "2026-06-15", days: 1, reason: "Feeling unwell", status: "Approved", createdAt: new Date() },
      ]);
    }
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query: any = {};
    // Employees see only their own. Managers/Admins see all.
    if (!["Administrator", "Manager", "Team Lead"].includes(role)) {
      query.applicant = session.user?.email;
    }
    if (status && status !== "All") query.status = status;

    const leaves = await Leave.find(query).sort({ createdAt: -1 });
    return NextResponse.json(leaves);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch leaves" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ _id: Date.now().toString(), ...data, status: "Pending" }, { status: 201 });
    }
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const leave = await Leave.create({
      applicant: session.user?.email,
      applicantName: session.user?.name,
      type: data.type,
      startDate: start,
      endDate: end,
      days,
      reason: data.reason,
      status: "Pending",
    });
    return NextResponse.json(leave, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to apply leave" }, { status: 500 });
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

    const { id, status, rejectionReason } = await req.json();
    const updateData: any = {
      status,
      approvedBy: session.user?.email,
      approvedAt: new Date(),
    };
    if (rejectionReason) updateData.rejectionReason = rejectionReason;

    const leave = await Leave.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json(leave);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update leave" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!process.env.MONGODB_URI) return NextResponse.json({ success: true });
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const leave = await Leave.findById(id);
    if (!leave) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Only the applicant can cancel their own pending leave
    if (leave.applicant !== session.user?.email && (session.user as any).role !== "Administrator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await Leave.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete leave" }, { status: 500 });
  }
}
