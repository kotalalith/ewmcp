import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Message from "@/models/Message";
import { pusherServer } from "@/lib/pusher";

export async function GET(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const channel = searchParams.get("channel") || "general";

    const messages = await Message.find({ channel }).sort({ createdAt: 1 });
    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { channel, content } = await req.json();

    const newMessage = await Message.create({
      channel,
      sender: session.user?.email,
      senderName: session.user?.name,
      content,
    });

    // Trigger Pusher event
    try {
      await pusherServer.trigger(channel, "new-message", newMessage);
    } catch (pusherError) {
      console.error("Pusher trigger failed (missing config in dev?)", pusherError);
    }

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
