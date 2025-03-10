/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import sdb from '@/db/surrealdb';
import { FormEvent, useEffect, useState } from 'react';

// UI Components
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import EmojiPicker from '@/components/ui/emoji';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string; // Expected as a datetime string
}

interface Requirement {
  chatId: string;
  adminId: string;
  adminsList: {
    id: string;
    imageUrl: string;
    firstName: string;
    lastName: string;
    emailAddresses: string[];
  }[];
}

export function ChatView({ chatId, adminId, adminsList }: Requirement) {
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
        );
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
            setMessages((prev) => prev.map((msg) => (msg.id === result.id ? result : msg)));
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
      // Create a new message in the Message table
      await dbClient.create('Message', {
        chat_id: chatId,
        sender_id: adminId,
        content: inputValue,
        created_at: new Date(),
      });

      // Update chat status from pending to active
      // Added admin_id condition to change the status of the current admin's chat only
      await dbClient.query(
        `UPDATE Chat SET status = 'active', admin_id = '${adminId}' WHERE id = ${chatId} AND status = 'pending'`
      );
      setInputValue('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Function to handle selected emoji
  const handleEmojiSelect = (emoji: string) => {
    setInputValue((prev) => prev + emoji);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e as any); // cast برای رفع مشکل تایپ
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
                  messages.map((message) => {
                    // Check if the sender ID is in the admin list
                    const isAdmin = adminsList.some((admin) => admin.id === message.sender_id);
                    // If exists, get the corresponding admin details
                    const adminDetails = adminsList.find((admin) => admin.id === message.sender_id);
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`flex items-start max-w-[70%] ${
                            isAdmin ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage
                              src={
                                isAdmin
                                  ? adminDetails?.imageUrl || '/admin-avatar.png'
                                  : '/user-avatar.png'
                              }
                            />
                            <AvatarFallback>
                              {isAdmin
                                ? adminDetails
                                  ? adminDetails.firstName.charAt(0)
                                  : 'A'
                                : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`mx-2 ${isAdmin ? 'text-right' : 'text-left'}`}>
                            <div
                              className={`rounded-lg p-2 ${
                                isAdmin ? 'bg-primary text-primary-foreground' : 'bg-muted'
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
                    );
                  })
                ) : (
                  <p className="text-center text-sm text-muted-foreground">No messages yet!</p>
                )}
              </div>
            </ScrollArea>

            {/* Message input area with emoji – Emoji component without removing previous code */}
            <div className="p-4 border-t relative">
              <form onSubmit={sendMessage} className="flex items-center space-x-2">
                <EmojiPicker onSelect={handleEmojiSelect} />
                <Textarea
                  placeholder="Type your message here..."
                  className="flex-grow"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
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
