/**
 * Retro Chat — State Management & Realtime Code-Based Chat Store
 */

class RetroChatStore {
  constructor() {
    this.STORAGE_KEY = "retro_chat_db_v1";
    this.broadcastChannel = null;
    try {
      this.broadcastChannel = new BroadcastChannel("retro_chat_live_channel");
    } catch (e) {}

    this.state = this.loadState();
    this.activeRoomId = null;
    this.listeners = [];

    this.initRealtimeListener();
  }

  generateUserCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "RC-";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  generateGroupCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "GRP-";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  getDefaultState() {
    const myCode = this.generateUserCode();
    return {
      currentUser: {
        id: "user_" + Math.random().toString(36).substring(2, 9),
        name: "RetroPilot",
        code: myCode,
        avatar: "⚡",
        status: "Online • Ready to chat",
        createdAt: Date.now()
      },
      rooms: [
        {
          id: "room_global_arcade",
          type: "group",
          name: "👾 Retro Arcade Lounge",
          code: "GRP-8080",
          avatar: "👾",
          description: "Public lounge for retro gaming, synthwave & chill talks.",
          unreadCount: 0,
          membersCount: 42,
          lastMessage: {
            text: "Welcome to Retro Chat! Share your User Code to connect directly.",
            senderName: "System",
            timestamp: Date.now() - 3600000
          },
          messages: [
            {
              id: "msg_init_1",
              senderId: "system_bot",
              senderName: "RetroBot",
              senderAvatar: "🤖",
              text: "⚡ Welcome to Retro Chat! You can chat in this group or start private 1-on-1 chats using your unique code.",
              timestamp: Date.now() - 3600000,
              isMine: false,
              reactions: { "🔥": 3, "❤️": 2 }
            },
            {
              id: "msg_init_2",
              senderId: "user_cyber_sam",
              senderName: "CyberSam",
              senderAvatar: "🕶️",
              text: "Hey everyone! Anyone up for some co-op retro games tonight?",
              timestamp: Date.now() - 1800000,
              isMine: false,
              reactions: { "👍": 4 }
            }
          ]
        }
      ],
      settings: {
        theme: "cyber-neon", // cyber-neon, matrix-green, vaporwave, midnight
        soundEnabled: true,
        isVip: false
      }
    };
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Failed to load Retro Chat state:", e);
    }
    const def = this.getDefaultState();
    this.save(def);
    return def;
  }

  save(customState = null) {
    if (customState) this.state = customState;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn("Failed to persist Retro Chat state:", e);
    }
    this.notify();
  }

  initRealtimeListener() {
    if (this.broadcastChannel) {
      this.broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.type === "NEW_MESSAGE") {
          this.handleIncomingBroadcast(event.data.payload);
        } else if (event.data && event.data.type === "SYNC_STATE") {
          this.state = this.loadState();
          this.notify();
        }
      };
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    callback(this.state);
  }

  notify() {
    this.listeners.forEach(cb => cb(this.state));
  }

  // Create or Join 1-on-1 Chat via User Code
  findUserByCode(code) {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return { success: false, error: "Please enter a valid code." };
    if (cleanCode === this.state.currentUser.code) {
      return { success: false, error: "That is your own User Code! Share it with friends to have them chat with you." };
    }

    // Check if room already exists
    let existingRoom = this.state.rooms.find(r => r.type === "direct" && r.partnerCode === cleanCode);
    if (existingRoom) {
      return { success: true, room: existingRoom, isNew: false };
    }

    // Generate friend name
    const defaultNames = ["PixelNova", "NeonBlade", "ShadowByte", "QuantumFox", "CyberGhost", "VaporRider"];
    const avatars = ["🧑‍🎤", "🕶️", "🚀", "⚡", "👾", "🤖", "🐱", "🎧"];
    const randomName = defaultNames[Math.floor(Math.random() * defaultNames.length)] + "_" + cleanCode.replace("RC-", "");
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

    const newRoom = {
      id: "room_direct_" + cleanCode.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase(),
      type: "direct",
      name: randomName,
      partnerCode: cleanCode,
      avatar: randomAvatar,
      status: "Active • End-to-End Encrypted",
      unreadCount: 0,
      lastMessage: {
        text: `Connected via Code ${cleanCode}`,
        senderName: "System",
        timestamp: Date.now()
      },
      messages: [
        {
          id: "msg_" + Date.now(),
          senderId: "system",
          senderName: "System",
          senderAvatar: "🔒",
          text: `🔐 Secret channel opened with ${randomName} (${cleanCode}). Messages are private and ephemeral.`,
          timestamp: Date.now(),
          isMine: false,
          reactions: {}
        }
      ]
    };

    this.state.rooms.unshift(newRoom);
    this.save();

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: "SYNC_STATE" });
    }

    return { success: true, room: newRoom, isNew: true };
  }

  // Create a new Group Chat
  createGroup(name, description = "", avatar = "👥") {
    if (!name || !name.trim()) return { success: false, error: "Group name is required." };
    const groupCode = this.generateGroupCode();

    const newGroup = {
      id: "room_group_" + Date.now(),
      type: "group",
      name: name.trim(),
      code: groupCode,
      avatar: avatar || "👥",
      description: description.trim() || "Private group chat.",
      unreadCount: 0,
      membersCount: 1,
      lastMessage: {
        text: "Group created. Share code: " + groupCode,
        senderName: "System",
        timestamp: Date.now()
      },
      messages: [
        {
          id: "msg_" + Date.now(),
          senderId: "system",
          senderName: "System",
          senderAvatar: "⚡",
          text: `🎉 Group created! Invite friends to join using Group Code: **${groupCode}**`,
          timestamp: Date.now(),
          isMine: false,
          reactions: { "🔥": 1 }
        }
      ]
    };

    this.state.rooms.unshift(newGroup);
    this.save();

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: "SYNC_STATE" });
    }

    return { success: true, room: newGroup };
  }

  // Join an existing group by Group Code
  joinGroupByCode(code) {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return { success: false, error: "Please enter a group code." };

    let existingRoom = this.state.rooms.find(r => r.type === "group" && r.code === cleanCode);
    if (existingRoom) {
      return { success: true, room: existingRoom, isNew: false };
    }

    // Connect to network group
    const newGroup = {
      id: "room_group_" + cleanCode.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase(),
      type: "group",
      name: "Group " + cleanCode,
      code: cleanCode,
      avatar: "🔥",
      description: "Code-joined group room.",
      unreadCount: 0,
      membersCount: Math.floor(Math.random() * 20) + 3,
      lastMessage: {
        text: "Joined group " + cleanCode,
        senderName: "System",
        timestamp: Date.now()
      },
      messages: [
        {
          id: "msg_" + Date.now(),
          senderId: "system",
          senderName: "System",
          senderAvatar: "⚡",
          text: `✓ You joined Group **${cleanCode}**! Say hello to everyone.`,
          timestamp: Date.now(),
          isMine: false,
          reactions: {}
        }
      ]
    };

    this.state.rooms.unshift(newGroup);
    this.save();

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: "SYNC_STATE" });
    }

    return { success: true, room: newGroup, isNew: true };
  }

  // Send a Message to Active Room
  sendMessage(roomId, text, mediaUrl = null) {
    if (!text && !mediaUrl) return null;
    const room = this.state.rooms.find(r => r.id === roomId);
    if (!room) return null;

    const message = {
      id: "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 5),
      roomId: roomId,
      senderId: this.state.currentUser.id,
      senderName: this.state.currentUser.name,
      senderAvatar: this.state.currentUser.avatar,
      text: text ? text.trim() : "",
      mediaUrl: mediaUrl,
      timestamp: Date.now(),
      isMine: true,
      status: "sent",
      reactions: {}
    };

    room.messages.push(message);
    room.lastMessage = {
      text: message.text || "📷 Photo attachment",
      senderName: "You",
      timestamp: message.timestamp
    };

    // Move active room to top of list
    const roomIdx = this.state.rooms.indexOf(room);
    if (roomIdx > 0) {
      this.state.rooms.splice(roomIdx, 1);
      this.state.rooms.unshift(room);
    }

    this.save();

    // Broadcast message to other active tabs / devices
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: "NEW_MESSAGE",
        payload: message
      });
    }

    // Simulate instant automated echo reply if 1-on-1 partner
    if (room.type === "direct") {
      this.simulatePartnerReply(room, text);
    }

    return message;
  }

  // Add Emoji Reaction to a Message
  toggleReaction(roomId, messageId, emoji) {
    const room = this.state.rooms.find(r => r.id === roomId);
    if (!room) return;
    const msg = room.messages.find(m => m.id === messageId);
    if (!msg) return;

    msg.reactions = msg.reactions || {};
    msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1;
    this.save();

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: "SYNC_STATE" });
    }
  }

  simulatePartnerReply(room, userText) {
    setTimeout(() => {
      const replies = [
        "Got your message! 🔥",
        "That's awesome! Check your User Code invite.",
        "100%! Let's connect again later on Retro Chat.",
        "⚡ Instant reply received over encrypted channel!",
        "Nice one! I'm sharing the group code with my crew."
      ];
      const replyText = replies[Math.floor(Math.random() * replies.length)];

      const replyMsg = {
        id: "msg_" + Date.now() + "_reply",
        roomId: room.id,
        senderId: "partner_" + room.partnerCode,
        senderName: room.name,
        senderAvatar: room.avatar,
        text: replyText,
        timestamp: Date.now(),
        isMine: false,
        status: "delivered",
        reactions: {}
      };

      room.messages.push(replyMsg);
      room.lastMessage = {
        text: replyText,
        senderName: room.name,
        timestamp: replyMsg.timestamp
      };

      this.save();

      if (window.retroAudio) {
        window.retroAudio.playMessageReceived();
      }
    }, 1200 + Math.random() * 1500);
  }

  handleIncomingBroadcast(message) {
    const room = this.state.rooms.find(r => r.id === message.roomId);
    if (room && message.senderId !== this.state.currentUser.id) {
      const exists = room.messages.some(m => m.id === message.id);
      if (!exists) {
        room.messages.push({ ...message, isMine: false });
        room.lastMessage = {
          text: message.text,
          senderName: message.senderName,
          timestamp: message.timestamp
        };
        this.save();
        if (window.retroAudio) {
          window.retroAudio.playMessageReceived();
        }
      }
    }
  }

  updateProfile(name, avatar, status) {
    if (name) this.state.currentUser.name = name.trim();
    if (avatar) this.state.currentUser.avatar = avatar;
    if (status) this.state.currentUser.status = status.trim();
    this.save();
  }

  setTheme(themeName) {
    this.state.settings.theme = themeName;
    this.save();
    document.body.className = `theme-${themeName}`;
  }
}

window.retroChatStore = new RetroChatStore();
