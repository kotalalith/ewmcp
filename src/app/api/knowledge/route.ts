import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import KnowledgeArticle from "@/models/KnowledgeArticle";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const q = searchParams.get("q");

    if (!process.env.MONGODB_URI) {
      return NextResponse.json([
        { _id: "1", title: "How to Apply for Leave", content: "Navigate to the Leave module...", category: "Guide", tags: ["leave", "hr"], views: 42, helpful: 18, createdByName: "Admin User", createdAt: new Date() },
        { _id: "2", title: "VPN Setup Guide", content: "Download the VPN client from IT portal...", category: "Documentation", tags: ["it", "vpn"], views: 67, helpful: 31, createdByName: "Admin User", createdAt: new Date() },
        { _id: "3", title: "Leave Policy 2026", content: "Employees are entitled to 21 days annual leave...", category: "Policy", tags: ["policy", "leave"], views: 103, helpful: 55, createdByName: "HR Manager", createdAt: new Date() },
      ]);
    }
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let query: any = { published: true };
    if (category && category !== "All") query.category = category;
    if (q) query.$or = [{ title: { $regex: q, $options: "i" } }, { content: { $regex: q, $options: "i" } }, { tags: { $in: [q.toLowerCase()] } }];

    const articles = await KnowledgeArticle.find(query).sort({ views: -1, createdAt: -1 });
    return NextResponse.json(articles);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
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

    // Handle view increment separately
    if (data.incrementView) {
      const updated = await KnowledgeArticle.findByIdAndUpdate(data.id, { $inc: { views: 1 } }, { new: true });
      return NextResponse.json(updated);
    }

    const article = await KnowledgeArticle.create({
      ...data,
      createdBy: session.user?.email,
      createdByName: session.user?.name,
    });
    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!process.env.MONGODB_URI) return NextResponse.json({ success: true });
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, incrementHelpful, incrementNotHelpful, ...updates } = await req.json();
    if (incrementHelpful) {
      const a = await KnowledgeArticle.findByIdAndUpdate(id, { $inc: { helpful: 1 } }, { new: true });
      return NextResponse.json(a);
    }
    if (incrementNotHelpful) {
      const a = await KnowledgeArticle.findByIdAndUpdate(id, { $inc: { notHelpful: 1 } }, { new: true });
      return NextResponse.json(a);
    }
    const article = await KnowledgeArticle.findByIdAndUpdate(id, updates, { new: true });
    return NextResponse.json(article);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!process.env.MONGODB_URI) return NextResponse.json({ success: true });
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (!["Administrator", "Manager"].includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    await KnowledgeArticle.findByIdAndDelete(searchParams.get("id"));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}
