"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRef, useEffect } from "react";
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

export default function MeetingRoomPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const zpRef = useRef<any>(null);

  const userName = session?.user?.name || "Guest User";
  
  // Create a unique ID for the user if they don't have one
  const userID = session?.user?.email 
    ? session.user.email.replace(/[^a-zA-Z0-9]/g, "") + "_" + Math.floor(Math.random() * 10000).toString()
    : Math.floor(Math.random() * 10000).toString();

  const meetingId = id as string;

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || zpRef.current) return;

    const appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID || "0", 10);
    const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || "";

    if (!appID || !serverSecret) {
      console.error("ZegoCloud keys are missing! Please add them to .env.local");
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:white;padding:20px;text-align:center;">
            <h2 style="font-size:24px;margin-bottom:10px;">Missing ZegoCloud Keys</h2>
            <p style="color:#94a3b8;">Please add NEXT_PUBLIC_ZEGO_APP_ID and NEXT_PUBLIC_ZEGO_SERVER_SECRET to your .env.local file.</p>
          </div>
        `;
      }
      return;
    }

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      meetingId,
      userID,
      userName
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);
    zpRef.current = zp;

    zp.joinRoom({
      container: containerRef.current,
      scenario: {
        mode: ZegoUIKitPrebuilt.VideoConference,
      },
      showPreJoinView: true,
      showScreenSharingButton: true,
      onLeaveRoom: () => {
        router.push('/dashboard/meetings');
      }
    });

    return () => {
      if (zpRef.current) {
        try {
          zpRef.current.destroy();
        } catch (e) {
          console.error("Error destroying Zego instance:", e);
        }
        zpRef.current = null;
      }
    };
  }, [meetingId, userID, userName, router]);

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <Link href="/dashboard/meetings" className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-brand-500 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Meetings
          </Link>
          <h1 className="text-2xl font-bold font-outfit text-foreground mt-2">Premium Video Call</h1>
        </div>
      </div>

      <div className="flex-1 w-full bg-slate-900 rounded-2xl overflow-hidden border border-[var(--border)] shadow-2xl relative">
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
