/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import sdb from '@/db/surrealdb';

// این‌ها همان کامپوننت‌های UI هستند که در AdminChatRoom استفاده می‌شدند:
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// تعریف اینترفیس پیام
interface Message {
  id: string; // شناسه پیام در دیتابیس
  sender: string; // مثال: "admin" یا "user"
  content: string; // محتوای پیام
  timestamp: string; // نگاشت فیلد created_at از دیتابیس
}

export function ChatView() {
  // State برای اتصال به دیتابیس
  const [dbClient, setDbClient] = useState<any>(null);
  const [isAuthDone, setIsAuthDone] = useState(false);

  // State برای نگهداری لیست پیام‌ها
  const [messages, setMessages] = useState<Message[]>([]);

  // مقدار ورودی تکست
  const [inputValue, setInputValue] = useState('');

  // فرستنده پیام؛ اینجا ثابت "admin" در نظر گرفته شده
  const [sender] = useState('admin');

  // ۱) اتصال به SurrealDB با کمک تابع sdb()
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

  // ۲) راه‌اندازی Live Query برای جدول messages
  useEffect(() => {
    if (!isAuthDone || !dbClient) return;

    let queryId: string | null = null;

    const setupLiveQuery = async () => {
      try {
        // دریافت پیام‌های اولیه
        const res = await dbClient.query('SELECT * FROM messages ORDER BY created_at ASC');
        const initialMessages = res?.[0] || [];

        // تبدیل پیام‌های DB به ساختار داخلی کامپوننت
        setMessages(
          initialMessages.map((m: any) => ({
            id: m.id,
            sender: m.sender ?? 'unknown',
            content: m.content ?? '',
            timestamp: m.created_at ?? new Date().toISOString(),
          }))
        );

        // ساخت Live Query
        queryId = await dbClient.live('messages');

        // subscribe به رویدادهای Live Query: CREATE, UPDATE, DELETE
        dbClient.subscribeLive(queryId, (action: string, result: any) => {
          if (action === 'CLOSE') return;

          if (action === 'CREATE') {
            setMessages((prev) => [
              ...prev,
              {
                id: result.id,
                sender: result.sender ?? 'unknown',
                content: result.content ?? '',
                timestamp: result.created_at ?? new Date().toISOString(),
              },
            ]);
          } else if (action === 'UPDATE') {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === result.id
                  ? {
                      ...msg,
                      sender: result.sender ?? 'unknown',
                      content: result.content ?? '',
                      timestamp: result.created_at ?? msg.timestamp,
                    }
                  : msg
              )
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

    // Cleanup برای بستن لایو کوئری هنگام unmount شدن کامپوننت
    return () => {
      if (queryId) {
        dbClient.kill(queryId).catch((err: unknown) => {
          console.error('Error killing live query:', err);
        });
      }
    };
  }, [isAuthDone, dbClient]);

  // ۳) تابع ارسال پیام
  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    try {
      await dbClient.create('messages', {
        sender,
        content: inputValue,
        created_at: new Date().toISOString(),
      });
      setInputValue('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // اگر هنوز اتصال برقرار نشده
  if (!isAuthDone) {
    return (
      <div className="p-4 text-center">
        <p>Connecting to SurrealDB...</p>
      </div>
    );
  }

  // --- UI برگرفته از AdminChatRoom + منطق Live Query ---
  return (
    <div className="flex flex-col h-full">
      {/* هدر بالای شیت */}
      <SheetHeader>
        <SheetTitle>Chat with</SheetTitle>
        <SheetDescription>View and respond to messages</SheetDescription>
      </SheetHeader>

      {/* بدنه شیت، شامل لیست پیام‌ها */}
      <div className="flex-grow flex flex-col overflow-hidden">
        <ScrollArea className="flex-grow overflow-auto">
          <div className="space-y-4 p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex items-start max-w-[70%] ${
                    message.sender === 'admin' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={message.sender === 'admin' ? '/admin-avatar.png' : '/user-avatar.png'}
                    />
                    <AvatarFallback>{message.sender === 'admin' ? 'A' : 'U'}</AvatarFallback>
                  </Avatar>
                  <div
                    className={`mx-2 ${message.sender === 'admin' ? 'text-right' : 'text-left'}`}
                  >
                    <div
                      className={`rounded-lg p-2 ${
                        message.sender === 'admin'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.content}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(message.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* پیام خالی بودن لیست پیام */}
            {messages.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">No messages yet!</p>
            )}
          </div>
        </ScrollArea>

        {/* بخش ارسال پیام */}
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
  );
}
