'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FC } from 'react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

// List of emojis without categorization and filtering
const emojis: string[] = ['😀', '😃', '😄', '🐶', '🐱', '🐭', '🍎', '🍔', '🍕'];

const EmojiPicker: FC<EmojiPickerProps> = ({ onSelect }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <SmileIcon className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] max-h-[500px] p-4 overflow-y-auto">
        <div className="grid grid-cols-6 gap-2">
          {emojis.map((emoji, index) => (
            <Button key={index} variant="ghost" size="icon" onClick={() => onSelect(emoji)}>
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPicker;

function SmileIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" x2="9.01" y1="9" y2="9" />
      <line x1="15" x2="15.01" y1="9" y2="9" />
    </svg>
  );
}
