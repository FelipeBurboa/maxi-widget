import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { Donation, StreamElementsEvent } from "../types/donation";

interface UseStreamElementsReturn {
  isConnected: boolean;
  connectionError: string | null;
  testDonation: () => void;
}

interface UseStreamElementsOptions {
  jwtToken: string;
  channelId: string;
  enabled: boolean;
  testMode: boolean;
  onDonation?: (donation: Donation) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export const useStreamElements = (
  options: UseStreamElementsOptions
): UseStreamElementsReturn => {
  const {
    jwtToken,
    channelId,
    enabled,
    testMode,
    onDonation,
    onConnect,
    onDisconnect,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const mountedRef = useRef(true);

  const testDonation = () => {
    const testDonations = [
      { amount: 5, donor: "TestUser1", message: "This is a test donation!" },
      { amount: 25, donor: "TestUser2", message: "Love the stream!" },
      { amount: 50, donor: "TestUser3", message: "Keep up the great work!" },
      { amount: 100, donor: "BigTestDonor", message: "You're awesome!" },
      { amount: 10, donor: "Anonymous", message: "" },
    ];

    const randomDonation =
      testDonations[Math.floor(Math.random() * testDonations.length)];
    const donation: Donation = {
      id: `test-${Date.now()}`,
      amount: randomDonation.amount,
      donor: randomDonation.donor,
      message: randomDonation.message,
      timestamp: new Date(),
    };

    console.log("🧪 Simulating test donation:", donation);
    onDonation?.(donation);
  };

  // Test mode simulation
  useEffect(() => {
    if (testMode && enabled) {
      console.log("🧪 StreamElements test mode enabled");
      setIsConnected(true);
      setConnectionError(null);

      const interval = setInterval(() => {
        if (mountedRef.current) {
          testDonation();
        }
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [testMode, enabled]);

  // Real StreamElements connection
  useEffect(() => {
    if (!enabled || testMode) return;
    if (!jwtToken || !channelId) {
      setConnectionError("Missing JWT token or Channel ID");
      return;
    }

    console.log("🔌 Connecting to StreamElements...");

    const socket = io("https://realtime.streamelements.com", {
      transports: ["websocket", "polling"],
      timeout: 15000,
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      if (!mountedRef.current) return;
      console.log("✅ Connected to StreamElements");
      setIsConnected(true);
      setConnectionError(null);
      onConnect?.();

      // Authenticate
      socket.emit("authenticate", {
        method: "jwt",
        token: jwtToken,
      });
    });

    socket.on("authenticated", (data: any) => {
      if (!mountedRef.current) return;
      console.log("🎉 StreamElements authenticated:", data);
      socket.emit("join", channelId);
    });

    socket.on("unauthorized", (error: any) => {
      if (!mountedRef.current) return;
      console.error("❌ StreamElements authentication failed:", error);
      setConnectionError("Authentication failed");
      setIsConnected(false);
    });

    socket.on("disconnect", (reason: string) => {
      if (!mountedRef.current) return;
      console.log("💔 StreamElements disconnected:", reason);
      setIsConnected(false);
      onDisconnect?.();
    });

    socket.on("event", (eventData: StreamElementsEvent) => {
      if (!mountedRef.current) return;
      console.log("📡 StreamElements event received:", eventData);

      if (eventData.type === "tip" || eventData.type === "donation") {
        const donation: Donation = {
          id: `se-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          amount: Number(eventData.data.amount) || 0,
          donor:
            eventData.data.displayName ||
            eventData.data.username ||
            "Anonymous",
          message: eventData.data.message || "",
          timestamp: new Date(),
        };

        console.log("💰 Processing donation:", donation);
        onDonation?.(donation);
      }
    });

    socket.on("connect_error", (error: any) => {
      if (!mountedRef.current) return;
      console.error("🚨 StreamElements connection error:", error);
      setConnectionError(`Connection failed: ${error.message}`);
      setIsConnected(false);
    });

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up StreamElements connection");
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, testMode, jwtToken, channelId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    isConnected,
    connectionError,
    testDonation,
  };
};
