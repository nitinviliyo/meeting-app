import { useRouter } from "next/router";
import VideoMeetingRoom from "../components/VideoMeetingRoom";
import TestWebSocket from "@/components/TestWebSocket";

function generateString(length: number): string {
  let result = " ";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

const Home = () => {
  const router = useRouter();
  const roomId = "first-meeting-room";
  const userId = generateString(10);

  // return <div>Home Screen</div>;

  return (
    <div>
      {roomId && userId ? (
        <VideoMeetingRoom roomId={roomId as string} userId={userId} />
      ) : (
        <h1>Please specify a valid room ID in the URL.</h1>
      )}
      <TestWebSocket url="http://localhost:8080" />
    </div>
  );
};

export default Home;
