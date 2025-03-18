import * as React from 'react';
import { cn } from '@/lib/utils';
import { Textarea } from './textarea';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { Smile, Search } from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys & Emotion',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙']
  },
  {
    name: 'People & Body',
    emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '👍', '👎']
  },
  {
    name: 'Animals & Nature',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤']
  },
  {
    name: 'Food & Drink',
    emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦']
  },
  {
    name: 'Travel & Places',
    emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🏍️', '🛺', '🚲', '🛴', '🚨']
  },
  {
    name: 'Activities',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳']
  },
  {
    name: 'Objects',
    emojis: ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥']
  },
  {
    name: 'Symbols',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️']
  }
];

export interface RichTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

export function RichTextarea({
  className,
  value,
  onChange,
  maxLength,
  ...props
}: RichTextareaProps) {
  const [charCount, setCharCount] = React.useState(0);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState<string>(EMOJI_CATEGORIES[0].name);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    setCharCount(value.length);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (maxLength && newValue.length > maxLength) return;
    onChange(newValue);
    setCharCount(newValue.length);
  };

  const insertEmoji = (emoji: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newValue = value.substring(0, start) + emoji + value.substring(end);
    onChange(newValue);
    
    // Set cursor position after the inserted emoji
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  // Filter emojis based on search term
  const filteredEmojis = searchTerm 
    ? EMOJI_CATEGORIES.flatMap(category => 
        category.emojis.filter(emoji => 
          emoji.includes(searchTerm) || category.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).map(emoji => ({ emoji, category: category.name }))
      )
    : [];

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 rounded-full"
              type="button"
            >
              <Smile className="h-4 w-4" />
              <span className="sr-only">Insert emoji</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="start">
            <div className="flex flex-col h-[400px]">
              {/* Search bar */}
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search emojis..."
                    className="w-full pl-8 pr-2 py-2 text-sm rounded-md border border-input bg-background"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {searchTerm ? (
                /* Search results */
                <div className="p-2 overflow-y-auto flex-1">
                  {filteredEmojis.length > 0 ? (
                    <div className="grid grid-cols-8 gap-1">
                      {filteredEmojis.map(({ emoji, category }, index) => (
                        <button
                          key={`${emoji}-${index}`}
                          type="button"
                          className="text-xl hover:bg-muted rounded cursor-pointer p-2 transition-colors"
                          onClick={() => insertEmoji(emoji)}
                          title={`${emoji} (${category})`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No emojis found</p>
                  )}
                </div>
              ) : (
                /* Category tabs and emoji grid */
                <div className="flex flex-1 overflow-hidden">
                  {/* Category tabs */}
                  <div className="w-1/4 border-r overflow-y-auto">
                    {EMOJI_CATEGORIES.map((category) => (
                      <button
                        key={category.name}
                        type="button"
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm transition-colors",
                          activeCategory === category.name 
                            ? "bg-muted font-medium" 
                            : "hover:bg-muted/50"
                        )}
                        onClick={() => setActiveCategory(category.name)}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                  
                  {/* Emoji grid */}
                  <div className="w-3/4 p-2 overflow-y-auto">
                    <div className="grid grid-cols-6 gap-1">
                      {EMOJI_CATEGORIES.find(c => c.name === activeCategory)?.emojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className="text-xl hover:bg-muted rounded cursor-pointer p-2 transition-colors"
                          onClick={() => insertEmoji(emoji)}
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Recently used emojis - could be implemented with local storage */}
              <div className="p-2 border-t">
                <p className="text-xs font-medium mb-1">Recently Used</p>
                <div className="flex space-x-1 overflow-x-auto pb-1">
                  {['😊', '👍', '🔥', '❤️', '✨', '🎉', '👏', '🙏'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="text-xl hover:bg-muted rounded cursor-pointer p-1"
                      onClick={() => insertEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        {maxLength && (
          <span className={cn(
            "text-xs text-muted-foreground",
            charCount > (maxLength * 0.9) && "text-amber-500",
            charCount >= maxLength && "text-red-500"
          )}>
            {charCount}/{maxLength}
          </span>
        )}
      </div>
      
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        className={cn(
          "min-h-[120px] resize-y",
          className
        )}
        {...props}
      />
    </div>
  );
}
