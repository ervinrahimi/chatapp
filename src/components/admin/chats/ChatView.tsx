/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import sdb from '@/db/surrealdb';

// UI Components
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Message interface based on the database model
interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string; // Expected as a datetime string
}

// Props interface for ChatView component
interface Requirement {
  chatId: string;
  adminId: string;
}

export function ChatView({ chatId, adminId }: Requirement) {
  // State for database connection and authentication
  const [dbClient, setDbClient] = useState<any>(null);
  const [isAuthDone, setIsAuthDone] = useState(false);

  // State for storing messages
  const [messages, setMessages] = useState<Message[]>([]);
  // State for input text
  const [inputValue, setInputValue] = useState('');

  // Connect to SurrealDB on component mount
  useEffect(() => {
    const connectToDB = async () => {
      try {
        const db = await sdb();
        setDbClient(db);
        setIsAuthDone(true);
      } catch (err) {
        console.error('Error connecting to SurrealDB:', err);
      }
    };
    connectToDB();
  }, []);

  // Setup live query for messages of the specified chatId
  useEffect(() => {
    if (!isAuthDone || !dbClient || !chatId) return;

    let queryId: string | null = null;

    const setupLiveQuery = async () => {
      try {
        // Fetch initial messages for the given chatId
        const res = await dbClient.query(
          `SELECT * FROM Message WHERE chat_id = ${chatId} ORDER BY created_at ASC`
        )
        const initialMessages = res?.[0] || [];
        setMessages(initialMessages);

        // Setup live subscription for messages related to this chat
        queryId = await dbClient.live(`Message`);
        dbClient.subscribeLive(queryId, (action: string, result: any) => {
          if (String(result.chat_id) !== String(chatId)) return;

          if (action === 'CLOSE') return;
          if (action === 'CREATE') {
            setMessages((prev) => [...prev, result]);
          } else if (action === 'UPDATE') {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === result.id ? result : msg))
            );
          } else if (action === 'DELETE') {
            setMessages((prev) => prev.filter((msg) => msg.id !== result.id));
          }
        });
      } catch (err) {
        console.error('Error setting up live query:', err);
      }
    };

    setupLiveQuery();

    // Cleanup live query subscription on component unmount
    return () => {
      if (queryId) {
        dbClient.kill(queryId).catch((err: unknown) => {
          console.error('Error killing live query:', err);
        });
      }
    };
  }, [isAuthDone, dbClient, chatId]);

  // Function to send a new message
  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    try {
      await dbClient.create('Message', {
        chat_id: chatId,       // Use chatId directly (without quotes in QL)
        sender_id: adminId,   // Fixed sender_id set to 'admin'
        content: inputValue,
        created_at: new Date(), // Use Date object directly
      });
      setInputValue('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Render loading state if not connected yet
  if (!isAuthDone) {
    return (
      <div className="p-4 text-center">
        <p>Connecting to SurrealDB...</p>
      </div>
    );
  }

  // Render the admin chat UI
  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow flex flex-col overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader>
            <SheetTitle>Chat with</SheetTitle>
            <SheetDescription>View and respond to messages</SheetDescription>
          </SheetHeader>

          {/* Chat messages list */}
          <div className="flex-grow flex flex-col overflow-hidden">
            <ScrollArea className="flex-grow overflow-auto">
              <div className="space-y-4 p-4">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_id?.slice(0, 5) === adminId?.slice(0, 5) ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`flex items-start max-w-[70%] ${
                          message.sender_id?.slice(0, 5) === adminId?.slice(0, 5) ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage
                            src={message.sender_id?.slice(0, 5) === adminId?.slice(0, 5) ? '/admin-avatar.png' : '/user-avatar.png'}
                          />
                          <AvatarFallback>
                            {message.sender_id?.slice(0, 5) === adminId?.slice(0, 5) ? 'A' : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`mx-2 ${message.sender_id?.slice(0, 5) === adminId?.slice(0, 5) ? 'text-right' : 'text-left'}`}>
                          <div
                            className={`rounded-lg p-2 ${
                              message.sender_id?.slice(0, 5) === adminId?.slice(0, 5)
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            {message.content}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(message.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground">
                    No messages yet!
                  </p>
                )}
              </div>
            </ScrollArea>

            {/* Message input area */}
            <div className="p-4 border-t">
              <form onSubmit={sendMessage} className="flex items-center space-x-2">
                <Textarea
                  placeholder="Type your message here..."
                  className="flex-grow"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <Button size="icon" type="submit">
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send message</span>
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
