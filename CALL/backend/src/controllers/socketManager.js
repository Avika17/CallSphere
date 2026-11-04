import { Server } from "socket.io"
import Message from "../models/message.model.js"

let connections = {}
let timeOnline = {}
let socketToRoom = {}
let socketToUser = {}

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log("CLIENT CONNECTED", socket.id)

        // JOIN CALL ROOM (WebRTC Signaling channel)
        socket.on("join-call", (path) => {
            if (connections[path] === undefined) {
                connections[path] = []
            }
            connections[path].push(socket.id)
            timeOnline[socket.id] = new Date()
            socketToRoom[socket.id] = path

            // Notify other clients in WebRTC room
            connections[path].forEach((socketId) => {
                io.to(socketId).emit("user-joined", socket.id, connections[path])
            })
        })

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        })

        // JOIN CHAT CHANNEL
        socket.on("join-chat", async ({ meetingCode, username }) => {
            const chatRoom = `chat-${meetingCode}`;
            socket.join(chatRoom);
            socketToUser[socket.id] = username;
            socketToRoom[socket.id] = meetingCode;

            // Mark this user as online in the chat room
            io.to(chatRoom).emit("user-online", { username, socketId: socket.id });

            try {
                // Fetch previous messages from database
                const history = await Message.find({ meetingCode })
                    .populate('replyTo')
                    .sort({ timestamp: 1 })
                    .limit(100); // paginate/limit recent 100 messages

                socket.emit("chat-history", history);
            } catch (err) {
                console.error("Error retrieving chat history:", err);
            }
        })

        // SEND MESSAGE
        socket.on("send-message", async ({ meetingCode, sender, content, type = 'text', fileName, fileUrl, fileSize, replyTo }) => {
            const chatRoom = `chat-${meetingCode}`;
            try {
                const newMessage = new Message({
                    meetingCode,
                    sender,
                    senderSocketId: socket.id,
                    content,
                    type,
                    fileName,
                    fileUrl,
                    fileSize,
                    replyTo: replyTo || null,
                    readers: [sender] // sender reads their own message
                });

                await newMessage.save();

                // Populate replyTo details if any
                const populatedMsg = await Message.findById(newMessage._id).populate('replyTo');

                io.to(chatRoom).emit("receive-message", populatedMsg);
            } catch (err) {
                console.error("Error saving message:", err);
            }
        })

        // TYPING INDICATORS
        socket.on("typing", ({ meetingCode, username }) => {
            socket.to(`chat-${meetingCode}`).emit("typing", { username });
        })

        socket.on("stop-typing", ({ meetingCode, username }) => {
            socket.to(`chat-${meetingCode}`).emit("stop-typing", { username });
        })

        // MESSAGE EDITS
        socket.on("message-edited", async ({ messageId, newContent, meetingCode }) => {
            try {
                const message = await Message.findById(messageId);
                if (message) {
                    message.content = newContent;
                    message.isEdited = true;
                    await message.save();
                    io.to(`chat-${meetingCode}`).emit("message-edited", { messageId, content: newContent });
                }
            } catch (err) {
                console.error("Error editing message:", err);
            }
        })

        // MESSAGE DELETIONS
        socket.on("message-deleted", async ({ messageId, meetingCode }) => {
            try {
                const message = await Message.findById(messageId);
                if (message) {
                    message.content = "This message was deleted";
                    message.isDeleted = true;
                    await message.save();
                    io.to(`chat-${meetingCode}`).emit("message-deleted", { messageId });
                }
            } catch (err) {
                console.error("Error deleting message:", err);
            }
        })

        // MESSAGE REACTIONS
        socket.on("message-reaction", async ({ messageId, username, emoji, meetingCode }) => {
            try {
                const message = await Message.findById(messageId);
                if (message) {
                    const reactionIndex = message.reactions.findIndex(
                        (r) => r.username === username && r.emoji === emoji
                    );

                    if (reactionIndex !== -1) {
                        // Toggle reaction off
                        message.reactions.splice(reactionIndex, 1);
                    } else {
                        // Toggle reaction on
                        message.reactions.push({ username, emoji });
                    }

                    await message.save();
                    io.to(`chat-${meetingCode}`).emit("message-reaction", { messageId, reactions: message.reactions });
                }
            } catch (err) {
                console.error("Error saving reaction:", err);
            }
        })

        // READ RECEIPTS
        socket.on("read-receipt", async ({ messageId, username, meetingCode }) => {
            try {
                const message = await Message.findById(messageId);
                if (message && !message.readers.includes(username)) {
                    message.readers.push(username);
                    await message.save();
                    io.to(`chat-${meetingCode}`).emit("read-receipt", { messageId, readers: message.readers });
                }
            } catch (err) {
                console.error("Error saving read receipt:", err);
            }
        })

        // DISCONNECT HANDLER
        socket.on("disconnect", () => {
            console.log("CLIENT DISCONNECTED", socket.id)
            const path = socketToRoom[socket.id]
            const username = socketToUser[socket.id]

            // Cleanup WebRTC call connections
            if (path && connections[path]) {
                connections[path].forEach((elem) => {
                    if (elem !== socket.id) {
                        io.to(elem).emit('user-left', socket.id)
                    }
                })
                connections[path] = connections[path].filter(id => id !== socket.id)
                if (connections[path].length === 0) {
                    delete connections[path]
                }
            }

            // Cleanup Chat online status
            if (path && username) {
                io.to(`chat-${path}`).emit("user-offline", { username, socketId: socket.id });
            }

            delete timeOnline[socket.id]
            delete socketToRoom[socket.id]
            delete socketToUser[socket.id]
        })
    })

    return io;
}
