import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Asset from "@/models/Asset";

export async function GET(req: Request) {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json([
        { _id: "1", name: "MacBook Pro 16\"", type: "Laptop", serialNumber: "MBP16-2026-009", assignedTo: "employee@test.com", assignedToName: "Employee User", status: "Allocated", allocatedDate: new Date() },
        { _id: "2", name: "Dell UltraSharp 27\"", type: "Monitor", serialNumber: "DEL27-UX-881", status: "Available" },
      ]);
    }
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const assets = await Asset.find({}).sort({ createdAt: -1 });
    return NextResponse.json(assets);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
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
    if (role !== "Administrator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const asset = await Asset.create(data);
    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create asset" }, { status: 500 });
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
    if (updates.status === "Allocated" && !updates.allocatedDate) {
      updates.allocatedDate = new Date();
    }

    const asset = await Asset.findByIdAndUpdate(id, updates, { new: true });
    return NextResponse.json(asset);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update asset" }, { status: 500 });
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
    await Asset.findByIdAndDelete(searchParams.get("id"));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 });
  }
}
