'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useToast } from '../../providers/ToastProvider';
import { uploadAttachment } from '../../services/api';
import { ChatMessage, Participant } from '../../types';
import { Button } from '../ui/Button';
import {
  Send, Paperclip, Smile, X, Search, Reply, Edit3, Trash2,
  FileText, Download, CheckCircle2, Users, CornerDownRight, Plus, Eye
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface ChatWindowProps {
  meetingCode: string;
  username: string;
  socket: Socket | null;
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '👏', '🔥', '🎉', '💡'];

export default function ChatWindow({
  meetingCode,
  username,
  socket,
  isOpen,
  onClose,
  participants,
}: ChatWindowProps) {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [uploading, setUploading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Socket events for Chat Room
  useEffect(() => {
    if (!socket) return;

    // Join the chat room
    socket.emit('join-chat', { meetingCode, username });

    socket.on('chat-history', (history: ChatMessage[]) => {
      setMessages(history);
      // Send read receipt for all history messages
      history.forEach((msg) => {
        if (msg._id && !msg.readers?.includes(username)) {
          socket.emit('read-receipt', { messageId: msg._id, username, meetingCode });
        }
      });
    });

    socket.on('receive-message', (message: ChatMessage) => {
      setMessages((prev) => {
        // Avoid duplicate message renders
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });

      // Send read receipt if chat is currently open
      if (isOpen && message._id) {
        socket.emit('read-receipt', { messageId: message._id, username, meetingCode });
      }
    });

    socket.on('typing', ({ username: typer }) => {
      if (typer !== username) {
        setTypingUsers((prev) => (prev.includes(typer) ? prev : [...prev, typer]));
      }
    });

    socket.on('stop-typing', ({ username: typer }) => {
      setTypingUsers((prev) => prev.filter((u) => u !== typer));
    });

    socket.on('message-edited', ({ messageId, content }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, content, isEdited: true } : m))
      );
    });

    socket.on('message-deleted', ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, content: 'This message was deleted', isDeleted: true } : m))
      );
    });

    socket.on('message-reaction', ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    });

    socket.on('read-receipt', ({ messageId, readers }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, readers } : m))
      );
    });

    return () => {
      socket.off('chat-history');
      socket.off('receive-message');
      socket.off('typing');
      socket.off('stop-typing');
      socket.off('message-edited');
      socket.off('message-deleted');
      socket.off('message-reaction');
      socket.off('read-receipt');
    };
  }, [socket, meetingCode, username, isOpen]);

  // Auto-scroll chat to latest messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typingUsers]);

  // Handle typing indicators
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (!socket) return;

    socket.emit('typing', { meetingCode, username });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { meetingCode, username });
    }, 2000);
  };

  // Submit Chat Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !socket) return;

    if (editingMessage) {
      // Edit mode
      socket.emit('message-edited', {
        messageId: editingMessage._id,
        newContent: inputValue.trim(),
        meetingCode,
      });
      setEditingMessage(null);
    } else {
      // Normal send
      socket.emit('send-message', {
        meetingCode,
        sender: username,
        content: inputValue.trim(),
        replyTo: replyingTo ? replyingTo._id : null,
      });
      setReplyingTo(null);
    }

    setInputValue('');
    socket.emit('stop-typing', { meetingCode, username });
  };

  // Handle file uploads
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socket) return;

    // Check size limit: 20MB
    if (file.size > 20 * 1024 * 1024) {
      showToast('File size must be less than 20MB', 'warning', 'Limit Exceeded');
      return;
    }

    setUploading(true);
    try {
      const data = await uploadAttachment(file);
      socket.emit('send-message', {
        meetingCode,
        sender: username,
        content: `Sent an attachment: ${file.name}`,
        type: data.type,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        replyTo: replyingTo ? replyingTo._id : null,
      });
      setReplyingTo(null);
      showToast('File uploaded successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to upload file attachment', 'error');
    } finally {
      setUploading(false);
    }
  };

  const toggleReaction = (messageId: string, emoji: string) => {
    if (!socket) return;
    socket.emit('message-reaction', { messageId, username, emoji, meetingCode });
  };

  const deleteMessage = (messageId: string) => {
    if (!socket) return;
    socket.emit('message-deleted', { messageId, meetingCode });
  };

  const startEditMessage = (msg: ChatMessage) => {
    setEditingMessage(msg);
    setInputValue(msg.content);
  };

  // Message drag and drop upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        const event = new Event('change', { bubbles: true });
        input.dispatchEvent(event);
      }
    }
  };

  // Filter messages by search query
  const filteredMessages = messages.filter((m) =>
    m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.sender.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        'w-85 bg-[#0b0f19] border-l border-white/10 flex flex-col justify-between h-[100vh] relative z-20 transition-all duration-300 shadow-2xl',
        isOpen ? 'translate-x-0' : 'translate-x-full hidden'
      )}
    >
      {/* Chat Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-950/45 sticky top-0 backdrop-blur-md z-15">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-white">Meeting Chat</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMembers(!showMembers)}
              className="p-1 h-6 w-6 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg border border-white/5"
            >
              <Users className="w-3.5 h-3.5" />
            </Button>
          </div>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{messages.length} Messages logged</span>
        </div>
        <div className="flex gap-1.5 items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
            className="p-1 h-7 w-7 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg"
          >
            <Search className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 h-7 w-7 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Members panel */}
      {showMembers && (
        <div className="bg-slate-950/50 border-b border-white/5 p-3.5 max-h-40 overflow-y-auto">
          <div className="text-[9px] uppercase font-bold text-gray-500 tracking-wider mb-2.5">
            Active in Call ({participants.length})
          </div>
          <div className="flex flex-col gap-2">
            {participants.map((p) => (
              <div key={p.socketId} className="flex items-center gap-2 text-xs text-gray-300">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="truncate font-semibold">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Header Bar */}
      {showSearch && (
        <div className="bg-slate-950/80 border-b border-white/5 p-2 flex items-center gap-2">
          <input
            type="text"
            placeholder="Search matching content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white/5 text-xs border border-white/10 rounded-lg px-2.5 py-1.5 flex-1 text-white focus:outline-none placeholder:text-gray-500"
          />
          <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setShowSearch(false); }} className="p-1 h-6 w-6 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Messages Display log */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 bg-slate-950/20">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((msg) => {
            const isMe = msg.sender === username;
            return (
              <div
                key={msg._id}
                className={cn(
                  'flex gap-2.5 max-w-[90%] break-all group relative transition-all',
                  isMe ? 'self-end flex-row-reverse' : 'self-start'
                )}
              >
                {/* Visual Avatar */}
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white text-xs shadow flex-shrink-0">
                  {msg.sender.charAt(0)}
                </div>

                {/* Message Bubble wrapper */}
                <div className="flex flex-col gap-1 min-w-0">
                  {/* Reply display reference block */}
                  {msg.replyTo && (
                    <div className="flex items-center gap-1 text-[9px] text-gray-500 border-l border-white/20 pl-2 mb-0.5 italic">
                      <CornerDownRight className="w-3 h-3 text-accent" />
                      <span>{msg.replyTo.sender}: "{msg.replyTo.content.substring(0, 15)}..."</span>
                    </div>
                  )}

                  <div className="flex items-baseline gap-2 justify-between">
                    <span className="text-[10px] font-extrabold text-accent">{msg.sender}</span>
                    <span className="text-[8px] text-gray-500">
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>

                  <div className={cn(
                    'p-3 rounded-2xl border text-xs leading-normal font-medium shadow-inner mt-0.5',
                    isMe
                      ? 'bg-primary/10 border-primary/20 rounded-tr-none text-white'
                      : 'bg-white/5 border-white/5 rounded-tl-none text-gray-200'
                  )}>
                    {msg.isDeleted ? (
                      <p className="text-xs text-gray-550 italic leading-normal">{msg.content}</p>
                    ) : msg.type === 'image' && msg.fileUrl ? (
                      <div className="flex flex-col gap-1.5">
                        <img
                          src={msg.fileUrl}
                          alt={msg.fileName}
                          className="rounded-lg max-w-full h-auto border border-white/10 hover:opacity-90 transition-opacity cursor-pointer shadow-md"
                          onClick={() => window.open(msg.fileUrl, '_blank')}
                        />
                        <a
                          href={msg.fileUrl}
                          download={msg.fileName}
                          className="text-[9px] text-accent flex items-center gap-1 hover:underline font-bold mt-1"
                        >
                          <Download className="w-3 h-3" /> Download Preview Image
                        </a>
                      </div>
                    ) : msg.type === 'file' && msg.fileUrl ? (
                      <div className="flex items-center justify-between gap-3 p-2 border border-white/10 bg-slate-950/60 rounded-xl min-w-0">
                        <FileText className="w-5 h-5 text-gray-450 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-bold block truncate leading-none text-white">{msg.fileName}</span>
                          <span className="text-[9px] text-gray-550 leading-none mt-1 block">
                            {msg.fileSize ? `${Math.round(msg.fileSize / 1024)} KB` : ''}
                          </span>
                        </div>
                        <a
                          href={msg.fileUrl}
                          download={msg.fileName}
                          className="p-1 text-gray-400 hover:text-white"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs leading-normal">{msg.content}</p>
                    )}

                    {/* Reactions list */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(
                          msg.reactions.reduce((acc, curr) => {
                            acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            onClick={() => toggleReaction(msg._id!, emoji)}
                            className="bg-white/5 border border-white/10 hover:bg-white/10 px-1.5 py-0.5 rounded-lg text-[9px] font-bold flex items-center gap-1"
                          >
                            <span>{emoji}</span>
                            <span>{count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Message Status flags: Edited/Seen receipts */}
                  <div className="flex justify-between items-center gap-2 mt-1">
                    <div className="flex flex-wrap gap-1">
                      {msg.isEdited && <span className="text-[8px] text-gray-500 italic">edited</span>}
                    </div>
                    {/* Read Receipt seen flags */}
                    {isMe && msg.readers && msg.readers.length > 1 && (
                      <span className="text-[8px] text-gray-500 font-semibold flex items-center gap-0.5" title={`Seen by: ${msg.readers.filter(r => r !== username).join(', ')}`}>
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" /> Seen
                      </span>
                    )}
                  </div>
                </div>

                {/* Bubble Hover Action toolbar overlay */}
                {!msg.isDeleted && msg._id && (
                  <div className={cn(
                    "absolute top-[-14px] bg-[#0b0f19] border border-white/10 rounded-lg py-0.5 px-1.5 hidden group-hover:flex items-center gap-1.5 shadow-lg z-10",
                    isMe ? "left-2" : "right-2"
                  )}>
                    <button
                      onClick={() => setReplyingTo(msg)}
                      className="p-1 text-gray-400 hover:text-white"
                      title="Reply"
                    >
                      <Reply className="w-3 h-3" />
                    </button>
                    {isMe && (
                      <>
                        <button
                          onClick={() => startEditMessage(msg)}
                          className="p-1 text-gray-400 hover:text-white"
                          title="Edit"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteMessage(msg._id!)}
                          className="p-1 text-gray-400 hover:text-rose-450"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                    {/* Emoji Reaction quick select */}
                    <div className="border-l border-white/10 pl-1.5 flex gap-1">
                      {EMOJIS.slice(0, 3).map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => toggleReaction(msg._id!, emoji)}
                          className="hover:scale-125 transition-transform text-[11px]"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2.5 opacity-50 py-10">
            <Users className="w-8 h-8 text-gray-600" />
            <span className="text-[11px] text-gray-400">No messages in room yet. Drag & drop files here to upload.</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Typing Users notification row */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-1 text-[10px] text-gray-500 italic bg-slate-950/60 border-t border-white/5">
          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {/* Reply details Bar */}
      {replyingTo && (
        <div className="px-4 py-2 bg-slate-950 border-t border-white/10 flex items-center justify-between">
          <div className="text-[10px] text-gray-400 truncate">
            Replying to <span className="font-bold text-accent">{replyingTo.sender}</span>: "{replyingTo.content}"
          </div>
          <button onClick={() => setReplyingTo(null)} className="p-0.5 hover:bg-white/5 rounded text-gray-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editing details Bar */}
      {editingMessage && (
        <div className="px-4 py-2 bg-slate-950 border-t border-white/10 flex items-center justify-between">
          <div className="text-[10px] text-gray-400">
            Editing message...
          </div>
          <button
            onClick={() => { setEditingMessage(null); setInputValue(''); }}
            className="p-0.5 hover:bg-white/5 rounded text-gray-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Emoji picker grid drawer */}
      {showEmojiPicker && (
        <div className="bg-slate-950 border-t border-white/10 p-2.5 grid grid-cols-8 gap-1.5 z-15 absolute bottom-16 left-0 w-full shadow-2xl">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setInputValue((prev) => prev + emoji);
                setShowEmojiPicker(false);
              }}
              className="text-lg hover:bg-white/5 p-1 rounded-xl transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Send Input Bar section */}
      <form onSubmit={handleSendMessage} className="p-3.5 border-t border-white/10 bg-slate-950 flex flex-col gap-2 relative z-10">
        <div className="flex gap-2 items-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.docx,.xlsx,.pptx,.zip"
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 h-9 w-9 bg-slate-900 border border-white/15 rounded-xl hover:bg-slate-800 flex items-center justify-center text-gray-450 hover:text-white transition-colors"
            title="Attach File"
          >
            <Paperclip className="w-4.5 h-4.5" />
          </button>

          <input
            type="text"
            placeholder={editingMessage ? "Update message..." : "Type message..."}
            value={inputValue}
            onChange={handleInputChange}
            className="bg-slate-900 border border-white/10 rounded-xl px-3.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary w-full text-white py-2.5 placeholder:text-gray-500"
          />

          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2.5 h-9 w-9 bg-slate-900 border border-white/15 rounded-xl hover:bg-slate-800 flex items-center justify-center text-gray-455 hover:text-white transition-colors"
            title="Emojis"
          >
            <Smile className="w-4.5 h-4.5" />
          </button>

          <button
            type="submit"
            disabled={!inputValue.trim() || uploading}
            className="p-2.5 h-9 w-9 bg-primary disabled:opacity-40 rounded-xl flex items-center justify-center text-white hover:bg-primary/95 transition-all flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        {uploading && (
          <div className="text-[10px] text-accent flex items-center gap-1.5 animate-pulse mt-1.5 font-bold uppercase tracking-wider">
            <span className="w-2.5 h-2.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            Uploading attachment...
          </div>
        )}
      </form>
    </div>
  );
}
