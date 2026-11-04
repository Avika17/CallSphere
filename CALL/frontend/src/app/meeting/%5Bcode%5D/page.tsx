'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../providers/AuthProvider';
import { useToast } from '../../../providers/ToastProvider';
import { io, Socket } from 'socket.io-client';
import { Button } from '../../../components/ui/Button';
import {
  Mic, MicOff, Video, VideoOff, ScreenShare, PhoneOff,
  Send, Users, MessageSquare, Copy, Shield, X, AlertCircle, Sparkles
} from 'lucide-react';
import { ChatMessage, Participant } from '../../../types';
import { cn } from '../../../lib/utils';

export default function MeetingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const meetingCode = (params.code as string).toLowerCase();

  const { user, token, addMeetingToHistory } = useAuth();
  const { showToast } = useToast();

  // Waiting Room / Pre-join States
  const [inWaitingRoom, setInWaitingRoom] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  // Active Meeting States
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Refs for WebRTC & Socket
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<{ [socketId: string]: RTCPeerConnection }>({});
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Prefill user details from Auth Context
  useEffect(() => {
    if (user) {
      setDisplayName(user.name);
    } else {
      setDisplayName(`Guest_${Math.floor(Math.random() * 9000 + 1000)}`);
    }
  }, [user]);

  // Request initial media stream for Waiting Room preview
  useEffect(() => {
    if (!inWaitingRoom) return;

    let activeStream: MediaStream | null = null;

    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        activeStream = stream;
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('Camera/mic blocked or unavailable:', err);
        showToast('Camera/Microphone permission was denied. You can still join using text chat.', 'warning', 'Permissions Warning');
        setVideoEnabled(false);
        setMicEnabled(false);
      }
    };

    getMedia();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [inWaitingRoom, showToast]);

  // Toggle pre-join media settings
  const togglePreJoinVideo = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getVideoTracks()[0];
      if (track) {
        track.enabled = !videoEnabled;
        setVideoEnabled(!videoEnabled);
      }
    } else {
      setVideoEnabled(!videoEnabled);
    }
  };

  const togglePreJoinAudio = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !micEnabled;
        setMicEnabled(!micEnabled);
      }
    } else {
      setMicEnabled(!micEnabled);
    }
  };

  // Connect to room (Join Meeting trigger)
  const handleJoin = async () => {
    if (!displayName.trim()) {
      showToast('Please enter your name', 'warning');
      return;
    }

    setInWaitingRoom(false);

    // Save meeting to activity history if logged in
    if (token) {
      try {
        await addMeetingToHistory(meetingCode);
      } catch (err) {
        console.error('Error logging activity history:', err);
      }
    }

    // Initialize Socket Connection
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000';
    const socket = io(socketUrl, {
      transports: ['websocket'],
      forceNew: true,
    });
    socketRef.current = socket;

    // Fetch existing stream or initialize a new one if user updated media settings in waiting room
    let myStream: MediaStream | null = null;
    try {
      myStream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled,
        audio: micEnabled,
      });
    } catch (err) {
      console.warn('Could not retrieve media tracks for join:', err);
      // Fallback empty stream
      myStream = new MediaStream();
    }
    localStreamRef.current = myStream;

    // Add local participant
    const localPart: Participant = {
      socketId: 'local',
      name: `${displayName} (You)`,
      stream: myStream,
      audioEnabled: micEnabled,
      videoEnabled: videoEnabled,
      isLocal: true,
    };
    setParticipants([localPart]);

    // Connect to Room
    socket.emit('join-call', meetingCode);

    // Set up Socket Listeners
    socket.on('user-joined', async (joinedSocketId: string, roomConnections: string[]) => {
      showToast('Someone joined the meeting', 'info');
      
      // If we are NOT the joining client, we create a WebRTC PeerConnection for the newcomer
      if (joinedSocketId !== socket.id) {
        const pc = createPeerConnection(joinedSocketId, socket, myStream!);
        peersRef.current[joinedSocketId] = pc;

        // Create WebRTC Offer
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('signal', joinedSocketId, JSON.stringify({ sdp: pc.localDescription }));
        } catch (e) {
          console.error('Error creating SDP offer:', e);
        }
      }
    });

    socket.on('signal', async (senderSocketId: string, message: string) => {
      const data = JSON.parse(message);

      // Handle SDP negotiation
      if (data.sdp) {
        let pc = peersRef.current[senderSocketId];

        if (!pc) {
          // If PeerConnection does not exist (meaning we are the newly joined client receiving offer), create it
          pc = createPeerConnection(senderSocketId, socket, myStream!);
          peersRef.current[senderSocketId] = pc;
        }

        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

          if (data.sdp.type === 'offer') {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('signal', senderSocketId, JSON.stringify({ sdp: pc.localDescription }));
          }
        } catch (e) {
          console.error('Error setting remote SDP description:', e);
        }
      }

      // Handle ICE Candidates
      if (data.candidate) {
        const pc = peersRef.current[senderSocketId];
        if (pc) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (e) {
            console.error('Error adding ICE candidate:', e);
          }
        }
      }
    });

    socket.on('chat-message', (data: string, sender: string, senderSocketId: string) => {
      const newMessage: ChatMessage = {
        sender,
        data,
        'socket-id-sender': senderSocketId,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, newMessage]);
    });

    socket.on('user-left', (leftSocketId: string) => {
      showToast('Participant left the room', 'info');

      // Close Peer Connection
      if (peersRef.current[leftSocketId]) {
        peersRef.current[leftSocketId].close();
        delete peersRef.current[leftSocketId];
      }

      // Remove from state
      setParticipants((prev) => prev.filter((p) => p.socketId !== leftSocketId));
    });
  };

  // Helper: Create RTCPeerConnection
  const createPeerConnection = (
    targetSocketId: string,
    socket: Socket,
    stream: MediaStream
  ): RTCPeerConnection => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
    });

    // Add local tracks
    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    // Send ICE candidates to peer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('signal', targetSocketId, JSON.stringify({ candidate: event.candidate }));
      }
    };

    // Receive incoming stream from remote peer
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setParticipants((prev) => {
        // Avoid duplicating participant
        const exists = prev.some((p) => p.socketId === targetSocketId);
        if (exists) {
          return prev.map((p) =>
            p.socketId === targetSocketId ? { ...p, stream: remoteStream } : p
          );
        }
        return [
          ...prev,
          {
            socketId: targetSocketId,
            name: `Participant`, // Sockets don't store names, so we set a default
            stream: remoteStream,
            audioEnabled: true,
            videoEnabled: true,
            isLocal: false,
          },
        ];
      });
    };

    return pc;
  };

  // Toggle active microphone
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !micEnabled;
        setMicEnabled(!micEnabled);
        setParticipants((prev) =>
          prev.map((p) => (p.isLocal ? { ...p, audioEnabled: !micEnabled } : p))
        );
      }
    }
  };

  // Toggle active camera
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getVideoTracks()[0];
      if (track) {
        track.enabled = !videoEnabled;
        setVideoEnabled(!videoEnabled);
        setParticipants((prev) =>
          prev.map((p) => (p.isLocal ? { ...p, videoEnabled: !videoEnabled } : p))
        );
      }
    }
  };

  // Handle Screen Sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop Screen Share
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }

      // Revert to Webcam
      try {
        const webcamStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: micEnabled,
        });
        localStreamRef.current = webcamStream;

        // Replace track on all Peer Connections
        const videoTrack = webcamStream.getVideoTracks()[0];
        Object.values(peersRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        });

        // Update local state
        setParticipants((prev) =>
          prev.map((p) => (p.isLocal ? { ...p, stream: webcamStream, videoEnabled: true } : p))
        );
        setVideoEnabled(true);
        setIsScreenSharing(false);
      } catch (err) {
        console.error('Failed to restore webcam stream:', err);
      }
    } else {
      // Start Screen Share
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];

        // Listen for user clicking "Stop Sharing" on browser banner
        screenTrack.onended = () => {
          toggleScreenShare();
        };

        // Replace track on all Peer Connections
        Object.values(peersRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender && screenTrack) {
            sender.replaceTrack(screenTrack);
          }
        });

        // Update local state
        setParticipants((prev) =>
          prev.map((p) => (p.isLocal ? { ...p, stream: screenStream, videoEnabled: true } : p))
        );
        setVideoEnabled(true);
        setIsScreenSharing(true);
        showToast('Screen sharing active', 'success');
      } catch (err) {
        console.error('Screen sharing denied:', err);
      }
    }
  };

  // Leave Meeting
  const handleLeave = () => {
    // Stop local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Close all Peer Connections
    Object.values(peersRef.current).forEach((pc) => pc.close());
    peersRef.current = {};

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    showToast('You left the meeting', 'info');
    router.push('/dashboard');
  };

  // Send Chat message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current) return;

    socketRef.current.emit('chat-message', chatInput.trim(), displayName);
    setChatInput('');
  };

  // Scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/meeting/${meetingCode}`;
    navigator.clipboard.writeText(inviteLink);
    showToast('Invite link copied!', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden">
      {/* Dynamic glow in meeting room */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full bg-blue-950/25 blur-[120px] pointer-events-none" />

      {inWaitingRoom ? (
        /* Waiting Room Layout */
        <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
          <div className="w-full max-w-2xl bg-slate-900/60 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row gap-8 items-center">
            {/* Left Column: Cam Preview */}
            <div className="flex-1 flex flex-col gap-4 w-full">
              <div className="w-full aspect-[4/3] rounded-2xl bg-black border border-white/5 relative overflow-hidden flex items-center justify-center shadow-inner">
                {videoEnabled ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-gray-500">
                      <VideoOff className="w-8 h-8" />
                    </div>
                    <span className="text-xs text-gray-400">Camera preview turned off</span>
                  </div>
                )}

                {/* Pre-join settings overlay */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 px-4 py-2 rounded-2xl backdrop-blur">
                  <button
                    onClick={togglePreJoinAudio}
                    className={`p-2 rounded-lg transition-colors ${
                      micEnabled ? 'text-white hover:bg-white/10' : 'text-red-500 hover:bg-red-500/10'
                    }`}
                  >
                    {micEnabled ? <Mic className="w-4.5 h-4.5" /> : <MicOff className="w-4.5 h-4.5" />}
                  </button>
                  <button
                    onClick={togglePreJoinVideo}
                    className={`p-2 rounded-lg transition-colors ${
                      videoEnabled ? 'text-white hover:bg-white/10' : 'text-red-500 hover:bg-red-500/10'
                    }`}
                  >
                    {videoEnabled ? <Video className="w-4.5 h-4.5" /> : <VideoOff className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Name Check and Join details */}
            <div className="flex-1 flex flex-col gap-6 w-full">
              <div>
                <div className="inline-flex items-center gap-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase px-2.5 py-1 rounded-md mb-2">
                  <Sparkles className="w-3 h-3" /> Waiting Room
                </div>
                <h2 className="text-2xl font-black leading-none">Ready to join?</h2>
                <p className="text-xs text-gray-400 mt-2">Room: <span className="font-semibold text-gray-200">{meetingCode}</span></p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-300">Your Display Name</label>
                <input
                  type="text"
                  placeholder="Enter name..."
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-11 bg-slate-800/80 border border-white/10 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full text-white"
                />
              </div>

              <div className="flex flex-col gap-3">
                <Button onClick={handleJoin} className="w-full h-11 font-bold">
                  Join Meeting
                </Button>
                <Button variant="ghost" onClick={() => router.push('/dashboard')} className="w-full h-10 text-xs text-gray-400 hover:text-white">
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Active Meeting Interface */
        <div className="flex-1 flex relative">
          <div className="flex-1 flex flex-col p-4 gap-4 justify-between h-[100vh]">
            {/* Top Toolbar */}
            <div className="h-14 bg-slate-900/60 border border-white/5 rounded-2xl px-6 flex items-center justify-between backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-sm tracking-wide bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent uppercase">
                  {meetingCode}
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyInviteLink}
                  className="h-9 px-3 text-xs gap-1.5 border border-white/5 bg-white/5 hover:bg-white/10 rounded-xl"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Link
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setChatOpen(!chatOpen)}
                  className={`h-9 w-9 rounded-xl relative ${chatOpen ? 'bg-primary text-white' : 'border border-white/5 bg-white/5 hover:bg-white/10'}`}
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Video Streams Container Grid */}
            <div className="flex-1 min-h-0 py-2">
              <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr">
                {participants.map((participant) => (
                  <div
                    key={participant.socketId}
                    className="rounded-3xl border border-white/10 bg-slate-900/80 overflow-hidden relative shadow-lg flex items-center justify-center group"
                  >
                    {participant.stream && participant.videoEnabled ? (
                      <VideoPlayer stream={participant.stream} isLocal={participant.isLocal} />
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center font-extrabold text-xl shadow">
                          {participant.name.charAt(0)}
                        </div>
                        <span className="text-xs text-gray-400">{participant.name}</span>
                      </div>
                    )}

                    {/* Participant Details Label */}
                    <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-xl text-xs font-semibold backdrop-blur flex items-center gap-2">
                      <span>{participant.name}</span>
                      {!participant.audioEnabled && <MicOff className="w-3 h-3 text-red-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Call Controls Panel */}
            <div className="h-16 bg-slate-900/80 border border-white/10 rounded-2xl px-6 flex items-center justify-center gap-4 max-w-lg mx-auto w-full backdrop-blur-md">
              {/* Mic Toggle */}
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-xl transition-all ${
                  micEnabled
                    ? 'bg-slate-800 hover:bg-slate-700 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
                }`}
                title={micEnabled ? 'Mute Mic' : 'Unmute Mic'}
              >
                {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              {/* Cam Toggle */}
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-xl transition-all ${
                  videoEnabled
                    ? 'bg-slate-800 hover:bg-slate-700 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
                }`}
                title={videoEnabled ? 'Turn Off Cam' : 'Turn On Cam'}
              >
                {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              {/* Screen Share Toggle */}
              <button
                onClick={toggleScreenShare}
                className={`p-3 rounded-xl transition-all ${
                  isScreenSharing
                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
                title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
              >
                <ScreenShare className="w-5 h-5" />
              </button>

              {/* End/Leave Call Button */}
              <button
                onClick={handleLeave}
                className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-600/30 transition-all ml-4"
                title="End/Leave Meeting"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Integrated Sidebar Chat Panel */}
          {chatOpen && (
            <div className="w-80 bg-slate-900 border-l border-white/10 flex flex-col justify-between h-[100vh] relative z-20">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900/60 sticky top-0 backdrop-blur">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4.5 h-4.5 text-primary" />
                  <h3 className="font-bold text-sm">Meeting Chat</h3>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="p-1 hover:bg-secondary rounded-lg text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Messages Log */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {chatMessages.length > 0 ? (
                  chatMessages.map((msg, index) => (
                    <div key={index} className="flex flex-col gap-1 max-w-[90%] break-all">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold text-primary">{msg.sender}</span>
                        {msg.timestamp && (
                          <span className="text-[8px] text-gray-500">{msg.timestamp}</span>
                        )}
                      </div>
                      <p className="bg-slate-800 border border-white/5 p-2.5 rounded-2xl rounded-tl-none text-xs leading-normal">
                        {msg.data}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 opacity-50 py-10">
                    <MessageSquare className="w-8 h-8 text-gray-600" />
                    <span className="text-[11px] text-gray-400">No messages in room yet</span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Send Chat input block */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-slate-950 flex gap-2">
                <input
                  type="text"
                  placeholder="Send a chat..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="bg-slate-800/80 border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary w-full text-white py-2"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-2 h-9 w-9 bg-primary disabled:opacity-40 rounded-xl flex items-center justify-center text-white hover:bg-primary/95 transition-all flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Subcomponent: Video Player helper
function VideoPlayer({ stream, isLocal }: { stream: MediaStream; isLocal: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isLocal} // Mute local preview audio to prevent feedback loop
      className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
    />
  );
}
