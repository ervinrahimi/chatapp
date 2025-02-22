"use client";

import React, { useState, useEffect, FormEvent } from "react";
import sdb from "@/db/surrealdb"; 

interface Message {
  id?: string;
  sender?: string;
  content?: string;
  created_at?: string;
}

// --- Chat Component ---
function Chat() {
  const [isAuthDone, setIsAuthDone] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [senderName, setSenderName] = useState("UserA");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dbClient, setDbClient] = useState<any>(null); // Store SurrealDB connection

  useEffect(() => {
    // Connect to SurrealDB and perform Auth
    const connectToDB = async () => {
      try {
        const db = await sdb(); // Use sdb function to connect
        setDbClient(db);
        setIsAuthDone(true);
      } catch (err) {
        console.error("Error connecting to SurrealDB:", err);
      }
    };

    connectToDB();
  }, []);

  useEffect(() => {
    if (!isAuthDone || !dbClient) return;

    let queryId: string | null = null;

    async function setupLiveQuery() {
      try {
        // Initial messages
        const res = await dbClient.query(
          "SELECT * FROM messages ORDER BY created_at ASC"
        );
        const initialMessages = res?.[0] || [];
        setMessages(initialMessages);

        // Create Live Query
        queryId = await dbClient.live("messages");

        // Subscribe to Live Query
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dbClient.subscribeLive(queryId, (action: string, result: any) => {
          if (action === "CLOSE") return;
          console.log("Live Action:", action, "Result:", result);

          if (action === "CREATE") {
            setMessages((prev) => [...prev, result]);
          } else if (action === "UPDATE") {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === result.id ? result : msg))
            );
          } else if (action === "DELETE") {
            setMessages((prev) => prev.filter((msg) => msg.id !== result.id));
          }
        });
      } catch (err) {
        console.error("Error setting up live query:", err);
      }
    }

    setupLiveQuery();

    // Cleanup: Close live query on unmount
    return () => {
      if (queryId) {
        dbClient.kill(queryId).catch((err: unknown) => {
          console.error("Error killing live query:", err);
        });
      }
    };
  }, [isAuthDone, dbClient]);

  // Send message function
  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    try {
      await dbClient.create("messages", {
        sender: senderName,
        content: inputValue,
        created_at: new Date().toISOString(),
      });
      setInputValue("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  if (!isAuthDone) return <p>Connecting to SurrealDB...</p>;

  return (
    <div className="chat-container">
      <h2>Simple SurrealDB Chat (Live)</h2>

      <div className="sender-section">
        <label>Sender Name: </label>
        <input
          type="text"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
        />
      </div>

      <div className="chat-box">
        {messages.map((msg) => (
          <div key={msg.id} className="message">
            <strong className="sender">{msg.sender || "Unknown"}:</strong>{" "}
            {msg.content}
            <br />
            <small className="timestamp">{msg.created_at}</small>
            <hr />
          </div>
        ))}
        {messages.length === 0 && <p>No messages yet!</p>}
      </div>

      <form onSubmit={sendMessage} className="chat-form">
        <input
          type="text"
          placeholder="Type message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>

      <style jsx>{`
        .chat-container {
          width: 60%;
          max-width: 800px;
          margin: 40px auto;
          font-family: sans-serif;
        }
        .chat-container h2 {
          text-align: center;
          margin-bottom: 24px;
          color: #333;
        }
        .sender-section {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          align-items: center;
        }
        .chat-box {
          border: 1px solid #ccc;
          height: 500px;
          background: #f9f9f9;
          overflow-y: auto;
          margin-bottom: 20px;
          padding: 16px;
        }
        .message {
          margin-bottom: 12px;
        }
        .sender {
          color: #2f77f4;
        }
        .timestamp {
          color: #999;
          font-size: 0.8rem;
        }
        .chat-form {
          display: flex;
          gap: 10px;
        }
        .chat-form input[type="text"] {
          flex: 1;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .chat-form button {
          padding: 10px 16px;
          cursor: pointer;
          border: none;
          background-color: #2f77f4;
          color: #fff;
          font-weight: bold;
          border-radius: 4px;
        }
        .chat-form button:hover {
          background-color: #1f5cbd;
        }
      `}</style>
    </div>
  );
}

// --- Main Page Output ---
export default function ChatPage() {
  return (
    <div>
      <Chat />
    </div>
  );
}
