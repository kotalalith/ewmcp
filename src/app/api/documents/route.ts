import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Document from "@/models/Document";

export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const documents = await Document.find({}).sort({ createdAt: -1 });
    return NextResponse.json(documents);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, url, type, size, category } = await req.json();

    const newDoc = await Document.create({
      name,
      url,
      type,
      size,
      category,
      uploadedBy: session.user?.name || session.user?.email || "Unknown User",
    });

    return NextResponse.json(newDoc);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) return NextResponse.json({ error: "Document ID required" }, { status: 400 });

    const deletedDoc = await Document.findByIdAndDelete(id);
    if (!deletedDoc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
