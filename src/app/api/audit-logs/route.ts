import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import AuditLog from "@/models/AuditLog";

export async function GET(req: Request) {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json([
        { _id: "1", userName: "Admin User", userEmail: "admin@test.com", action: "LOGIN", resource: "Auth", status: "Success", createdAt: new Date() },
        { _id: "2", userName: "Manager User", userEmail: "manager@test.com", action: "CREATE_PROJECT", resource: "Project", details: "Alpha Website Redesign", status: "Success", createdAt: new Date() },
      ]);
    }
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== "Administrator") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    const logs = await AuditLog.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
    const total = await AuditLog.countDocuments();
    return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!process.env.MONGODB_URI) return NextResponse.json({ success: true });
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await AuditLog.create({
      userId: (session.user as any).id || session.user?.email,
      userEmail: session.user?.email,
      userName: session.user?.name,
      ...data,
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to log action" }, { status: 500 });
  }
}
