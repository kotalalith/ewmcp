import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { token, password } = await req.json();

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    // Set new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    
    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
