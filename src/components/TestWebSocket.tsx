// TestWebSocket.tsx

import React, { useEffect } from "react";
import { io, Socket } from "socket.io-client";

interface TestWebSocketProps {
  url: string;
}

const TestWebSocket: React.FC<TestWebSocketProps> = ({ url }) => {
  useEffect(() => {
    const socket: Socket = io(url);

    socket.on("connect", () => {
      console.log("WebSocket connection successful.");
      socket.disconnect(); // Close the connection after the test
    });

    socket.on("disconnect", () => {
      console.log("WebSocket connection closed.");
    });

    socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error.message);
    });
  }, [url]);

  return (
    <div>WebSocket connection test. Check the browser console for results.</div>
  );
};

export default TestWebSocket;
