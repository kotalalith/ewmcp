import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "../../../lib/db";
import Task from "@/models/Task";

export async function GET(req: Request) {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json([
        { _id: "1", title: "Design System Update", status: "In Progress", priority: "High", assignee: "admin@test.com" },
        { _id: "2", title: "Client Presentation", status: "To Do", priority: "Medium", assignee: "manager@test.com" }
      ]);
    }

    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch tasks. Could filter by assignee based on role.
    const role = (session.user as any).role;
    let tasks;
    
    if (["Administrator", "Manager", "Team Lead"].includes(role)) {
      tasks = await Task.find().populate("project").sort({ createdAt: -1 });
    } else {
      // Employees only see their own tasks
      tasks = await Task.find({ assignee: session?.user?.email || "admin@test.com" }).sort({ createdAt: -1 });
    }

    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!process.env.MONGODB_URI) {
      return NextResponse.json({
        _id: Date.now().toString(),
        title: data.title,
        description: data.description,
        status: data.status || "To Do",
        priority: data.priority || "Medium",
        project: data.project,
        assignee: data.assignee || "Unknown",
        dueDate: data.dueDate
      }, { status: 201 });
    }

    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role === "Client") {
      return NextResponse.json({ error: "Forbidden: Clients cannot create tasks" }, { status: 403 });
    }

    const newTask = await Task.create({
      title: data.title,
      description: data.description,
      status: data.status || "Not Started",
      priority: data.priority || "Medium",
      project: data.project,
      assignee: data.assignee || session?.user?.email || "Unknown",
      dueDate: data.dueDate
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { id, status, title } = data;

    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ _id: id, status, title });
    }

    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const task = await Task.findById(id);
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const role = (session.user as any).role;
    
    // Employees can only update their own tasks (and maybe only the status)
    if (role === "Employee" && task.assignee !== session?.user?.email) {
      return NextResponse.json({ error: "Forbidden: You can only edit your assigned tasks" }, { status: 403 });
    }

    const updatedTask = await Task.findByIdAndUpdate(id, { status, title }, { new: true });
    return NextResponse.json(updatedTask);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!process.env.MONGODB_URI) return NextResponse.json({ success: true });
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await Task.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}