'use client';

import * as React from 'react';
import { ChatView } from './ChatView';

// اگر نیاز است شناسه‌ی چت (chatId) یا اطلاعات دیگر به ChatView بدهید، می‌توانید آن را به‌صورت props ارسال کنید.
// اینجا صرفاً نشان می‌دهیم که AdminChatRoom یک کانتینر است که ChatView را رندر می‌کند و بس.
interface AdminChatRoomProps {
  chatId?: string;
}

export function AdminChatRoom({ chatId }: AdminChatRoomProps) {
  return (
    <div className="flex flex-col h-full">
      {/* در این قسمت دیگر هیچ Textarea یا فرم ارسال نخواهیم داشت */}
      <div className="flex-grow flex flex-col overflow-hidden">
        {/* چت واقعی داخل ChatView است */}
        <ChatView /* chatId={chatId} (درصورت نیاز) */ />
      </div>
    </div>
  );
}
