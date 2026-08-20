/**
 * Retro Chat — Main Application Controller
 * Handles conversation rendering, room transitions, message dispatch, emoji reactions, and modals.
 */

class RetroChatApp {
  constructor() {
    this.store = window.retroChatStore;
    this.audio = window.retroAudio;
    this.currentRoom = null;
    this.searchQuery = "";

    this.init();
  }

  init() {
    this.bindEvents();
    this.renderHeaderUserCode();
    this.renderRoomsList();

    // Auto-select first room on larger screens, or stay on list on mobile
    if (window.innerWidth >= 768 && this.store.state.rooms.length > 0) {
      this.openRoom(this.store.state.rooms[0].id);
    }

    // Apply saved theme
    if (this.store.state.settings.theme) {
      document.body.className = `theme-${this.store.state.settings.theme}`;
    }

    this.store.subscribe(() => {
      this.renderHeaderUserCode();
      this.renderRoomsList();
      if (this.currentRoom) {
        const updatedRoom = this.store.state.rooms.find(r => r.id === this.currentRoom.id);
        if (updatedRoom) {
          this.currentRoom = updatedRoom;
          this.renderMessagesStream();
        }
      }
    });
  }

  bindEvents() {
    // Search input in conversation list
    const searchInput = document.getElementById('chatSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderRoomsList();
      });
    }

    // Send Message Button & Enter Key
    const sendBtn = document.getElementById('chatSendBtn');
    const msgInput = document.getElementById('chatMessageInput');
    
    const triggerSend = () => {
      if (!this.currentRoom || !msgInput) return;
      const text = msgInput.value.trim();
      if (!text) return;

      this.audio.playMessageSent();
      this.store.sendMessage(this.currentRoom.id, text);
      msgInput.value = "";
      msgInput.style.height = "auto";
      this.scrollToBottom();
    };

    if (sendBtn) sendBtn.addEventListener('click', triggerSend);
    if (msgInput) {
      msgInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          triggerSend();
        }
      });
      // Auto-grow textarea
      msgInput.addEventListener('input', () => {
        msgInput.style.height = "auto";
        msgInput.style.height = Math.min(100, msgInput.scrollHeight) + "px";
      });
    }

    // Back to conversation list button (on mobile)
    const backBtn = document.getElementById('chatBackToListBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        document.getElementById('chatViewPanel').classList.remove('active-chat-open');
        this.currentRoom = null;
      });
    }

    // Modal Trigger: Find User by Code
    const findUserTrigger = document.getElementById('findUserModalTrigger');
    const findUserModal = document.getElementById('findUserModal');
    if (findUserTrigger && findUserModal) {
      findUserTrigger.addEventListener('click', () => {
        findUserModal.classList.remove('hidden');
        document.getElementById('userCodeInput').focus();
      });
    }

    // Submit Find User Code
    const submitFindUserBtn = document.getElementById('submitFindUserBtn');
    const userCodeInput = document.getElementById('userCodeInput');
    if (submitFindUserBtn && userCodeInput) {
      submitFindUserBtn.addEventListener('click', () => {
        const code = userCodeInput.value;
        const res = this.store.findUserByCode(code);
        if (res.success) {
          findUserModal.classList.add('hidden');
          userCodeInput.value = "";
          this.openRoom(res.room.id);
          this.audio.playGroupJoin();
        } else {
          alert(`⚠️ ${res.error}`);
        }
      });
    }

    // Modal Trigger: Create or Join Group
    const groupModalTrigger = document.getElementById('groupModalTrigger');
    const groupModal = document.getElementById('groupModal');
    if (groupModalTrigger && groupModal) {
      groupModalTrigger.addEventListener('click', () => {
        groupModal.classList.remove('hidden');
      });
    }

    // Group Modal Tabs (Create Group vs Join Group)
    const tabCreateGroup = document.getElementById('tabCreateGroup');
    const tabJoinGroup = document.getElementById('tabJoinGroup');
    const formCreateGroup = document.getElementById('formCreateGroup');
    const formJoinGroup = document.getElementById('formJoinGroup');

    if (tabCreateGroup && tabJoinGroup && formCreateGroup && formJoinGroup) {
      tabCreateGroup.addEventListener('click', () => {
        tabCreateGroup.classList.add('active');
        tabJoinGroup.classList.remove('active');
        formCreateGroup.classList.remove('hidden');
        formJoinGroup.classList.add('hidden');
      });

      tabJoinGroup.addEventListener('click', () => {
        tabJoinGroup.classList.add('active');
        tabCreateGroup.classList.remove('active');
        formJoinGroup.classList.remove('hidden');
        formCreateGroup.classList.add('hidden');
      });
    }

    // Create Group Submit
    const submitCreateGroupBtn = document.getElementById('submitCreateGroupBtn');
    if (submitCreateGroupBtn) {
      submitCreateGroupBtn.addEventListener('click', () => {
        const name = document.getElementById('newGroupNameInput').value;
        const desc = document.getElementById('newGroupDescInput').value;
        const avatar = document.getElementById('newGroupAvatarInput').value || "👥";

        const res = this.store.createGroup(name, desc, avatar);
        if (res.success) {
          groupModal.classList.add('hidden');
          document.getElementById('newGroupNameInput').value = "";
          document.getElementById('newGroupDescInput').value = "";
          this.openRoom(res.room.id);
          this.audio.playGroupJoin();
          if (window.confetti) window.confetti.fire(window.innerWidth / 2, window.innerHeight / 2, 60);
        } else {
          alert(`⚠️ ${res.error}`);
        }
      });
    }

    // Join Group Submit
    const submitJoinGroupBtn = document.getElementById('submitJoinGroupBtn');
    const joinGroupCodeInput = document.getElementById('joinGroupCodeInput');
    if (submitJoinGroupBtn && joinGroupCodeInput) {
      submitJoinGroupBtn.addEventListener('click', () => {
        const code = joinGroupCodeInput.value;
        const res = this.store.joinGroupByCode(code);
        if (res.success) {
          groupModal.classList.add('hidden');
          joinGroupCodeInput.value = "";
          this.openRoom(res.room.id);
          this.audio.playGroupJoin();
        } else {
          alert(`⚠️ ${res.error}`);
        }
      });
    }

    // Profile & Code Modal Trigger
    const profileTrigger = document.getElementById('myProfileModalTrigger');
    const profileModal = document.getElementById('myProfileModal');
    if (profileTrigger && profileModal) {
      profileTrigger.addEventListener('click', () => {
        this.populateProfileModal();
        profileModal.classList.remove('hidden');
      });
    }

    // Copy My User Code
    const copyUserCodeBtn = document.getElementById('copyMyUserCodeBtn');
    if (copyUserCodeBtn) {
      copyUserCodeBtn.addEventListener('click', () => {
        const code = this.store.state.currentUser.code;
        navigator.clipboard.writeText(code).then(() => {
          this.audio.playMessageSent();
          alert(`📋 Copied User Code: ${code}\nShare this with any friend so they can chat with you!`);
        });
      });
    }

    // Share My Invite Link
    const shareCodeBtn = document.getElementById('shareMyCodeBtn');
    if (shareCodeBtn) {
      shareCodeBtn.addEventListener('click', () => {
        const code = this.store.state.currentUser.code;
        const shareText = `Hey! Add me on Retro Chat using my User Code: ${code}\nDownload Retro Chat and enter this code to chat privately!`;
        if (navigator.share) {
          navigator.share({ title: "Chat on Retro Chat", text: shareText }).catch(() => {});
        } else {
          navigator.clipboard.writeText(shareText);
          alert("📋 Invite message copied to clipboard!");
        }
      });
    }

    // Save Profile Changes
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener('click', () => {
        const name = document.getElementById('profileNameInput').value;
        const avatar = document.getElementById('profileAvatarInput').value;
        const status = document.getElementById('profileStatusInput').value;
        this.store.updateProfile(name, avatar, status);
        profileModal.classList.add('hidden');
        alert("✓ Profile updated successfully!");
      });
    }

    // Theme Switcher Buttons
    document.querySelectorAll('.theme-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        this.store.setTheme(theme);
        document.querySelectorAll('.theme-option-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.audio.playMessageSent();
      });
    });

    // Close all modals
    document.querySelectorAll('.modal-close, .modal-cancel-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-backdrop');
        if (modal) modal.classList.add('hidden');
      });
    });

    // Photo Attachment simulation
    const attachBtn = document.getElementById('chatAttachMediaBtn');
    if (attachBtn) {
      attachBtn.addEventListener('click', () => {
        if (!this.currentRoom) return;
        const sampleImages = [
          "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80",
          "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
          "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80"
        ];
        const randomImg = sampleImages[Math.floor(Math.random() * sampleImages.length)];
        this.store.sendMessage(this.currentRoom.id, "Shared an attachment 📸", randomImg);
        this.audio.playMessageSent();
        this.scrollToBottom();
      });
    }
  }

  renderHeaderUserCode() {
    const codeBadge = document.getElementById('headerUserCodeBadge');
    if (codeBadge) {
      codeBadge.textContent = this.store.state.currentUser.code;
    }
    const avatarEl = document.getElementById('headerUserAvatar');
    if (avatarEl) {
      avatarEl.textContent = this.store.state.currentUser.avatar;
    }
  }

  renderRoomsList() {
    const container = document.getElementById('roomsListContainer');
    if (!container) return;

    let rooms = this.store.state.rooms;
    if (this.searchQuery) {
      rooms = rooms.filter(r => 
        r.name.toLowerCase().includes(this.searchQuery) ||
        (r.code && r.code.toLowerCase().includes(this.searchQuery)) ||
        (r.partnerCode && r.partnerCode.toLowerCase().includes(this.searchQuery))
      );
    }

    if (rooms.length === 0) {
      container.innerHTML = `
        <div class="empty-rooms-state">
          <span class="empty-icon">💬</span>
          <p>No conversations found.</p>
          <button class="btn btn-xs btn-primary mt-2" onclick="document.getElementById('findUserModalTrigger').click()">
            + Find User by Code
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = rooms.map(room => {
      const isActive = this.currentRoom && this.currentRoom.id === room.id;
      const codeDisplay = room.type === 'direct' ? room.partnerCode : room.code;
      const lastMsgText = room.lastMessage ? room.lastMessage.text : "No messages yet";
      const timeDisplay = room.lastMessage ? this.formatMessageTime(room.lastMessage.timestamp) : "";

      return `
        <div class="room-list-item ${isActive ? 'active' : ''}" onclick="window.retroApp.openRoom('${room.id}')">
          <div class="room-avatar-wrap">
            <span class="room-avatar">${room.avatar || '💬'}</span>
            <span class="online-indicator"></span>
          </div>

          <div class="room-info">
            <div class="room-header-row">
              <span class="room-name">${room.name}</span>
              <span class="room-time">${timeDisplay}</span>
            </div>

            <div class="room-preview-row">
              <span class="room-last-msg">${lastMsgText}</span>
              <span class="room-code-tag">${codeDisplay}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  openRoom(roomId) {
    const room = this.store.state.rooms.find(r => r.id === roomId);
    if (!room) return;

    this.currentRoom = room;
    document.getElementById('chatViewPanel').classList.add('active-chat-open');

    // Update Room Header
    const titleEl = document.getElementById('activeRoomTitle');
    const subEl = document.getElementById('activeRoomSubtitle');
    const avatarEl = document.getElementById('activeRoomAvatar');
    const codeTagEl = document.getElementById('activeRoomCodeTag');

    if (titleEl) titleEl.textContent = room.name;
    if (avatarEl) avatarEl.textContent = room.avatar;
    if (codeTagEl) codeTagEl.textContent = room.type === 'direct' ? room.partnerCode : room.code;
    if (subEl) {
      subEl.textContent = room.type === 'direct' ? 'Encrypted Direct Chat' : `${room.membersCount || 2} Members • Group Room`;
    }

    this.renderMessagesStream();
    this.renderRoomsList();
    this.scrollToBottom();
  }

  renderMessagesStream() {
    const container = document.getElementById('chatMessagesStream');
    if (!container || !this.currentRoom) return;

    const messages = this.currentRoom.messages || [];

    if (messages.length === 0) {
      container.innerHTML = `
        <div class="empty-messages-placeholder">
          <span class="placeholder-emoji">👋</span>
          <h4>Start the Conversation</h4>
          <p>Send a message to ${this.currentRoom.name}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = messages.map(msg => {
      const isMine = msg.isMine;
      const timeStr = this.formatMessageTime(msg.timestamp);

      // Render reactions
      const reactionsHtml = Object.entries(msg.reactions || {})
        .filter(([emoji, count]) => count > 0)
        .map(([emoji, count]) => `
          <span class="reaction-bubble" onclick="window.retroApp.addReaction('${msg.id}', '${emoji}')">
            ${emoji} ${count}
          </span>
        `).join('');

      return `
        <div class="message-row ${isMine ? 'mine' : 'theirs'}">
          ${!isMine ? `<div class="msg-avatar">${msg.senderAvatar || '👤'}</div>` : ''}

          <div class="message-bubble-wrap">
            ${!isMine && this.currentRoom.type === 'group' ? `<span class="msg-sender-name">${msg.senderName}</span>` : ''}

            <div class="message-bubble">
              ${msg.mediaUrl ? `<img src="${msg.mediaUrl}" class="msg-media-img" alt="Attachment" />` : ''}
              ${msg.text ? `<p class="msg-text">${this.escapeHtml(msg.text)}</p>` : ''}
              
              <div class="msg-meta-row">
                <span class="msg-timestamp">${timeStr}</span>
                ${isMine ? `<span class="msg-ticks">✓✓</span>` : ''}
              </div>
            </div>

            <div class="msg-reactions-row">
              ${reactionsHtml}
              <button class="add-reaction-btn" onclick="window.retroApp.showReactionPicker(event, '${msg.id}')">+</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  showReactionPicker(event, msgId) {
    event.stopPropagation();
    const existing = document.getElementById('floatingReactionPicker');
    if (existing) existing.remove();

    const picker = document.createElement('div');
    picker.id = 'floatingReactionPicker';
    picker.className = 'floating-reaction-picker';
    
    const emojis = ["❤️", "🔥", "👍", "😂", "⚡", "👾"];
    picker.innerHTML = emojis.map(e => `
      <span class="pick-emoji-btn" onclick="window.retroApp.addReaction('${msgId}', '${e}')">${e}</span>
    `).join('');

    const rect = event.target.getBoundingClientRect();
    picker.style.left = `${rect.left - 60}px`;
    picker.style.top = `${rect.top - 40}px`;

    document.body.appendChild(picker);

    const closeHandler = () => {
      picker.remove();
      document.removeEventListener('click', closeHandler);
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 10);
  }

  addReaction(msgId, emoji) {
    if (!this.currentRoom) return;
    this.store.toggleReaction(this.currentRoom.id, msgId, emoji);
    this.audio.playMessageSent();
    const picker = document.getElementById('floatingReactionPicker');
    if (picker) picker.remove();
  }

  populateProfileModal() {
    const user = this.store.state.currentUser;
    const nameInput = document.getElementById('profileNameInput');
    const avatarInput = document.getElementById('profileAvatarInput');
    const statusInput = document.getElementById('profileStatusInput');
    const codeDisplay = document.getElementById('profileCodeDisplay');

    if (nameInput) nameInput.value = user.name;
    if (avatarInput) avatarInput.value = user.avatar;
    if (statusInput) statusInput.value = user.status;
    if (codeDisplay) codeDisplay.textContent = user.code;
  }

  scrollToBottom() {
    const container = document.getElementById('chatMessagesStream');
    if (container) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);
    }
  }

  formatMessageTime(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }

  escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.retroApp = new RetroChatApp();
});
