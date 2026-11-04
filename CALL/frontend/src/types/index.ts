export interface User {
  _id?: string;
  name: string;
  username: string;
  password?: string;
  token?: string;
}

export interface Meeting {
  _id: string;
  user_id: string;
  meetingCode: string;
  date: string;
}

export interface ChatMessage {
  _id?: string;
  meetingCode?: string;
  sender: string;
  senderSocketId?: string;
  content: string;
  type?: 'text' | 'image' | 'file';
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  replyTo?: ChatMessage | null;
  reactions?: Array<{ username: string; emoji: string }>;
  isEdited?: boolean;
  isDeleted?: boolean;
  readers?: string[];
  timestamp?: string | Date;
}

export interface Participant {
  socketId: string;
  name: string;
  stream: MediaStream | null;
  audioEnabled: boolean;
  videoEnabled: boolean;
  isLocal: boolean;
}
