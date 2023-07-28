// components/VideoMeetingRoom.tsx
import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";

const VideoMeetingRoom = ({
  roomId,
  userId,
}: {
  roomId: string;
  userId: string;
}) => {
  const [users, setUsers] = useState<string[]>([]);
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const peerVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    console.log("Room Id:", roomId, "User Id:", userId);
    // Connect to the signaling server using Socket.IO
    socketRef.current = io("http://localhost:8080", {
      transports: ["websocket"],
    });

    socketRef.current?.on("connection", () => {
      console.log("WebSocket connection successful.");
    });

    socketRef.current;

    // Join the video meeting room with the provided roomId and userId
    socketRef.current.emit("join-room", roomId, userId);

    // Listen for user list and update the state
    socketRef.current.on("user-list", (userList: string[]) => {
      setUsers(userList);
    });

    // Listen for user joined and update the state
    socketRef.current.on(
      "user-joined",
      (newUserId: string, userList: string[]) => {
        setUsers(userList);
      }
    );

    // Listen for user left and update the state
    socketRef.current.on(
      "user-left",
      (leftUserId: string, userList: string[]) => {
        setUsers(userList);
      }
    );

    // Clean up on component unmount
    return () => {
      socketRef.current?.disconnect();
    };
  }, [roomId, userId]);

  // Function to handle signaling message exchange
  const handleSignal = (signal: any) => {
    socketRef.current?.emit("signal", roomId, userId, signal);
  };

  // Function to create and set up the peer connection
  const setupPeerConnection = () => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        // Add your ICE servers here
        { urls: "stun:stun.example.com" }, // Example STUN server
        {
          urls: "turn:turn.example.com",
          username: "your-username",
          credential: "your-password",
        }, // Example TURN server with credentials
      ],
    });

    // Add the user's media stream to the peer connection (only once during setup)
    if (
      userVideoRef.current &&
      userVideoRef.current.srcObject instanceof MediaStream
    ) {
      userVideoRef.current.srcObject
        .getTracks()
        .forEach((track) =>
          peerConnection.addTrack(
            track,
            userVideoRef.current?.srcObject as MediaStream
          )
        );
    }

    // Add event listener for ICE candidate generation and send the candidate to the other user(s)
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        handleSignal({ candidate: event.candidate });
      }
    };

    // Add event listener for incoming media stream and set the remote video source
    peerConnection.ontrack = (event) => {
      if (peerVideoRef.current && event.streams[0]) {
        peerVideoRef.current.srcObject = event.streams[0];
      }
    };

    return peerConnection;
  };

  // Function to initiate the video call
  const startCall = async () => {
    const constraints: MediaStreamConstraints = {
      video: true,
      audio: true,
    };

    try {
      const userMediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = userMediaStream;
      }

      // Create and set up the peer connection
      peerConnectionRef.current = setupPeerConnection();

      // Create and send the WebRTC offer to the other user(s)
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      handleSignal({ offer: peerConnectionRef.current.localDescription });
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  // Function to handle incoming signaling messages and set up the peer connection
  const handleSignalingMessage = async (message: any) => {
    if (message.offer) {
      // Create and set up the peer connection
      peerConnectionRef.current = setupPeerConnection();

      // Add the user's media stream to the peer connection
      const userMediaStream = userVideoRef.current?.srcObject as MediaStream;
      userMediaStream
        .getTracks()
        .forEach((track) =>
          peerConnectionRef.current?.addTrack(track, userMediaStream)
        );

      // Set the remote description and create the WebRTC answer
      await peerConnectionRef.current.setRemoteDescription(message.offer);
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      // Send the WebRTC answer to the other user(s)
      handleSignal({ answer: peerConnectionRef.current.localDescription });
    } else if (message.answer) {
      // Set the remote description with the received WebRTC answer
      await peerConnectionRef.current?.setRemoteDescription(message.answer);
    } else if (message.candidate) {
      // Add the received ICE candidate to the peer connection
      try {
        await peerConnectionRef.current?.addIceCandidate(message.candidate);
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    }
  };

  return (
    <div>
      <h1>Video Meeting Room: {roomId}</h1>
      <div>
        <video ref={userVideoRef} autoPlay playsInline muted />
        <video ref={peerVideoRef} autoPlay playsInline />
      </div>
      <div>
        <button onClick={startCall}>Start Video Call</button>
      </div>
      <div>
        <h2>Connected Users:</h2>
        <ul>
          {users.map((user) => (
            <li key={user}>{user}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default VideoMeetingRoom;
