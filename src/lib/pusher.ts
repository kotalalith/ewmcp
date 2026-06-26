import PusherServer from "pusher";

export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID || "mock_id",
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || "mock_key",
  secret: process.env.PUSHER_SECRET || "mock_secret",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mock_cluster",
  useTLS: true,
});
