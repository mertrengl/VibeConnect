"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import io, { Socket } from "socket.io-client";
import styles from "./dashboard.module.css";

interface UserProfile {
  id?: string;
  username: string;
  email?: string;
  avatar_url?: string;
}

type UserPresence = "ONLINE" | "AWAY" | "BUSY";

interface PublicChannel {
  id: string;
  name: string;
  description?: string;
  is_group: boolean;
  is_public: boolean;
  _count?: {
    participants: number;
  };
  participants?: { role: string }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<UserPresence>("ONLINE");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<"messages" | "groups" | "channels" | "settings">("channels");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Settings Form State
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password Form State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Socket reference
  const socketRef = useRef<Socket | null>(null);

  // Real Channels from API
  const [dbChannels, setDbChannels] = useState<PublicChannel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [errorChannels, setErrorChannels] = useState<string | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("vibe_user");
    const storedToken = localStorage.getItem("vibe_token");

    if (storedToken) {
      setToken(storedToken);

      // Connect socket if token is available
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const socket = io(apiUrl, {
        auth: { token: storedToken },
        transports: ["websocket"],
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("Dashboard socket connected:", socket.id);
      });
    }

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setEditUsername(parsed.username || "");
        setEditEmail(parsed.email || "");
      } catch (e) {
        console.error("Failed to parse user session", e);
      }
    } else {
      setUser({
        username: "Alex Rivera",
        email: "alex@vibeconnect.com",
      });
      setEditUsername("Alex Rivera");
      setEditEmail("alex@vibeconnect.com");
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Fetch Public Channels from backend
  useEffect(() => {
    if (activeTab === "channels") {
      fetchPublicChannels();
    }
  }, [activeTab, token, searchQuery]);

  const fetchPublicChannels = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    setLoadingChannels(true);
    setErrorChannels(null);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const queryParam = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : "";
      const res = await fetch(`${apiUrl}/conversations/public${queryParam}`, {
        headers,
      });

      if (!res.ok) {
        throw new Error("Kamusal kanallar çekilemedi.");
      }

      const data = await res.json();
      setDbChannels(data);
    } catch (err: any) {
      setErrorChannels(err.message || "Kanallar yüklenirken hata oluştu.");
      setDbChannels([
        {
          id: "general",
          name: "general",
          description: "Company-wide announcements and general discussions.",
          is_group: true,
          is_public: true,
          _count: { participants: 1204 },
        },
        {
          id: "development",
          name: "development",
          description: "Engineering discussions, PR reviews, and technical architecture.",
          is_group: true,
          is_public: true,
          _count: { participants: 342 },
        },
        {
          id: "design-specs",
          name: "design-specs",
          description: "Figma links, UI critiques, and design system updates.",
          is_group: true,
          is_public: true,
          _count: { participants: 89 },
        },
        {
          id: "watercooler",
          name: "watercooler",
          description: "Casual conversations, weekend plans, and random memes.",
          is_group: true,
          is_public: true,
          _count: { participants: 512 },
        },
      ]);
    } finally {
      setLoadingChannels(false);
    }
  };

  // Join a public conversation
  const handleJoinChannel = async (channelId: string) => {
    if (!token) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    try {
      const res = await fetch(`${apiUrl}/conversations/${channelId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        fetchPublicChannels();
      }
    } catch (e) {
      console.error("Channel join error:", e);
    }
  };

  // Update Profile (Username & Email)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setProfileMsg({ type: "error", text: "Giriş yapmanız gerekmektedir." });
      return;
    }

    setProfileLoading(true);
    setProfileMsg(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    try {
      const res = await fetch(`${apiUrl}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: editUsername,
          email: editEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Profil güncellenemedi.");
      }

      // Update local storage and state
      const updatedUser = { ...user, username: data.username, email: data.email };
      setUser(updatedUser);
      localStorage.setItem("vibe_user", JSON.stringify(updatedUser));

      setProfileMsg({ type: "success", text: "Profil bilgileriniz başarıyla güncellendi!" });
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message });
    } finally {
      setProfileLoading(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setPasswordMsg({ type: "error", text: "Giriş yapmanız gerekmektedir." });
      return;
    }

    setPasswordLoading(true);
    setPasswordMsg(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    try {
      const res = await fetch(`${apiUrl}/users/me/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Şifre değiştirilemedi.");
      }

      setPasswordMsg({ type: "success", text: "Şifreniz başarıyla değiştirildi!" });
      setOldPassword("");
      setNewPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Change presence status strictly via dropdown selection
  const updatePresenceStatus = (newStatus: UserPresence) => {
    setUserStatus(newStatus);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("updateStatus", { status: newStatus });
    }
  };

  const handleLogout = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    localStorage.removeItem("vibe_token");
    localStorage.removeItem("vibe_user");
    router.push("/login");
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.dashboardContainer}>
      {/* Side Navigation Bar */}
      <aside className={styles.sidebar}>
        {/* Header */}
        <div className={styles.sidebarHeader}>
          <Image
            src="/logo.png"
            alt="Vibe Connect Logo"
            width={36}
            height={36}
            className={styles.logoImg}
          />
          <div>
            <h1 className={styles.brandTitle}>Vibe Connect</h1>
            <p className={styles.brandSubtitle}>Product Workspace</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className={styles.sidebarNav}>
          <button
            onClick={() => setActiveTab("messages")}
            className={`${styles.navItem} ${activeTab === "messages" ? styles.navItemActive : ""}`}
          >
            <svg className={styles.navIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Messages</span>
          </button>

          <button
            onClick={() => setActiveTab("groups")}
            className={`${styles.navItem} ${activeTab === "groups" ? styles.navItemActive : ""}`}
          >
            <svg className={styles.navIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>Groups</span>
          </button>

          <button
            onClick={() => setActiveTab("channels")}
            className={`${styles.navItem} ${activeTab === "channels" ? styles.navItemActive : ""}`}
          >
            <svg className={styles.navIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="9" x2="20" y2="9"></line>
              <line x1="4" y1="15" x2="20" y2="15"></line>
              <line x1="10" y1="3" x2="8" y2="21"></line>
              <line x1="16" y1="3" x2="14" y2="21"></line>
            </svg>
            <span>Channels</span>
          </button>
        </nav>

        {/* CTA */}
        <div className={styles.newChatSection}>
          <button className={styles.newChatBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>New Chat</span>
          </button>
        </div>

        {/* Footer Profile Box & Popover Dropdown */}
        <div className={styles.profileFooterContainer} ref={profileRef}>
          {/* Upward Dropdown Popover */}
          {showProfileMenu && (
            <div className={styles.profileDropdownUp}>
              <div className={styles.dropdownHeader}>
                <div className={styles.dropdownUser}>{user?.username || "Alex Rivera"}</div>
                <div className={styles.dropdownEmail}>{user?.email || "alex@vibeconnect.com"}</div>
              </div>

              <div className={styles.dropdownSectionTitle}>Set Status</div>

              <button
                onClick={() => { updatePresenceStatus("ONLINE"); setShowProfileMenu(false); }}
                className={`${styles.statusOption} ${userStatus === "ONLINE" ? styles.statusOptionActive : ""}`}
              >
                <span className={`${styles.statusDot} ${styles.statusOnline}`} style={{ position: "relative", inset: "auto" }}></span>
                <span>Online</span>
              </button>

              <button
                onClick={() => { updatePresenceStatus("AWAY"); setShowProfileMenu(false); }}
                className={`${styles.statusOption} ${userStatus === "AWAY" ? styles.statusOptionActive : ""}`}
              >
                <span className={`${styles.statusDot} ${styles.statusAway}`} style={{ position: "relative", inset: "auto" }}></span>
                <span>Away</span>
              </button>

              <button
                onClick={() => { updatePresenceStatus("BUSY"); setShowProfileMenu(false); }}
                className={`${styles.statusOption} ${userStatus === "BUSY" ? styles.statusOptionActive : ""}`}
              >
                <span className={`${styles.statusDot} ${styles.statusBusy}`} style={{ position: "relative", inset: "auto" }}></span>
                <span>Busy</span>
              </button>

              <div className={styles.dropdownDivider}></div>

              {/* Settings Item inside Dropdown */}
              <button
                onClick={() => {
                  setActiveTab("settings");
                  setShowProfileMenu(false);
                }}
                className={styles.dropdownActionBtn}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                <span>Settings</span>
              </button>

              <div className={styles.dropdownDivider}></div>

              <button onClick={handleLogout} className={styles.logoutBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>Log Out</span>
              </button>
            </div>
          )}

          {/* Profile Click Box: Toggles Dropdown Menu */}
          <div
            className={styles.profileFooter}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            title="Click to open profile menu"
          >
            <div className={styles.avatarWrapper}>
              <div className={styles.avatar}>
                {user?.username ? user.username.charAt(0).toUpperCase() : "A"}
              </div>
              <div
                className={`${styles.statusDot} ${
                  userStatus === "ONLINE"
                    ? styles.statusOnline
                    : userStatus === "AWAY"
                    ? styles.statusAway
                    : styles.statusBusy
                }`}
              ></div>
            </div>

            <div className={styles.profileInfo}>
              <div className={styles.profileName}>{user?.username || "Alex Rivera"}</div>
              <div className={styles.profileStatus}>
                <span>
                  {userStatus === "ONLINE" ? "Online" : userStatus === "AWAY" ? "Away" : "Busy"}
                </span>
              </div>
            </div>

            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--color-outline)" }}>
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.mainWrapper}>
        {/* Top Header */}
        <header className={styles.topHeader}>
          <h2 className={styles.headerTitle}>
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h2>

          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search channels, messages, or people..."
              className={styles.searchInput}
            />
          </div>

          <div className={styles.headerActions}>
            <button className={styles.iconBtn} aria-label="Notifications">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span className={styles.unreadBadge}></span>
            </button>

            <button
              className={styles.iconBtn}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              aria-label="Profile Settings"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>
          </div>
        </header>

        {/* Dashboard Canvas Area */}
        <main className={styles.canvas}>
          {activeTab === "settings" ? (
            /* Settings & Profile Update View (Side-by-Side 2-Column Grid) */
            <div className={styles.settingsContainer}>
              <div className={styles.pageHeader} style={{ marginBottom: "var(--space-md)" }}>
                <div>
                  <h3 className={styles.pageTitle}>Account Settings</h3>
                  <p className={styles.pageSubtitle}>
                    Update your personal profile, email address, and security credentials.
                  </p>
                </div>
              </div>

              {/* Side-by-Side 2-Column Panels */}
              <div className={styles.settingsGrid}>
                {/* Profile Info Card (Left Column) */}
                <div className={styles.settingsCard}>
                  <h4 className={styles.settingsCardTitle}>Profile Details</h4>
                  {profileMsg && (
                    <div className={profileMsg.type === "success" ? styles.alertSuccess : styles.alertError}>
                      {profileMsg.text}
                    </div>
                  )}
                  <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
                    <div className={styles.formGroup}>
                      <label>Username</label>
                      <input
                        type="text"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        placeholder="e.g. alex_rivera"
                        className={styles.formInput}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Email Address</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="alex@company.com"
                        className={styles.formInput}
                        required
                      />
                    </div>

                    <button type="submit" disabled={profileLoading} className={styles.saveBtn}>
                      {profileLoading ? "Updating Profile..." : "Save Profile Details"}
                    </button>
                  </form>
                </div>

                {/* Security & Password Card (Right Column) */}
                <div className={styles.settingsCard}>
                  <h4 className={styles.settingsCardTitle}>Security & Password</h4>
                  {passwordMsg && (
                    <div className={passwordMsg.type === "success" ? styles.alertSuccess : styles.alertError}>
                      {passwordMsg.text}
                    </div>
                  )}
                  <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
                    <div className={styles.formGroup}>
                      <label>Current Password</label>
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="••••••••"
                        className={styles.formInput}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 chars (1 uppercase, 1 symbol)"
                        className={styles.formInput}
                        required
                      />
                    </div>

                    <button type="submit" disabled={passwordLoading} className={styles.saveBtn}>
                      {passwordLoading ? "Changing Password..." : "Change Password"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            /* Channels / Bento Grid View */
            <>
              {/* Page Header */}
              <div className={styles.pageHeader}>
                <div>
                  <h3 className={styles.pageTitle}>Workspace Channels</h3>
                  <p className={styles.pageSubtitle}>
                    Browse and join active conversations across your organization.
                  </p>
                </div>

                <button className={styles.filterBtn} onClick={fetchPublicChannels}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                  </svg>
                  <span>Refresh</span>
                </button>
              </div>

              {/* Channels Bento Grid from Backend */}
              {loadingChannels ? (
                <div style={{ color: "var(--color-outline)", fontSize: "0.9rem" }}>Loading channels from DB...</div>
              ) : (
                <div className={styles.bentoGrid}>
                  {dbChannels.map((channel, index) => {
                    const isJoined = channel.participants && channel.participants.length > 0;
                    const memberCount = channel._count?.participants ?? 1;

                    if (index === 0) {
                      // Featured First Channel Card
                      return (
                        <div key={channel.id} className={styles.featuredCard}>
                          <div className={styles.featuredGlow}></div>
                          <div className={styles.cardTop}>
                            <div style={{ display: "flex", alignItems: "center" }}>
                              <div className={styles.channelIconBox}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <line x1="4" y1="9" x2="20" y2="9"></line>
                                  <line x1="4" y1="15" x2="20" y2="15"></line>
                                  <line x1="10" y1="3" x2="8" y2="21"></line>
                                  <line x1="16" y1="3" x2="14" y2="21"></line>
                                </svg>
                              </div>
                              <div>
                                <h4 className={styles.channelName}>#{channel.name}</h4>
                                <div className={styles.channelMeta}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                  </svg>
                                  <span>{memberCount} members</span>
                                </div>
                              </div>
                            </div>
                            <span className={styles.tagBadge}>Public Group</span>
                          </div>

                          <p className={styles.cardDescription} style={{ margin: "12px 0" }}>
                            {channel.description || "Active community channel for public discussions and updates."}
                          </p>

                          <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button
                              onClick={() => handleJoinChannel(channel.id)}
                              className={styles.filterBtn}
                              style={{
                                background: isJoined ? "transparent" : "var(--color-primary)",
                                color: isJoined ? "var(--color-on-surface)" : "#fff",
                                border: isJoined ? "1px solid var(--color-border-subtle)" : "none",
                              }}
                            >
                              {isJoined ? "Joined ✓" : "Join Channel"}
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // Standard Cards
                    return (
                      <div key={channel.id} className={styles.standardCard}>
                        <div className={styles.cardTitleRow}>
                          <div className={styles.channelIconBox}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="4" y1="9" x2="20" y2="9"></line>
                              <line x1="4" y1="15" x2="20" y2="15"></line>
                              <line x1="10" y1="3" x2="8" y2="21"></line>
                              <line x1="16" y1="3" x2="14" y2="21"></line>
                            </svg>
                          </div>
                          <div>
                            <h4 className={styles.channelName} style={{ fontSize: "1.1rem" }}>#{channel.name}</h4>
                            <div className={styles.channelMeta}>{memberCount} members</div>
                          </div>
                        </div>
                        <p className={styles.cardDescription}>
                          {channel.description || "Public topic channel for team collaboration."}
                        </p>
                        <button
                          onClick={() => handleJoinChannel(channel.id)}
                          className={styles.actionBtn}
                          style={{
                            borderColor: isJoined ? "var(--color-border-subtle)" : "var(--color-primary)",
                            color: isJoined ? "var(--color-on-surface)" : "var(--color-primary)",
                          }}
                        >
                          {isJoined ? "Joined ✓" : "View / Join"}
                        </button>
                      </div>
                    );
                  })}

                  {/* Create Channel Card */}
                  <div className={styles.createChannelCard}>
                    <div className={styles.addIconCircle}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </div>
                    <div className={styles.createTitle}>Create Channel</div>
                    <div className={styles.createSubtitle}>Start a new conversation topic</div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
