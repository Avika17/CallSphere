'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../providers/AuthProvider';
import { useToast } from '../../../providers/ToastProvider';
import { io, Socket } from 'socket.io-client';
import { Button } from '../../../components/ui/Button';
import ChatWindow from '../../../components/chat/ChatWindow';
import {
  Mic, MicOff, Video, VideoOff, ScreenShare, PhoneOff,
  Copy, MessageSquare, Sparkles, AlertCircle, Shield,
  Signal, Users, Hand, Smile, CircleDot
} from 'lucide-react';
import { Participant } from '../../../types';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'excellent' | 'good' | 'poor'>('excellent');

  // Refs for WebRTC & Socket
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<{ [socketId: string]: RTCPeerConnection }>({});
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

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

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/meeting/${meetingCode}`;
    navigator.clipboard.writeText(inviteLink);
    showToast('Invite link copied!', 'success');
  };

  return (
    <div className="min-h-screen bg-[#030611] text-white flex flex-col relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-[45%] h-[45%] rounded-full bg-blue-950/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[35%] h-[35%] rounded-full bg-indigo-950/15 blur-[120px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {inWaitingRoom ? (
          /* Waiting Room Pre-Join Console */
          <motion.div 
            key="waiting-room"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-6 z-10"
          >
            <div className="w-full max-w-3xl bg-slate-950/40 border border-white/10 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col md:flex-row gap-8 items-center relative">
              {/* Left Column: Camera Preview Box */}
              <div className="flex-1 flex flex-col gap-4 w-full">
                <div className="w-full aspect-[4/3] rounded-2xl bg-slate-900 border border-white/5 relative overflow-hidden flex items-center justify-center shadow-inner">
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
                      <div className="w-16 h-16 rounded-full bg-slate-955/60 border border-white/5 flex items-center justify-center text-gray-500">
                        <VideoOff className="w-6 h-6 text-gray-400" />
                      </div>
                      <span className="text-[11px] text-gray-400 font-medium">Camera preview turned off</span>
                    </div>
                  )}

                  {/* Pre-join audio-video toggles overlay */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/75 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10">
                    <button
                      onClick={togglePreJoinAudio}
                      className={`p-2 rounded-xl transition-all ${
                        micEnabled ? 'text-white hover:bg-white/10' : 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/20'
                      }`}
                      title={micEnabled ? 'Mute Mic' : 'Unmute Mic'}
                    >
                      {micEnabled ? <Mic className="w-4.5 h-4.5" /> : <MicOff className="w-4.5 h-4.5" />}
                    </button>
                    <button
                      onClick={togglePreJoinVideo}
                      className={`p-2 rounded-xl transition-all ${
                        videoEnabled ? 'text-white hover:bg-white/10' : 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/20'
                      }`}
                      title={videoEnabled ? 'Stop Cam' : 'Start Cam'}
                    >
                      {videoEnabled ? <Video className="w-4.5 h-4.5" /> : <VideoOff className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic Join Configurations */}
              <div className="flex-1 flex flex-col gap-6 w-full">
                <div>
                  <div className="inline-flex items-center gap-1 bg-accent/10 border border-accent/20 text-accent text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md mb-2">
                    <Sparkles className="w-3 h-3" /> Waiting Room Setup
                  </div>
                  <h2 className="text-2xl font-black tracking-tight leading-none text-white">Ready to join?</h2>
                  <p className="text-xs text-gray-400 mt-2">Room Code: <span className="font-mono font-bold text-accent uppercase">{meetingCode}</span></p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Your Display Name</label>
                  <input
                    type="text"
                    placeholder="Type name..."
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-11 bg-white/5 border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary w-full text-white"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <Button onClick={handleJoin} className="w-full h-11 font-bold shadow-lg shadow-primary/10">
                    Join Session Room
                  </Button>
                  <Button variant="ghost" onClick={() => router.push('/dashboard')} className="w-full h-10 text-xs text-gray-450 hover:text-white border border-white/5">
                    Cancel & Back
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Active Interactive Meeting Interface */
          <motion.div 
            key="active-meeting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex relative"
          >
            <div className="flex-1 flex flex-col p-4 gap-4 justify-between h-[100vh]">
              {/* Top Toolbar panel */}
              <div className="h-14 bg-slate-950/40 border border-white/10 rounded-2xl px-5 flex items-center justify-between backdrop-blur-xl z-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-black text-sm text-white shadow-md">
                    C
                  </div>
                  <span className="font-extrabold text-sm tracking-wide bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent uppercase font-mono">
                    {meetingCode}
                  </span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Connected to signal gateway" />

                  {/* Network quality signal indicator */}
                  <div className="hidden sm:flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-lg text-[10px] text-gray-400">
                    <Signal className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="capitalize">{networkStatus} Link</span>
                  </div>

                  {/* Simulated Recording indicator */}
                  {isRecording && (
                    <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-lg text-[10px] text-rose-400 animate-pulse">
                      <CircleDot className="w-3 h-3 text-rose-500" />
                      <span>REC</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyInviteLink}
                    className="h-9 px-3 text-xs gap-1.5 border border-white/5 bg-white/5 hover:bg-white/10 rounded-xl text-gray-200"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy Link
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setChatOpen(!chatOpen)}
                    className={`h-9 w-9 rounded-xl relative border border-white/5 transition-all ${chatOpen ? 'bg-primary border-primary text-white' : 'bg-white/5 hover:bg-white/10'}`}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Video Grid Section */}
              <div className="flex-1 min-h-0 py-2">
                <div className={cn(
                  "w-full h-full grid gap-4 auto-rows-fr",
                  participants.length <= 1 ? "grid-cols-1" : 
                  participants.length <= 2 ? "grid-cols-1 md:grid-cols-2" : 
                  "grid-cols-2 lg:grid-cols-3"
                )}>
                  {participants.map((participant) => (
                    <div
                      key={participant.socketId}
                      className={cn(
                        "rounded-3xl border border-white/5 bg-[#0b0f19] overflow-hidden relative shadow-lg flex items-center justify-center transition-all",
                        participant.socketId === 'local' && isHandRaised ? "border-amber-500/40 ring-1 ring-amber-500/30" : ""
                      )}
                    >
                      {participant.stream && participant.videoEnabled ? (
                        <VideoPlayer stream={participant.stream} isLocal={participant.isLocal} />
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center font-extrabold text-xl shadow-md text-gray-300">
                            {participant.name.charAt(0)}
                          </div>
                          <span className="text-[11px] text-gray-400 font-medium">{participant.name}</span>
                        </div>
                      )}

                      {/* Participant tag label overlay */}
                      <div className="absolute bottom-4 left-4 bg-black/75 px-3 py-1.5 rounded-xl text-[10px] font-bold backdrop-blur-md flex items-center gap-2 border border-white/10">
                        <span>{participant.name}</span>
                        {!participant.audioEnabled && <MicOff className="w-3.5 h-3.5 text-rose-500" />}
                      </div>

                      {/* Raise hand visual tag */}
                      {participant.isLocal && isHandRaised && (
                        <div className="absolute top-4 right-4 bg-amber-500 text-slate-950 font-bold px-2.5 py-1 rounded-xl text-[10px] flex items-center gap-1 shadow-md">
                          <Hand className="w-3 h-3 fill-slate-950" /> Hand Raised
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Meeting Controls Panel */}
              <div className="h-16 bg-slate-950/70 border border-white/10 rounded-2xl px-6 flex items-center justify-center gap-3.5 max-w-xl mx-auto w-full backdrop-blur-xl">
                {/* Audio button */}
                <button
                  onClick={toggleAudio}
                  className={`p-3 rounded-xl transition-all ${
                    micEnabled
                      ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                      : 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20'
                  }`}
                  title={micEnabled ? 'Mute Mic' : 'Unmute Mic'}
                >
                  {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                {/* Video button */}
                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-xl transition-all ${
                    videoEnabled
                      ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                      : 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20'
                  }`}
                  title={videoEnabled ? 'Stop Video' : 'Start Video'}
                >
                  {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>

                {/* Screen Share button */}
                <button
                  onClick={toggleScreenShare}
                  className={`p-3 rounded-xl transition-all ${
                    isScreenSharing
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                      : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                  }`}
                  title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
                >
                  <ScreenShare className="w-5 h-5" />
                </button>

                {/* Hand Raise button */}
                <button
                  onClick={() => setIsHandRaised(!isHandRaised)}
                  className={`p-3 rounded-xl transition-all ${
                    isHandRaised
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/25'
                      : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                  }`}
                  title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
                >
                  <Hand className="w-5 h-5" />
                </button>

                {/* Recording simulate button */}
                <button
                  onClick={() => {
                    setIsRecording(!isRecording);
                    showToast(isRecording ? 'Recording stopped' : 'Recording started (simulated)', 'info');
                  }}
                  className={`p-3 rounded-xl transition-all ${
                    isRecording
                      ? 'bg-rose-600 animate-pulse text-white shadow-lg shadow-rose-600/30'
                      : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                  }`}
                  title={isRecording ? 'Stop Recording' : 'Record Session'}
                >
                  <CircleDot className="w-5 h-5" />
                </button>

                {/* End call button */}
                <button
                  onClick={handleLeave}
                  className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-600/20 transition-all ml-4"
                  title="Disconnect & Leave"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Drawer Side container */}
            <ChatWindow
              meetingCode={meetingCode}
              username={displayName}
              socket={socketRef.current}
              isOpen={chatOpen}
              onClose={() => setChatOpen(false)}
              participants={participants}
            />
          </motion.div>
        )}
      </AnimatePresence>
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
