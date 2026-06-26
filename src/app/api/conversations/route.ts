import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Conversation from "@/models/Conversation";

export async function GET(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const conversations = await Conversation.find({
      participants: session.user.email
    }).sort({ updatedAt: -1 });

    return NextResponse.json(conversations);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { type, name, participantEmail, participants } = await req.json();

    if (type === "direct") {
      // Check if conversation already exists between these two users
      const existingConvo = await Conversation.findOne({
        type: "direct",
        participants: { $all: [session.user.email, participantEmail] },
      });

      if (existingConvo) {
        return NextResponse.json(existingConvo);
      }

      // Create new direct conversation
      const newConvo = await Conversation.create({
        type: "direct",
        participants: [session.user.email, participantEmail],
      });
      return NextResponse.json(newConvo, { status: 201 });
    } else {
      // Create a new channel with selected participants + creator
      const finalParticipants = Array.from(new Set([session.user.email, ...(participants || [])]));
      
      const newConvo = await Conversation.create({
        type: "channel",
        name,
        participants: finalParticipants,
      });
      return NextResponse.json(newConvo, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, name, participants } = await req.json();

    const conversation = await Conversation.findOne({ _id: id, participants: session.user.email });
    if (!conversation) return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });

    const finalParticipants = Array.from(new Set([session.user.email, ...(participants || [])]));
    
    conversation.name = name || conversation.name;
    conversation.participants = finalParticipants;
    await conversation.save();

    return NextResponse.json(conversation);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const conversation = await Conversation.findOneAndDelete({ _id: id, participants: session.user.email });
    if (!conversation) return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
  }
}
