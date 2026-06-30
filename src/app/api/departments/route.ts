import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Department from "@/models/Department";

export async function GET() {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json([
        { _id: "1", name: "Engineering", description: "Software development team", head: "manager@test.com", headName: "Manager User", members: ["employee@test.com", "lead@test.com"], color: "#3b82f6" },
        { _id: "2", name: "Design", description: "UI/UX and graphics", head: "lead@test.com", headName: "Team Lead User", members: ["employee@test.com"], color: "#8b5cf6" },
        { _id: "3", name: "Marketing", description: "Marketing and communications", head: "manager@test.com", headName: "Manager User", members: [], color: "#10b981" },
      ]);
    }
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const departments = await Department.find({}).sort({ name: 1 });
    return NextResponse.json(departments);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
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
    if (role !== "Administrator") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const dept = await Department.create(data);
    return NextResponse.json(dept, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!process.env.MONGODB_URI) return NextResponse.json({ success: true });
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== "Administrator") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id, ...updates } = await req.json();
    const dept = await Department.findByIdAndUpdate(id, updates, { new: true });
    return NextResponse.json(dept);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update department" }, { status: 500 });
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
    await Department.findByIdAndDelete(searchParams.get("id"));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete department" }, { status: 500 });
  }
}
