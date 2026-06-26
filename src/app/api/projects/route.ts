import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "../../../lib/db";
import Project from "@/models/Project";

export async function GET(req: Request) {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json([
        { _id: "1", name: "Alpha Website Redesign", description: "Modernize UI", status: "Active", progress: 65, team: ["admin@test.com"] },
        { _id: "2", name: "Beta Mobile App", description: "iOS and Android launch", status: "Planning", progress: 20, team: ["manager@test.com"] }
      ]);
    }

    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    let query = {};
    if (role !== "Administrator") {
      query = { team: session?.user?.email || "admin@test.com" };
    }
    const projects = await Project.find(query).sort({ createdAt: -1 });
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, description, status, progress, team } = await req.json();

    if (!process.env.MONGODB_URI) {
      return NextResponse.json({
        _id: Date.now().toString(),
        name, description, status, progress, team
      }, { status: 201 });
    }

    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (!["Administrator", "Manager", "Team Lead"].includes(role)) {
      return NextResponse.json({ error: "Forbidden: You cannot create projects" }, { status: 403 });
    }

    const newProject = await Project.create({
      name,
      description,
      status: status || "Planning",
      progress: progress || 0,
      team,
      createdBy: session?.user?.email || "Unknown",
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== "Administrator") {
      return NextResponse.json({ error: "Forbidden: Only Admins can delete projects" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Project ID is required" }, { status: 400 });

    if (id.length < 24) {
      return NextResponse.json({ message: "Dummy project deleted locally" });
    }

    await Project.findByIdAndDelete(id);
    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
