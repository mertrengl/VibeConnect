"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import io, { Socket } from "socket.io-client";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageToggle } from "@/i18n/LanguageToggle";
import styles from "./dashboard.module.css";

interface UserProfile {
  id?: string;
  username: string;
  email?: string;
  bio?: string | null;
  avatar_url?: string | null;
  created_at?: string;
}

type UserPresence = "ONLINE" | "AWAY" | "BUSY" | "OFFLINE";

interface PublicChannel {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string | null;
  category?: string;
  is_group: boolean;
  is_public: boolean;
  _count?: {
    participants: number;
  };
  participants?: { role: string }[];
}

const EXACT_DB_CATEGORIES = [
  "GENERAL",
  "GAMING",
  "MUSIC",
  "SOFTWARE",
  "SPORTS",
  "BOOKS",
  "MOVIES",
  "CHILL",
  "ART",
  "FOOD",
  "TRAVEL",
  "FITNESS",
];

const CATEGORY_EMOJIS: Record<string, string> = {
  GENERAL: "💬",
  GAMING: "🎮",
  MUSIC: "🎵",
  SOFTWARE: "💻",
  SPORTS: "⚽",
  BOOKS: "📚",
  MOVIES: "🎬",
  CHILL: "☕",
  ART: "🎨",
  FOOD: "🍕",
  TRAVEL: "✈️",
  FITNESS: "🏋️‍♂️",
};

const DEFAULT_MOCK_CHANNELS: PublicChannel[] = [
  {
    id: "general-hub",
    name: "Global Hangout Lounge 🌟",
    description: "The primary community hub for meeting new friends, chatting about everything, and sharing daily vibes.",
    avatar_url: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=300&auto=format&fit=crop&q=80",
    category: "GENERAL",
    is_group: true,
    is_public: true,
    _count: { participants: 2840 },
  },
  {
    id: "indie-gamers",
    name: "Indie Game Developers & Gamers 🎮",
    description: "Discuss pixel art, Unreal Engine 5, Steam releases, and organize weekend multiplayer party games.",
    avatar_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&auto=format&fit=crop&q=80",
    category: "GAMING",
    is_group: true,
    is_public: true,
    _count: { participants: 1450 },
  },
  {
    id: "synthwave-beats",
    name: "Lo-Fi & Synthwave Beats Lounge 🎧",
    description: "Share your favorite Spotify playlists, Soundcloud tracks, ambient study music, and music production tips.",
    avatar_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80",
    category: "MUSIC",
    is_group: true,
    is_public: true,
    _count: { participants: 920 },
  },
  {
    id: "fullstack-architects",
    name: "Full-Stack Devs & AI Engineers 💻",
    description: "Next.js 16, TypeScript, NestJS architecture, LLM agent pipelines, and open-source project collabs.",
    avatar_url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&auto=format&fit=crop&q=80",
    category: "SOFTWARE",
    is_group: true,
    is_public: true,
    _count: { participants: 1890 },
  },
  {
    id: "book-club",
    name: "Sci-Fi & Cyberpunk Book Readers 📚",
    description: "Monthly book reading sessions, Neuromancer lore discussions, and recommendations for speculative fiction.",
    avatar_url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&auto=format&fit=crop&q=80",
    category: "BOOKS",
    is_group: true,
    is_public: true,
    _count: { participants: 410 },
  },
  {
    id: "fitness-grind",
    name: "Morning Workouts & Calisthenics 🏋️‍♂️",
    description: "Daily workout logs, nutrition guidance, progress check-ins, and athletic goal tracking.",
    avatar_url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&auto=format&fit=crop&q=80",
    category: "FITNESS",
    is_group: true,
    is_public: true,
    _count: { participants: 635 },
  },
  {
    id: "cinephiles-corner",
    name: "Midnight Cinephiles & Film Lovers 🍿",
    description: "Reviewing indie cinema, sci-fi movies, Letterboxd lists, and hosting weekend watch party streams.",
    avatar_url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop&q=80",
    category: "MOVIES",
    is_group: true,
    is_public: true,
    _count: { participants: 780 },
  },
  {
    id: "digital-art",
    name: "UI/UX & Digital Illustrators 🎨",
    description: "Figma design system reviews, Blender 3D showcases, shader experiments, and feedback for creators.",
    avatar_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80",
    category: "ART",
    is_group: true,
    is_public: true,
    _count: { participants: 1120 },
  },
];

const DEFAULT_MOCK_GROUPS: PublicChannel[] = [
  { id: "demo-group-night-owls", name: "Night Owls", description: "A relaxed after-hours group for sharing ideas and winding down.", category: "CHILL", is_group: true, is_public: false, _count: { participants: 4 } },
  { id: "demo-group-product-lab", name: "Product Lab", description: "Feedback, experiments, and tiny product wins with your crew.", category: "SOFTWARE", is_group: true, is_public: false, _count: { participants: 6 } },
];

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { t, getErrorMessage } = useLanguage();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<UserPresence>("ONLINE");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Initialize state from URL search params
  const initialTab = (searchParams.get("tab") as "messages" | "groups" | "channels" | "profile" | "security") || "channels";
  const initialCategory = searchParams.get("category") || "ALL";
  const initialSearch = searchParams.get("q") || "";

  const [activeTab, setActiveTab] = useState<"messages" | "groups" | "channels" | "profile" | "security">(initialTab);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  // Function to update URL search parameters dynamically
  const updateUrlParams = (newTab?: string, newCat?: string, newQuery?: string, clearConversation: boolean = true) => {
    const params = new URLSearchParams(searchParams.toString());
    const tabToSet = newTab !== undefined ? newTab : activeTab;
    const catToSet = newCat !== undefined ? newCat : selectedCategory;
    const queryToSet = newQuery !== undefined ? newQuery : searchQuery;

    if (tabToSet && tabToSet !== "channels") params.set("tab", tabToSet);
    else params.delete("tab");

    if (catToSet && catToSet !== "ALL") params.set("category", catToSet);
    else params.delete("category");

    if (queryToSet) params.set("q", queryToSet);
    else params.delete("q");

    if (clearConversation) {
      params.delete("conversation");
    }

    const queryStr = params.toString() ? `?${params.toString()}` : "";
    router.push(`${pathname}${queryStr}`, { scroll: false });
  };

  const updateConversationUrl = (conversationId?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (conversationId) params.set("conversation", conversationId);
    else params.delete("conversation");
    const queryStr = params.toString() ? `?${params.toString()}` : "";
    router.push(`${pathname}${queryStr}`, { scroll: false });
  };
  
  // New Conversation Modal State (Group / DM)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalTab, setCreateModalTab] = useState<"group" | "dm">("group");
  const [createGroupName, setCreateGroupName] = useState("");
  const [createGroupDescription, setCreateGroupDescription] = useState("");
  const [createGroupCategory, setCreateGroupCategory] = useState<string>("GENERAL");
  const [createGroupIsPublic, setCreateGroupIsPublic] = useState<boolean>(true);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchedUsers, setSearchedUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const selectedUserIds = selectedUsers.map(u => u.id);
  const [selectedDmUser, setSelectedDmUser] = useState<any | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [profileModalLoading, setProfileModalLoading] = useState(false);
  const [profileModalError, setProfileModalError] = useState<string | null>(null);
  const [startingDm, setStartingDm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editBio, setEditBio] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password Form State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Socket reference
  const socketRef = useRef<Socket | null>(null);

  // Categories State
  const [categories, setCategories] = useState<string[]>([]);

  // Real Channels from API
  const [dbChannels, setDbChannels] = useState<PublicChannel[]>([]);
  const [userConversations, setUserConversations] = useState<PublicChannel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [errorChannels, setErrorChannels] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Active Chat Room State
  const [activeConversation, setActiveConversation] = useState<PublicChannel | null>(null);
  const [activeMembers, setActiveMembers] = useState<UserProfile[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Media Upload State
  const [selectedMediaFile, setSelectedMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reactions Popover Hover/Click State
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);

  // DM & Groups Pagination Limit State (Initial 5)
  const [dmLimit, setDmLimit] = useState(5);
  const [groupLimit, setGroupLimit] = useState(5);

  const profileRef = useRef<HTMLDivElement>(null);

  // Real-time Online Users State
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [userStatuses, setUserStatuses] = useState<Map<string, string>>(new Map());

  const getConversationsForTab = (tab: "messages" | "groups") => {
    return userConversations.filter((conversation) => {
      const isGroup = (conversation as any).isGroup ?? conversation.is_group ?? false;
      return tab === "groups" ? isGroup : !isGroup;
    });
  };

  useEffect(() => {
    // Check if user is logged in (either via localStorage or sessionStorage)
    const storedUser = localStorage.getItem("vibe_user") || sessionStorage.getItem("vibe_user");
    const storedToken = localStorage.getItem("vibe_token") || sessionStorage.getItem("vibe_token");

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

      socket.on("onlineUsersList", (list: { userId: string; status: string }[]) => {
        const ids = new Set(list.map((u) => u.userId));
        setOnlineUserIds(ids);
      });

      socket.on("userOnline", (data: { userId: string }) => {
        setOnlineUserIds((prev) => new Set(prev).add(data.userId));
      });

      socket.on("userOffline", (data: { userId: string }) => {
        setOnlineUserIds((prev) => {
          const updated = new Set(prev);
          updated.delete(data.userId);
          return updated;
        });
      });

      socket.on("userStatusChanged", (data: { userId: string; status: string }) => {
        if (data.status === "OFFLINE") {
          setOnlineUserIds((prev) => {
            const updated = new Set(prev);
            updated.delete(data.userId);
            return updated;
          });
        } else {
          setOnlineUserIds((prev) => new Set(prev).add(data.userId));
        }
        setUserStatuses((prev) => new Map(prev).set(data.userId, data.status));
      });

      socket.on("newMessage", (msg: any) => {
        // Only append real-time message if it belongs to the currently active conversation room
        setActiveConversation((currentActive) => {
          if (currentActive && (msg.conversation_id === currentActive.id || msg.conversationId === currentActive.id)) {
            setChatMessages((prev) => [...prev, msg]);
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
          }
          return currentActive;
        });
      });

      socket.on("userTyping", (data: { userId: string; username?: string; conversationId: string }) => {
        setActiveConversation((currentActive) => {
          if (currentActive && currentActive.id === data.conversationId && data.userId !== user?.id) {
            setTypingUser(data.username || "Birisi");
            setTimeout(() => setTypingUser(null), 3000);
          }
          return currentActive;
        });
      });

      socket.on("userStopTyping", (data: { userId: string; conversationId: string }) => {
        setActiveConversation((currentActive) => {
          if (currentActive && currentActive.id === data.conversationId) {
            setTypingUser(null);
          }
          return currentActive;
        });
      });

      socket.on("reactionAdded", (reaction: any) => {
        setChatMessages((prevMessages) =>
          prevMessages.map((msg) => {
            if (msg.id === reaction.message_id || msg.id === reaction.messageId) {
              const existingReactions = msg.message_reactions || [];
              const filtered = existingReactions.filter(
                (r: any) => !(r.user_id === reaction.user_id && r.emoji === reaction.emoji)
              );
              return { ...msg, message_reactions: [...filtered, reaction] };
            }
            return msg;
          })
        );
      });

      socket.on("reactionRemoved", (data: { messageId: string; userId: string; emoji: string }) => {
        setChatMessages((prevMessages) =>
          prevMessages.map((msg) => {
            if (msg.id === data.messageId) {
              const existingReactions = msg.message_reactions || [];
              const filtered = existingReactions.filter(
                (r: any) => !(r.user_id === data.userId && r.emoji === data.emoji)
              );
              return { ...msg, message_reactions: filtered };
            }
            return msg;
          })
        );
      });
    } else {
      // Strict Auth Guard: Redirect unauthenticated user to login immediately
      router.replace("/login");
      return;
    }

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setEditUsername(parsed.username || "");
        setEditEmail(parsed.email || "");
        setEditBio(parsed.bio || "");
      } catch (e) {
        console.error("Failed to parse user session", e);
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [router]);

  // Fetch Categories & Channels when token or activeTab changes
  useEffect(() => {
    fetchCategories();
    fetchPublicChannels();
    fetchUserConversations();
  }, [activeTab, token, searchQuery, selectedCategory]);

  const fetchUserConversations = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    if (!token) return;
    setLoadingChannels(true);

    try {
      const res = await fetch(`${apiUrl}/conversations`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setUserConversations(data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch user conversations", err);
    } finally {
      setLoadingChannels(false);
    }
  };

  // Select Conversation & Join Room
  const handleSelectConversation = async (conv: PublicChannel) => {
    const normalizedConversation = { ...conv, is_group: (conv as any).isGroup ?? conv.is_group ?? false };
    setActiveConversation(normalizedConversation);
    setShowMembers(false);
    updateConversationUrl(normalizedConversation.id);
    setChatLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    // Join Socket Room
    if (socketRef.current) {
      if (activeConversation) {
        socketRef.current.emit("leaveRoom", { conversationId: activeConversation.id });
      }
      socketRef.current.emit("joinRoom", { conversationId: normalizedConversation.id });
    }

    try {
      if (normalizedConversation.id.startsWith("demo-group-")) {
        setActiveMembers([
          { username: "Maya Chen" }, { username: "Jordan Blake" }, { username: "Alex Rivera" },
        ]);
        setChatMessages([
          { id: "demo-1", content: "Welcome to the group — glad you’re here!", users: { username: "Maya Chen" }, created_at: new Date().toISOString() },
          { id: "demo-2", content: "Let’s use this space to share ideas and keep the conversation flowing.", users: { username: "Jordan Blake" }, created_at: new Date().toISOString() },
        ]);
        return;
      }
      if (conv.is_group || (conv as any).isGroup) {
        const detailsRes = await fetch(`${apiUrl}/conversations/${conv.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (detailsRes.ok) {
          const details = await detailsRes.json();
          setActiveMembers((details.participants || []).map((p: any) => p.users).filter(Boolean));
        } else {
          setActiveMembers([]);
        }
      } else {
        const otherUser = (conv as any).otherUser;
        setActiveMembers(otherUser ? [otherUser] : [{ username: normalizedConversation.name }]);
      }
      const res = await fetch(`${apiUrl}/messages/${conv.id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages(Array.isArray(data) ? data : []);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        console.warn("Could not load messages for conversation:", res.status);
      }
    } catch (e) {
      console.error("Failed to load conversation messages", e);
    } finally {
      setChatLoading(false);
    }
  };

  // Restore a conversation directly from the URL
  useEffect(() => {
    if (!token) return;
    const conversationId = searchParams.get("conversation");
    if (!conversationId) {
      if (activeConversation) setActiveConversation(null);
      return;
    }

    const conversation = userConversations.find((item) => item.id === conversationId);
    if (conversation) {
      if (activeConversation?.id !== conversation.id) {
        const isGroup = (conversation as any).isGroup ?? conversation.is_group ?? false;
        setActiveTab(isGroup ? "groups" : "messages");
        handleSelectConversation(conversation);
      }
    }
  }, [token, userConversations, searchParams]);

  const openUserProfile = async (profile: UserProfile) => {
    setSelectedProfile(profile);
    setProfileModalError(null);
    if (!profile.id || profile.id === user?.id) return;

    setProfileModalLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/users/${profile.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.ok) setSelectedProfile(await res.json());
      else setProfileModalError("Profil bilgileri şu anda yüklenemedi.");
    } catch {
      setProfileModalError("Profil bilgileri şu anda yüklenemedi.");
    } finally {
      setProfileModalLoading(false);
    }
  };

  const startDirectMessage = async (profile: UserProfile) => {
    if (!token || !profile.id || profile.id === user?.id) return;
    setStartingDm(true);
    setProfileModalError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isGroup: false, isPublic: false, participantIds: [profile.id] }),
      });
      const conversation = await res.json();
      if (!res.ok) throw new Error(conversation.message || "Sohbet başlatılamadı.");
      const dm: PublicChannel = { ...conversation, name: profile.username, is_group: false, is_public: false };
      setSelectedProfile(null);
      setActiveTab("messages");
      updateUrlParams("messages", undefined, undefined);
      await fetchUserConversations();
      await handleSelectConversation(dm);
    } catch (error) {
      setProfileModalError(error instanceof Error ? error.message : "Sohbet başlatılamadı.");
    } finally {
      setStartingDm(false);
    }
  };

  // File Selection Handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedMediaFile(file);
      setMediaPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveMedia = () => {
    setSelectedMediaFile(null);
    setMediaPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Toggle Message Reaction Handler
  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!token || !activeConversation) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    try {
      const res = await fetch(`${apiUrl}/messages/${messageId}/reactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emoji }),
      });

      if (res.ok) {
        setActiveReactionMsgId(null);
      }
    } catch (err) {
      console.error("Failed to toggle reaction", err);
    }
  };

  // Send Message Handler (Supports Media Upload + Text)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageText.trim() && !selectedMediaFile) || !activeConversation || !token) return;

    setSendingMessage(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    try {
      let uploadedMediaUrl: string | undefined = undefined;
      let messageType: "TEXT" | "IMAGE" | "VIDEO" | "FILE" = "TEXT";

      // Upload media if file selected
      if (selectedMediaFile) {
        setUploadingMedia(true);
        const formData = new FormData();
        formData.append("file", selectedMediaFile);

        const uploadRes = await fetch(`${apiUrl}/messages/upload-media`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          uploadedMediaUrl = uploadData.media_url || uploadData.url;
          const isVideo = selectedMediaFile.type.startsWith("video/");
          messageType = isVideo ? "VIDEO" : "IMAGE";
        }
      }

      const res = await fetch(`${apiUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          content: messageText.trim() || "",
          type: messageType,
          mediaUrl: uploadedMediaUrl,
          media_url: uploadedMediaUrl,
        }),
      });

      if (res.ok) {
        const newMsg = await res.json();
        setChatMessages((prev) => [...prev, newMsg]);
        setMessageText("");
        handleRemoveMedia();
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (e) {
      console.error("Failed to send message", e);
    } finally {
      setSendingMessage(false);
      setUploadingMedia(false);
    }
  };

  // Fetch Categories from API
  const fetchCategories = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    try {
      const res = await fetch(`${apiUrl}/conversations/categories`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        } else {
          setCategories(EXACT_DB_CATEGORIES);
        }
      } else {
        setCategories(EXACT_DB_CATEGORIES);
      }
    } catch (e) {
      setCategories(EXACT_DB_CATEGORIES);
    }
  };

  // Fetch Channels from backend
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

      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (selectedCategory && selectedCategory !== "ALL") params.append("category", selectedCategory);

      const queryStr = params.toString() ? `?${params.toString()}` : "";
      const endpoint = `${apiUrl}/conversations/public${queryStr}`;
      const res = await fetch(endpoint, {
        headers,
      });

      if (!res.ok) {
        throw new Error("Kamusal kanallar çekilemedi.");
      }

      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setDbChannels(data);
      } else {
        // Fallback demo data if DB has no channels yet
        const filtered = selectedCategory && selectedCategory !== "ALL"
          ? DEFAULT_MOCK_CHANNELS.filter(c => c.category === selectedCategory)
          : DEFAULT_MOCK_CHANNELS;
        setDbChannels(filtered);
      }
    } catch (err: any) {
      setErrorChannels(err.message || "Kanallar yüklenirken hata oluştu.");
      const filtered = selectedCategory && selectedCategory !== "ALL"
        ? DEFAULT_MOCK_CHANNELS.filter(c => c.category === selectedCategory)
        : DEFAULT_MOCK_CHANNELS;
      setDbChannels(filtered);
    } finally {
      setLoadingChannels(false);
    }
  };

  // Search users for modal
  const handleSearchUsers = async (query: string) => {
    setUserSearchQuery(query);
    if (!query.trim()) {
      setSearchedUsers([]);
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${apiUrl}/users/search?q=${encodeURIComponent(query)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setSearchedUsers(data);
      }
    } catch (e) {
      console.warn("Backend user search API unavailable, using fallback mock users:", e);
      setSearchedUsers([
        { id: "mock-1", username: "Elena Rostova", email: "elena@vibeconnect.com" },
        { id: "mock-2", username: "Marcus Kane", email: "marcus@vibeconnect.com" },
        { id: "mock-3", username: "System Architect Bot", email: "bot@vibeconnect.com" },
      ].filter(u => u.username.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase())));
    }
  };

  // Submit New Conversation (Group or DM)
  const handleCreateConversation = async () => {
    if (!token) {
      setCreateError("Giriş yapmanız gerekmektedir.");
      return;
    }

    setCreateLoading(true);
    setCreateError(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    try {
      if (createModalTab === "group") {
        if (!createGroupName.trim()) {
          throw new Error("Lütfen bir grup ismi giriniz.");
        }

        const res = await fetch(`${apiUrl}/conversations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: createGroupName,
            description: createGroupDescription,
            is_group: true,
            is_public: createGroupIsPublic,
            category: createGroupCategory,
            participantIds: selectedUserIds,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Grup oluşturulamadı.");

        setShowCreateModal(false);
        setCreateGroupName("");
        setCreateGroupDescription("");
        setSelectedUsers([]);
        await fetchPublicChannels();
        await fetchUserConversations();
        if (data && data.id) {
          setActiveTab("groups");
          handleSelectConversation(data);
        }
      } else {
        // Direct Message
        if (!selectedDmUser) {
          throw new Error("Lütfen mesajlaşmak için bir kullanıcı seçiniz.");
        }

        const res = await fetch(`${apiUrl}/conversations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            is_group: false,
            is_public: false,
            participantIds: [selectedDmUser.id],
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Sohbet başlatılamadı.");

        setShowCreateModal(false);
        setSelectedDmUser(null);
        setActiveTab("messages");
        await fetchUserConversations();
        if (data && data.id) {
          handleSelectConversation(data);
        }
      }
    } catch (err: any) {
      setCreateError(err.message || "İşlem sırasında hata oluştu.");
    } finally {
      setCreateLoading(false);
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

  // Avatar Upload Handler
  const [avatarLoading, setAvatarLoading] = useState(false);
  const handleAvatarUpload = async (file: File) => {
    if (!token) return;
    setAvatarLoading(true);
    setProfileMsg(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${apiUrl}/users/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Profil resmi yüklenemedi.");

      const updatedUser = { ...user, avatar_url: data.avatar_url } as UserProfile;
      setUser(updatedUser);
      if (localStorage.getItem("vibe_token")) {
        localStorage.setItem("vibe_user", JSON.stringify(updatedUser));
      } else {
        sessionStorage.setItem("vibe_user", JSON.stringify(updatedUser));
      }
      setProfileMsg({ type: "success", text: "Profil resminiz güncellendi!" });
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message });
    } finally {
      setAvatarLoading(false);
    }
  };

  // Avatar Remove Handler
  const handleRemoveAvatar = async () => {
    if (!token) return;
    setAvatarLoading(true);
    setProfileMsg(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    try {
      const res = await fetch(`${apiUrl}/users/avatar`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Profil resmi kaldırılamadı.");

      const updatedUser = { ...user, avatar_url: null } as UserProfile;
      setUser(updatedUser);
      if (localStorage.getItem("vibe_token")) {
        localStorage.setItem("vibe_user", JSON.stringify(updatedUser));
      } else {
        sessionStorage.setItem("vibe_user", JSON.stringify(updatedUser));
      }
      setProfileMsg({ type: "success", text: "Profil resmi kaldırıldı." });
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message });
    } finally {
      setAvatarLoading(false);
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

      // Update local/session storage and state
      const updatedUser = { ...user, username: data.username, email: data.email };
      setUser(updatedUser);
      if (localStorage.getItem("vibe_token")) {
        localStorage.setItem("vibe_user", JSON.stringify(updatedUser));
      } else {
        sessionStorage.setItem("vibe_user", JSON.stringify(updatedUser));
      }

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
  const updatePresenceStatus = (newStatus: UserPresence | "OFFLINE") => {
    setUserStatus(newStatus as any);
    if (socketRef.current) {
      socketRef.current.emit("changeStatus", { status: newStatus });
    }
  };

  const handleLogout = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    localStorage.removeItem("vibe_token");
    localStorage.removeItem("vibe_user");
    localStorage.removeItem("vibe_remember_me");
    sessionStorage.removeItem("vibe_token");
    sessionStorage.removeItem("vibe_user");
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
      <aside className={`${styles.sidebar} ${isSidebarCollapsed ? styles.sidebarCollapsed : ""}`}>
        {/* Header */}
        <div className={styles.sidebarHeader}>
          <Image
            src="/logo.png"
            alt="Vibe Connect Logo"
            width={36}
            height={36}
            className={styles.logoImg}
          />
          {!isSidebarCollapsed && (
            <div className={styles.brandTextContainer}>
              <h1 className={styles.brandTitle}>Vibe Connect</h1>
              <p className={styles.brandSubtitle}>{t("dashboard.brandSubtitle")}</p>
            </div>
          )}
          {/* Collapse Toggle Button */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={styles.collapseToggleBtn}
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle sidebar"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                transform: isSidebarCollapsed ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.3s ease",
              }}
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className={styles.sidebarNav}>
          <button
            onClick={() => {
              setActiveConversation(null);
              setActiveTab("channels");
              setSelectedCategory("ALL");
              updateUrlParams("channels", "ALL", undefined, true);
            }}
            className={`${styles.joinPublicBtn} ${activeTab === "channels" && !activeConversation ? styles.joinPublicBtnActive : ""}`}
            title="JOIN PUBLIC SERVERS - Discover & meet new people"
          >
            <div className={styles.joinPublicIconWrapper}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
            </div>
            {!isSidebarCollapsed && (
              <div className={styles.joinPublicContent}>
                <span className={styles.joinPublicTitle}>{t("common.joinPublicServers")}</span>
                <span className={styles.joinPublicSubtitle}>{t("common.discoverCommunities")}</span>
              </div>
            )}
            {!isSidebarCollapsed && <span className={styles.pulseBadge}></span>}
          </button>

          <div className={styles.navDivider}></div>

          {/* Expanded Sidebar Navigation View */}
          {!isSidebarCollapsed ? (
            <>
              {/* Direct Messages Header */}
              <button
                onClick={() => {
                  setActiveConversation(null);
                  setActiveTab("messages");
                  updateUrlParams("messages", undefined, undefined, true);
                }}
                className={`${styles.navItem} ${activeTab === "messages" && !activeConversation ? styles.navItemActive : ""}`}
                title={t("common.directMessages")}
              >
                <svg className={styles.navIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>{t("common.directMessages")}</span>
              </button>

              {/* Discord-style Direct Messages Sub-List */}
              <div className={styles.sidebarSubList}>
                {(() => {
                  const allDms = userConversations.filter((c) => (c as any).is_group === false || (c as any).isGroup === false);
                  const visibleDms = allDms.slice(0, dmLimit);
                  return (
                    <>
                      {visibleDms.map((dm) => {
                        const otherUserId = (dm as any).otherUser?.id;
                        const isOnline = otherUserId ? onlineUserIds.has(otherUserId) : false;
                        const isSelected = activeConversation?.id === dm.id;
                        return (
                          <div
                            key={dm.id}
                            onClick={() => { setActiveTab("messages"); handleSelectConversation(dm); }}
                            className={`${styles.sidebarSubItem} ${isSelected ? styles.sidebarSubItemActive : ""}`}
                          >
                            <div style={{ position: "relative", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {dm.avatar_url ? (
                                <Image src={dm.avatar_url} alt={dm.name} width={24} height={24} style={{ borderRadius: "50%", objectFit: "cover" }} />
                              ) : (
                                <div className={styles.sidebarSubAvatar}>{dm.name ? dm.name.charAt(0).toUpperCase() : "U"}</div>
                              )}
                              <span className={isOnline ? styles.onlineBadgeDot : styles.offlineBadgeDot} title={isOnline ? "Online" : "Offline"}></span>
                            </div>
                            <span className={styles.sidebarSubName}>{dm.name}</span>
                          </div>
                        );
                      })}
                      {allDms.length > dmLimit && (
                        <button
                          className={styles.loadMoreDmBtn}
                          onClick={() => {
                            setActiveConversation(null);
                            setActiveTab("messages");
                            updateUrlParams("messages", undefined, undefined, true);
                          }}
                        >
                          + Load More ({allDms.length - dmLimit})
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* My Groups Header */}
              <button
                onClick={() => {
                  setActiveConversation(null);
                  setActiveTab("groups");
                  updateUrlParams("groups", undefined, undefined, true);
                }}
                className={`${styles.navItem} ${activeTab === "groups" && !activeConversation ? styles.navItemActive : ""}`}
                title={t("common.myGroups")}
              >
                <svg className={styles.navIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>{t("common.myGroups")}</span>
              </button>

              {/* Discord-style My Groups Sub-List */}
              <div className={styles.sidebarSubList}>
                {(() => {
                  const allGroups = getConversationsForTab("groups");
                  const visibleGroups = allGroups.slice(0, groupLimit);
                  return (
                    <>
                      {visibleGroups.map((grp) => {
                        const isSelected = activeConversation?.id === grp.id;
                        return (
                          <div
                            key={grp.id}
                            onClick={() => { setActiveTab("groups"); handleSelectConversation(grp); }}
                            className={`${styles.sidebarSubItem} ${isSelected ? styles.sidebarSubItemActive : ""}`}
                          >
                            {grp.avatar_url ? (
                              <Image src={grp.avatar_url} alt={grp.name} width={24} height={24} style={{ borderRadius: "6px", objectFit: "cover" }} />
                            ) : (
                              <div className={styles.sidebarSubAvatar}>#</div>
                            )}
                            <span className={styles.sidebarSubName}>{grp.name}</span>
                          </div>
                        );
                      })}
                      {allGroups.length > groupLimit && (
                        <button
                          className={styles.loadMoreDmBtn}
                          onClick={() => {
                            setActiveConversation(null);
                            setActiveTab("groups");
                            updateUrlParams("groups", undefined, undefined, true);
                          }}
                        >
                          + Load More ({allGroups.length - groupLimit})
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </>
          ) : (
            /* Dedicated Collapsed Sidebar View: Icons Only (Discord Icon Bar) */
            <div className={styles.collapsedIconBar}>
              {/* Direct Messages Icon Header */}
              <div
                onClick={() => {
                  setActiveConversation(null);
                  setActiveTab("messages");
                  updateUrlParams("messages", undefined, undefined, true);
                }}
                className={`${styles.collapsedHeaderIcon} ${activeTab === "messages" && !activeConversation ? styles.collapsedHeaderIconActive : ""}`}
                title="Direct Messages"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>

              {/* DM User Avatars */}
              {userConversations
                .filter((c) => (c as any).is_group === false || (c as any).isGroup === false)
                .slice(0, 5)
                .map((dm) => {
                  const otherUserId = (dm as any).otherUser?.id;
                  const isOnline = otherUserId ? onlineUserIds.has(otherUserId) : false;
                  return (
                    <div
                      key={dm.id}
                      onClick={() => {
                        setActiveTab("messages");
                        handleSelectConversation(dm);
                      }}
                      className={styles.collapsedAvatarItem}
                      title={`${dm.name} (${isOnline ? "Online" : "Offline"})`}
                    >
                      {dm.avatar_url ? (
                        <Image src={dm.avatar_url} alt={dm.name} width={36} height={36} style={{ borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <div className={styles.collapsedAvatarPlaceholder}>
                          {dm.name ? dm.name.charAt(0).toUpperCase() : "U"}
                        </div>
                      )}
                      <span className={isOnline ? styles.onlineBadgeDot : styles.offlineBadgeDot} style={{ bottom: 1, right: 1 }}></span>
                    </div>
                  );
                })}

              <div className={styles.navDivider} style={{ width: "30px", margin: "8px auto" }}></div>

              {/* My Groups Icon Header */}
              <div
                onClick={() => {
                  setActiveConversation(null);
                  setActiveTab("groups");
                  updateUrlParams("groups", undefined, undefined, true);
                }}
                className={`${styles.collapsedHeaderIcon} ${activeTab === "groups" && !activeConversation ? styles.collapsedHeaderIconActive : ""}`}
                title="My Groups"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                </svg>
              </div>

              {/* Group Avatars */}
              {userConversations
                .filter((c) => (c as any).is_group === true || (c as any).isGroup === true)
                .slice(0, 5)
                .map((grp) => (
                  <div
                    key={grp.id}
                    onClick={() => {
                      setActiveTab("groups");
                      handleSelectConversation(grp);
                    }}
                    className={styles.collapsedAvatarItem}
                    title={grp.name}
                  >
                    {grp.avatar_url ? (
                      <Image src={grp.avatar_url} alt={grp.name} width={36} height={36} style={{ borderRadius: "8px", objectFit: "cover" }} />
                    ) : (
                      <div className={styles.collapsedGroupPlaceholder}>#</div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </nav>

        {/* CTA */}
        <div className={styles.newChatSection}>
          <button
            className={styles.newChatBtn}
            onClick={() => {
              setCreateModalTab("dm");
              setShowCreateModal(true);
            }}
            title={t("common.newChat")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            {!isSidebarCollapsed && <span>{t("common.newChat")}</span>}
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

              <div className={styles.dropdownSectionTitle}>{t("modals.setStatus")}</div>

              <button
                onClick={() => { updatePresenceStatus("ONLINE"); setShowProfileMenu(false); }}
                className={`${styles.statusOption} ${userStatus === "ONLINE" ? styles.statusOptionActive : ""}`}
              >
                <span className={`${styles.statusDot} ${styles.statusOnline}`} style={{ position: "relative", inset: "auto" }}></span>
                <span>{t("common.online")}</span>
              </button>

              <button
                onClick={() => { updatePresenceStatus("AWAY"); setShowProfileMenu(false); }}
                className={`${styles.statusOption} ${userStatus === "AWAY" ? styles.statusOptionActive : ""}`}
              >
                <span className={`${styles.statusDot} ${styles.statusAway}`} style={{ position: "relative", inset: "auto" }}></span>
                <span>{t("common.away")}</span>
              </button>

              <button
                onClick={() => { updatePresenceStatus("BUSY"); setShowProfileMenu(false); }}
                className={`${styles.statusOption} ${userStatus === "BUSY" ? styles.statusOptionActive : ""}`}
              >
                <span className={`${styles.statusDot} ${styles.statusBusy}`} style={{ position: "relative", inset: "auto" }}></span>
                <span>{t("common.busy")}</span>
              </button>

              <button
                onClick={() => { updatePresenceStatus("OFFLINE"); setShowProfileMenu(false); }}
                className={`${styles.statusOption} ${userStatus === "OFFLINE" ? styles.statusOptionActive : ""}`}
              >
                <span className={`${styles.statusDot} ${styles.statusOffline}`} style={{ position: "relative", inset: "auto" }}></span>
                <span>{t("common.invisible")}</span>
              </button>

              <div className={styles.dropdownDivider}></div>

              {/* Profile Item inside Dropdown */}
              <button
                onClick={() => {
                  setActiveTab("profile" as any);
                  updateUrlParams("profile", undefined, undefined);
                  setShowProfileMenu(false);
                }}
                className={styles.dropdownActionBtn}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>{t("common.profileSettings")}</span>
              </button>

              {/* Security Item inside Dropdown */}
              <button
                onClick={() => {
                  setActiveTab("security" as any);
                  updateUrlParams("security", undefined, undefined);
                  setShowProfileMenu(false);
                }}
                className={styles.dropdownActionBtn}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span>{t("common.securityCredentials")}</span>
              </button>

              <div className={styles.dropdownDivider}></div>

              <button onClick={handleLogout} className={styles.logoutBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>{t("common.logOut")}</span>
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

            {!isSidebarCollapsed && (
              <div className={styles.profileInfo}>
                <div className={styles.profileName}>{user?.username || "Alex Rivera"}</div>
                <div className={styles.profileStatus}>
                  <span>
                    {userStatus === "ONLINE"
                      ? t("common.online")
                      : userStatus === "AWAY"
                      ? t("common.away")
                      : userStatus === "BUSY"
                      ? t("common.busy")
                      : t("common.offline")}
                  </span>
                </div>
              </div>
            )}

            {!isSidebarCollapsed && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--color-outline)" }}>
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.mainWrapper}>
        {/* Top Header */}
        <header className={styles.topHeader}>
          <h2 className={styles.headerTitle}>
            {activeConversation
              ? (activeConversation.is_group ? `#${activeConversation.name}` : activeConversation.name)
              : activeTab === "messages"
              ? t("common.directMessages")
              : activeTab === "groups"
              ? t("common.myGroups")
              : activeTab === "channels"
              ? t("dashboard.exploreCommunitiesTitle")
              : activeTab === "profile"
              ? t("dashboard.userProfileTitle")
              : t("dashboard.securityTitle")}
          </h2>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, maxWidth: "560px", justifyContent: "flex-end" }}>
            <div className={styles.searchBox} style={{ margin: 0 }}>
              <span className={styles.searchIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  updateUrlParams(undefined, undefined, val);
                }}
                placeholder={t("common.searchPlaceholder")}
                className={styles.searchInput}
              />
            </div>
            <LanguageToggle />
          </div>
        </header>

        {/* Dashboard Canvas Area */}
        <main className={styles.canvas}>
          {activeTab === "profile" ? (
            /* Profile View with Avatar Edit Pencil Icon */
            <div className={styles.settingsContainer}>
              <div className={styles.pageHeader} style={{ marginBottom: "var(--space-md)" }}>
                <div>
                  <h3 className={styles.pageTitle}>User Profile</h3>
                  <p className={styles.pageSubtitle}>Manage your avatar picture, username, and public identity.</p>
                </div>
              </div>

              <div className={styles.settingsGrid}>
                {/* Profile Avatar & Info Card */}
                <div className={styles.settingsCard}>
                  <h4 className={styles.settingsCardTitle}>Profile Picture & Info</h4>

                  {profileMsg && (
                    <div className={profileMsg.type === "success" ? styles.alertSuccess : styles.alertError}>
                      {profileMsg.text}
                    </div>
                  )}

                  {/* Avatar Edit Section with Pencil Icon */}
                  <div className={styles.avatarEditContainer}>
                    <div className={styles.avatarBigWrapper}>
                      {user?.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt={user.username || "Avatar"}
                          width={96}
                          height={96}
                          className={styles.avatarBigImg}
                        />
                      ) : (
                        <div className={styles.avatarBigPlaceholder}>
                          {user?.username ? user.username.substring(0, 2).toUpperCase() : "AV"}
                        </div>
                      )}

                      {/* Pencil Edit Icon Button */}
                      <label className={styles.avatarEditPencilBtn} title="Change Profile Picture">
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleAvatarUpload(file);
                          }}
                          disabled={avatarLoading}
                        />
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </label>
                    </div>

                    <div className={styles.avatarActionGroup}>
                      <div className={styles.avatarHintText}>
                        JPG, PNG, or WEBP (Max 5MB)
                      </div>
                      {user?.avatar_url && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          disabled={avatarLoading}
                          className={styles.removeAvatarBtn}
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>

                  <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)", marginTop: "var(--space-md)" }}>
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
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <label>Bio / About Me</label>
                        <span style={{ fontSize: "0.7rem", color: editBio.length >= 240 ? "#ff4949" : "var(--color-on-surface-variant)" }}>
                          {editBio.length} / 255
                        </span>
                      </div>
                      <textarea
                        maxLength={255}
                        rows={3}
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        placeholder="Tell the community a little bit about yourself..."
                        className={styles.formInput}
                        style={{ resize: "vertical", fontFamily: "inherit" }}
                      />
                    </div>

                    <button type="submit" disabled={profileLoading} className={styles.saveBtn}>
                      {profileLoading ? "Updating Profile..." : "Save Profile Details"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : activeTab === "security" ? (
            /* Security View */
            <div className={styles.settingsContainer}>
              <div className={styles.pageHeader} style={{ marginBottom: "var(--space-md)" }}>
                <div>
                  <h3 className={styles.pageTitle}>Security & Credentials</h3>
                  <p className={styles.pageSubtitle}>Manage your private email address and password security.</p>
                </div>
              </div>

              <div className={styles.settingsGrid}>
                {/* Email Address Update Card */}
                <div className={styles.settingsCard}>
                  <h4 className={styles.settingsCardTitle}>Private Email Address</h4>
                  {profileMsg && (
                    <div className={profileMsg.type === "success" ? styles.alertSuccess : styles.alertError}>
                      {profileMsg.text}
                    </div>
                  )}
                  <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
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
                      {profileLoading ? "Updating Email..." : "Update Email Address"}
                    </button>
                  </form>
                </div>

                {/* Password Change Card */}
                <div className={styles.settingsCard}>
                  <h4 className={styles.settingsCardTitle}>Change Password</h4>
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
                      {passwordLoading ? "Changing Password..." : "Update Security Password"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            /* Public Servers / Bento Grid View */
            <>
              {/* List views keep their context header; an opened conversation replaces it completely. */}
              {!activeConversation && (activeTab === "channels" || activeTab === "messages" || activeTab === "groups") && (
                <div className={styles.pageHeader}>
                  <div>
                    <h3 className={styles.pageTitle}>
                      {activeTab === "channels"
                        ? t("dashboard.exploreCommunitiesTitle")
                        : activeTab === "groups"
                        ? t("dashboard.myGroupsTitle")
                        : t("dashboard.directMessagesTitle")}
                    </h3>
                    <p className={styles.pageSubtitle}>
                      {activeTab === "channels"
                        ? t("dashboard.exploreCommunitiesDesc")
                        : activeTab === "groups"
                        ? t("dashboard.myGroupsDesc")
                        : t("dashboard.directMessagesDesc")}
                    </p>
                  </div>

                  <button
                    className={styles.filterBtn}
                    onClick={() => {
                      setRefreshing(true);
                      fetchPublicChannels();
                      fetchUserConversations();
                      setTimeout(() => setRefreshing(false), 800);
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{
                        animation: refreshing ? "spin 0.8s linear infinite" : "none",
                      }}
                    >
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                    </svg>
                    <span>{t("common.refresh")}</span>
                  </button>
                </div>
              )}

              {/* Category Filter Bar (Only visible in Explore Public Channels) */}
              {activeTab === "channels" && (
                <div className={styles.categoryBar}>
                  <button
                    onClick={() => setSelectedCategory("ALL")}
                    className={`${styles.categoryChip} ${selectedCategory === "ALL" ? styles.categoryChipActive : ""}`}
                  >
                    🌐 {t("dashboard.allTopics")}
                  </button>

                  {/* Prominent Modal Trigger Button */}
                  <button
                    onClick={() => setShowCategoryModal(true)}
                    className={styles.exploreTopicsBtn}
                  >
                    <span className={styles.sparkleIcon}>✨</span>
                    <span>{t("dashboard.whatToTalkAbout")}</span>
                    {selectedCategory !== "ALL" && (
                      <span className={styles.selectedCategoryBadge}>
                        {CATEGORY_EMOJIS[selectedCategory] || "🏷️"} {t(`categories.${selectedCategory}`, selectedCategory)}
                      </span>
                    )}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                </div>
              )}

              {/* Channels Bento Grid / Active Discord Nested Chat Window */}
              {activeConversation ? (
                /* Discord-style Nested Active Chat View */
                <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", background: "var(--bg-surface-low)", borderRadius: "16px", border: "1px solid var(--color-border-subtle)", overflow: "hidden" }}>
                  {/* Chat Top Bar Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "var(--bg-surface-high)", borderBottom: "1px solid var(--color-border-subtle)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {activeConversation.avatar_url ? (
                        <Image src={activeConversation.avatar_url} alt={activeConversation.name} width={36} height={36} style={{ borderRadius: activeConversation.is_group ? "8px" : "50%", objectFit: "cover" }} />
                      ) : (
                        <div className={styles.sidebarSubAvatar} style={{ width: 36, height: 36, borderRadius: activeConversation.is_group ? "8px" : "50%", fontSize: "1rem" }}>
                          {activeConversation.is_group ? "#" : activeConversation.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>
                          {activeConversation.is_group ? `#${activeConversation.name}` : activeConversation.name}
                        </div>
                        <div className={styles.conversationStatus}>
                          {activeConversation.is_group ? t("modals.groupChannel") : <><span className={(activeConversation as any).otherUser?.id && onlineUserIds.has((activeConversation as any).otherUser.id) ? styles.statusOnline : styles.statusOffline}></span>{(activeConversation as any).otherUser?.id && onlineUserIds.has((activeConversation as any).otherUser.id) ? t("common.online") : t("common.offline")}</>}
                        </div>
                      </div>
                    </div>
                    {activeConversation.is_group && <button className={styles.membersToggleBtn} onClick={() => setShowMembers((visible) => !visible)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      </svg>
                      {showMembers ? t("modals.hideMembers") : t("modals.showMembers")}
                    </button>}
                    <button
                      onClick={() => { setActiveConversation(null); updateConversationUrl(); }}
                      style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "var(--color-on-surface-variant)", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem" }}
                    >
                      {t("common.closeChat")} ✕
                    </button>
                  </div>

                  <div className={styles.nestedChatBody}>
                  {/* Chat Messages Stream */}
                  <div className={styles.chatMessagesStream}>
                    {chatLoading ? (
                      <div style={{ color: "#c084fc", textAlign: "center", margin: "auto", fontSize: "0.9rem" }}>{t("common.loadingMessages")} 🚀</div>
                    ) : chatMessages.length === 0 ? (
                      <div style={{ margin: "auto", textAlign: "center", color: "var(--color-on-surface-variant)" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "8px" }}>👋</div>
                        <div style={{ fontWeight: 600, color: "#fff" }}>{t("common.noMessagesYet")}</div>
                        <div style={{ fontSize: "0.8rem", marginTop: "4px" }}>{t("modals.startConversationPrompt")}</div>
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => {
                        const isMe = msg.sender_id === user?.id || msg.users?.id === user?.id;
                        const isPopoverOpen = activeReactionMsgId === msg.id;
                        const reactionsList = msg.message_reactions || [];
                        
                        // Group reactions by emoji
                        const groupedReactions: { [emoji: string]: { count: number; userIds: string[]; hasReacted: boolean } } = {};
                        reactionsList.forEach((r: any) => {
                          if (!groupedReactions[r.emoji]) {
                            groupedReactions[r.emoji] = { count: 0, userIds: [], hasReacted: false };
                          }
                          groupedReactions[r.emoji].count += 1;
                          groupedReactions[r.emoji].userIds.push(r.user_id);
                          if (r.user_id === user?.id) {
                            groupedReactions[r.emoji].hasReacted = true;
                          }
                        });

                        return (
                          <div key={msg.id || idx} className={isMe ? styles.messageRowSelf : styles.messageRowOther}>
                            <button className={styles.messageProfileTrigger} onClick={() => openUserProfile(msg.users || { username: "User" })} aria-label="View sender profile">
                              {msg.users?.avatar_url ? (
                                <Image src={msg.users.avatar_url} alt="sender" width={32} height={32} style={{ borderRadius: "50%", objectFit: "cover" }} />
                              ) : (
                                <div className={styles.sidebarSubAvatar} style={{ width: 32, height: 32, fontSize: "0.85rem" }}>
                                  {msg.users?.username ? msg.users.username.charAt(0).toUpperCase() : "U"}
                                </div>
                              )}
                            </button>

                            <div className={styles.messageBubbleContainer} style={{ position: "relative" }}>
                              {/* Quick Reaction Popover */}
                              {isPopoverOpen && (
                                <div className={`${styles.reactionPickerPopover} ${isMe ? styles.reactionPickerSelf : styles.reactionPickerOther}`}>
                                  {["❤️", "👍", "🔥", "😂", "🚀", "😮"].map((emoji) => (
                                    <button
                                      key={emoji}
                                      className={styles.emojiBtn}
                                      onClick={() => handleToggleReaction(msg.id, emoji)}
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              )}

                              <div
                                onMouseEnter={() => setActiveReactionMsgId(msg.id)}
                                onMouseLeave={() => setActiveReactionMsgId(null)}
                                style={{
                                  background: isMe ? "linear-gradient(135deg, #a855f7, #6366f1)" : "rgba(255,255,255,0.08)",
                                  color: "#fff",
                                  padding: "10px 14px",
                                  borderRadius: isMe ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                                  fontSize: "0.9rem",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                                }}
                              >
                                {!isMe && <button className={styles.messageAuthorButton} onClick={() => openUserProfile(msg.users || { username: "User" })}>{msg.users?.username || "User"}</button>}

                                {/* Render Media Attachment (Image or Video) */}
                                {(msg.media_url || msg.mediaUrl) && (
                                  <div style={{ margin: "6px 0", borderRadius: "10px", overflow: "hidden" }}>
                                    {msg.type === "VIDEO" || (msg.media_url || msg.mediaUrl).match(/\.(mp4|webm|mov)$/i) ? (
                                      <video
                                        src={msg.media_url || msg.mediaUrl}
                                        controls
                                        style={{ maxWidth: "100%", maxHeight: "280px", borderRadius: "8px", display: "block" }}
                                      />
                                    ) : (
                                      <a href={msg.media_url || msg.mediaUrl} target="_blank" rel="noopener noreferrer">
                                        <Image
                                          src={msg.media_url || msg.mediaUrl}
                                          alt="Attachment"
                                          width={320}
                                          height={240}
                                          style={{ width: "100%", height: "auto", maxHeight: "280px", objectFit: "cover", borderRadius: "8px" }}
                                        />
                                      </a>
                                    )}
                                  </div>
                                )}

                                {msg.content && <div>{msg.content}</div>}

                                <div style={{ fontSize: "0.65rem", opacity: 0.7, textAlign: "right", marginTop: "4px" }}>
                                  {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                                </div>
                              </div>

                              {/* Render Reaction Badges Below Message */}
                              {Object.keys(groupedReactions).length > 0 && (
                                <div className={styles.reactionsContainer}>
                                  {Object.entries(groupedReactions).map(([emoji, data]) => (
                                    <button
                                      key={emoji}
                                      onClick={() => handleToggleReaction(msg.id, emoji)}
                                      className={`${styles.reactionChip} ${data.hasReacted ? styles.reactionChipActive : ""}`}
                                    >
                                      <span>{emoji}</span>
                                      <span>{data.count}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    {typingUser && (
                      <div className={styles.typingContainer}>
                        <span style={{ fontSize: "0.78rem", color: "#c084fc", fontWeight: 600 }}>{typingUser} yazıyor</span>
                        <div className={styles.typingDots}>
                          <span className={styles.typingDot}></span>
                          <span className={styles.typingDot}></span>
                          <span className={styles.typingDot}></span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {showMembers && activeConversation.is_group && (
                    <aside className={styles.memberPanel}>
                      <div className={styles.memberPanelTitle}>{t("common.members")} — {activeMembers.length}</div>
                      {activeMembers.map((member) => (
                        <button key={member.id || member.username} className={styles.memberRow} onClick={() => openUserProfile(member)}>
                          <span className={styles.memberAvatar}>{member.username.charAt(0).toUpperCase()}</span>
                          <span className={styles.memberName}>{member.username}</span>
                          <span className={onlineUserIds.has(member.id || "") ? styles.memberOnline : styles.memberOffline}></span>
                        </button>
                      ))}
                    </aside>
                  )}
                  </div>

                  {/* Chat Input Bar Form with Media Upload Button & Preview */}
                  <form onSubmit={handleSendMessage} style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "12px 20px", background: "var(--bg-surface-high)", borderTop: "1px solid var(--color-border-subtle)" }}>
                    {/* Media File Selected Preview */}
                    {selectedMediaFile && (
                      <div className={styles.mediaPreviewBox}>
                        {selectedMediaFile.type.startsWith("image/") && mediaPreviewUrl ? (
                          <Image src={mediaPreviewUrl} alt="preview" width={40} height={40} className={styles.mediaPreviewThumb} />
                        ) : (
                          <div style={{ fontSize: "1.2rem" }}>🎥</div>
                        )}
                        <div style={{ fontSize: "0.82rem", color: "#fff", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {selectedMediaFile.name} ({(selectedMediaFile.size / (1024 * 1024)).toFixed(1)} MB)
                        </div>
                        <button type="button" onClick={handleRemoveMedia} className={styles.mediaRemoveBtn}>
                          ✕
                        </button>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      {/* File Input Trigger */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*,video/*"
                        style={{ display: "none" }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={styles.mediaUploadBtn}
                        title="Upload Image or Video"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                      </button>

                      <input
                        type="text"
                        maxLength={255}
                        value={messageText}
                        onChange={(e) => {
                          setMessageText(e.target.value);
                          if (socketRef.current && activeConversation) {
                            socketRef.current.emit("typing", {
                              conversationId: activeConversation.id,
                              userId: user?.id,
                              username: user?.username,
                            });
                            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                            typingTimeoutRef.current = setTimeout(() => {
                              if (socketRef.current && activeConversation) {
                                socketRef.current.emit("stopTyping", {
                                  conversationId: activeConversation.id,
                                  userId: user?.id,
                                });
                              }
                            }, 2000);
                          }
                        }}
                        placeholder={`${t("common.messagePlaceholder")} (${activeConversation.is_group ? `#${activeConversation.name}` : activeConversation.name})...`}
                        style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid var(--color-border-subtle)", borderRadius: "8px", padding: "10px 14px", color: "#fff", outline: "none" }}
                      />
                      <button
                        type="submit"
                        disabled={sendingMessage || uploadingMedia || (!messageText.trim() && !selectedMediaFile) || messageText.length > 255}
                        className={styles.saveBtn}
                        style={{ marginTop: 0, padding: "8px 20px" }}
                      >
                        {sendingMessage || uploadingMedia ? t("common.sending") : t("common.send")}
                      </button>
                    </div>
                    {messageText.length > 0 && (
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <span style={{ fontSize: "0.72rem", color: messageText.length >= 240 ? "#ff4949" : "var(--color-on-surface-variant)", fontWeight: 500 }}>
                          {messageText.length} / 255
                        </span>
                      </div>
                    )}
                  </form>
                </div>
              ) : loadingChannels ? (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#c084fc", padding: "40px 0", fontSize: "0.95rem", fontWeight: 500, justifyContent: "center" }}>
                  <svg className={styles.spinnerIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                  </svg>
                  <span>{t("common.loadingConversations")} 🚀</span>
                </div>
              ) : (activeTab as any) === "messages" || (activeTab as any) === "groups" ? (
                /* Flat Clean Vertical List View for Direct Messages & My Groups */
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "800px" }}>
                  {getConversationsForTab(activeTab as "messages" | "groups")
                    .map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "16px 20px",
                          background: "var(--bg-surface-high)",
                          border: "1px solid var(--color-border-subtle)",
                          borderRadius: "12px",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          <div>
                            {item.avatar_url ? (
                              <Image src={item.avatar_url} alt={item.name} width={44} height={44} style={{ borderRadius: (activeTab as any) === "groups" ? "8px" : "50%", objectFit: "cover" }} />
                            ) : (
                              <div className={styles.channelIconBox} style={{ borderRadius: (activeTab as any) === "groups" ? "8px" : "50%", width: 44, height: 44, fontSize: "1.2rem", fontWeight: "bold" }}>
                                {(activeTab as any) === "groups" ? "#" : item.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <h4 style={{ fontSize: "1.05rem", fontWeight: 600, color: "#fff", margin: 0 }}>
                                {(activeTab as any) === "groups" ? `#${item.name}` : item.name}
                              </h4>
                              {!(item.is_group || (item as any).isGroup) && (item as any).otherUser?.id && (
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.72rem", color: onlineUserIds.has((item as any).otherUser.id) ? "#4caf50" : "var(--color-on-surface-variant)", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "12px" }}>
                                  <span className={`${styles.statusDot} ${onlineUserIds.has((item as any).otherUser.id) ? styles.statusOnline : styles.statusOffline}`} style={{ position: "static", width: 7, height: 7, border: "none" }}></span>
                                  <span>{onlineUserIds.has((item as any).otherUser.id) ? t("common.online") : t("common.offline")}</span>
                                </div>
                              )}
                            </div>
                            <p style={{ fontSize: "0.82rem", color: "var(--color-on-surface-variant)", margin: "4px 0 0 0" }}>
                              {item.description || (item as any).otherUser?.bio || ((activeTab as any) === "groups" ? "Community group channel" : "Hey there! I am using Vibe Connect.")}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSelectConversation(item)}
                          className={styles.saveBtn}
                          style={{ marginTop: 0, padding: "8px 16px" }}
                        >
                          {(activeTab as any) === "groups" ? t("dashboard.enterGroup") : t("dashboard.openChat")}
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className={styles.bentoGrid}>
                  {dbChannels
                    .filter((channel) => {
                      const isGrp = (channel as any).isGroup ?? (channel as any).is_group ?? false;
                      if ((activeTab as any) === "groups") return isGrp === true;
                      if ((activeTab as any) === "messages") return isGrp === false;
                      return true; // channels tab shows all public
                    })
                    .map((channel, index) => {
                    const isJoined = channel.participants && channel.participants.length > 0;
                    const memberCount = channel._count?.participants ?? 1;

                    if (index === 0) {
                      // Featured First Channel Card
                      return (
                        <div key={channel.id} className={styles.featuredCard}>
                          <div className={styles.featuredGlow}></div>
                          <div className={styles.cardTop}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              {channel.avatar_url ? (
                                <Image
                                  src={channel.avatar_url}
                                  alt={channel.name}
                                  width={48}
                                  height={48}
                                  style={{ borderRadius: "12px", objectFit: "cover" }}
                                />
                              ) : (
                                <div className={styles.channelIconBox}>
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="4" y1="9" x2="20" y2="9"></line>
                                    <line x1="4" y1="15" x2="20" y2="15"></line>
                                    <line x1="10" y1="3" x2="8" y2="21"></line>
                                    <line x1="16" y1="3" x2="14" y2="21"></line>
                                  </svg>
                                </div>
                              )}
                              <div>
                                <h4 className={styles.channelName}>#{channel.name}</h4>
                                <div className={styles.channelMeta}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                  </svg>
                                  <span>{memberCount} {t("modals.membersOnline")}</span>
                                </div>
                              </div>
                            </div>
                            {selectedCategory === "ALL" && channel.category && (
                              <span className={styles.tagBadge} style={{ marginLeft: "auto" }}>
                                {CATEGORY_EMOJIS[channel.category] || "🏷️"} {t(`categories.${channel.category}`, channel.category)}
                              </span>
                            )}
                            {selectedCategory !== "ALL" && (
                              <span className={styles.tagBadge}>{t("modals.hotCommunity")}</span>
                            )}
                          </div>

                          <p className={styles.cardDescription} style={{ margin: "12px 0" }}>
                            {channel.description || "Open community server to chat, share vibes, and hang out with new friends."}
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
                              {isJoined ? t("modals.joined") : t("modals.joinServer")}
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // Standard Cards
                    return (
                      <div key={channel.id} className={styles.standardCard}>
                        <div className={styles.cardTitleRow} style={{ gap: "12px", alignItems: "flex-start" }}>
                          {channel.avatar_url ? (
                            <Image
                              src={channel.avatar_url}
                              alt={channel.name}
                              width={42}
                              height={42}
                              style={{ borderRadius: "10px", objectFit: "cover" }}
                            />
                          ) : (
                            <div className={styles.channelIconBox}>
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="4" y1="9" x2="20" y2="9"></line>
                                <line x1="4" y1="15" x2="20" y2="15"></line>
                                <line x1="10" y1="3" x2="8" y2="21"></line>
                                <line x1="16" y1="3" x2="14" y2="21"></line>
                              </svg>
                            </div>
                          )}
                          <div style={{ flex: 1 }}>
                            <h4 className={styles.channelName} style={{ fontSize: "1.1rem" }}>#{channel.name}</h4>
                            <div className={styles.channelMeta}>{memberCount} {t("modals.membersOnline")}</div>
                          </div>
                          {selectedCategory === "ALL" && channel.category && (
                            <span className={styles.tagBadge}>
                              {CATEGORY_EMOJIS[channel.category] || "🏷️"} {t(`categories.${channel.category}`, channel.category)}
                            </span>
                          )}
                        </div>
                        <p className={styles.cardDescription}>
                          {channel.description || "Public community space to chat and connect."}
                        </p>
                        <button
                          onClick={() => handleJoinChannel(channel.id)}
                          className={styles.actionBtn}
                          style={{
                            borderColor: isJoined ? "var(--color-border-subtle)" : "var(--color-primary)",
                            color: isJoined ? "var(--color-on-surface)" : "var(--color-primary)",
                          }}
                        >
                          {isJoined ? t("modals.joined") : t("modals.joinServer")}
                        </button>
                      </div>
                    );
                  })}

                  {/* Create Server Card */}
                  <div
                    className={styles.createChannelCard}
                    onClick={() => {
                      setCreateModalTab("group");
                      setShowCreateModal(true);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <div className={styles.addIconCircle}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </div>
                    <div className={styles.createTitle}>{t("modals.createPublicServer")}</div>
                    <div className={styles.createSubtitle}>{t("modals.createPublicServerDesc")}</div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Category Discovery Modal */}
      {showCategoryModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCategoryModal(false)}>
          <div className={styles.categoryModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>{t("modals.topicModalTitle")}</h3>
                <p className={styles.modalSubtitle}>{t("modals.topicModalDesc")}</p>
              </div>
              <button className={styles.modalCloseBtn} onClick={() => setShowCategoryModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className={styles.modalCategoryGrid}>
              <button
                onClick={() => {
                  setSelectedCategory("ALL");
                  updateUrlParams(undefined, "ALL", undefined);
                  setShowCategoryModal(false);
                }}
                className={`${styles.modalCategoryCard} ${selectedCategory === "ALL" ? styles.modalCategoryCardActive : ""}`}
              >
                <span className={styles.modalEmoji}>🌐</span>
                <div className={styles.modalCategoryInfo}>
                  <div className={styles.modalCategoryName}>{t("dashboard.allTopics")}</div>
                  <div className={styles.modalCategoryDesc}>{t("modals.browseAllCommunities")}</div>
                </div>
              </button>

              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    updateUrlParams(undefined, cat, undefined);
                    setShowCategoryModal(false);
                  }}
                  className={`${styles.modalCategoryCard} ${selectedCategory === cat ? styles.modalCategoryCardActive : ""}`}
                >
                  <span className={styles.modalEmoji}>{CATEGORY_EMOJIS[cat] || "🏷️"}</span>
                  <div className={styles.modalCategoryInfo}>
                    <div className={styles.modalCategoryName}>{t(`categories.${cat}`, cat)}</div>
                    <div className={styles.modalCategoryDesc}>{t(`categories.${cat}`, cat)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Conversation Modal (Pixel-Perfect Stitch UI Replication) */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.stitchModal} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={styles.stitchModalHeader}>
              <h2 className={styles.stitchModalTitle}>{t("modals.newConversationTitle")}</h2>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setShowCreateModal(false)}
                aria-label="Close modal"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Segmented Control Tabs */}
            <div className={styles.stitchTabRow}>
              <button
                className={`${styles.stitchTab} ${createModalTab === "group" ? styles.stitchTabActive : ""}`}
                onClick={() => setCreateModalTab("group")}
              >
                {t("modals.newGroupTab")}
              </button>
              <button
                className={`${styles.stitchTab} ${createModalTab === "dm" ? styles.stitchTabActive : ""}`}
                onClick={() => setCreateModalTab("dm")}
              >
                {t("modals.directMessageTab")}
              </button>
            </div>

            {/* Modal Error Notification */}
            {createError && <div className={styles.alertError} style={{ margin: "12px 24px 0" }}>{createError}</div>}

            {/* Modal Body */}
            <div className={styles.stitchModalBody}>
              {createModalTab === "group" ? (
                /* TAB: NEW GROUP */
                <div className={styles.stitchFormGroup}>
                  {/* Group Name Input */}
                  <div className={styles.stitchInputSection}>
                    <label className={styles.stitchLabel}>{t("modals.groupNameLabel")}</label>
                    <div className={styles.stitchInputWrapper}>
                      <input
                        type="text"
                        placeholder={t("modals.groupNamePlaceholder")}
                        value={createGroupName}
                        onChange={(e) => setCreateGroupName(e.target.value)}
                        className={styles.stitchInput}
                      />
                      <svg className={styles.stitchInputRightIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                    </div>
                  </div>

                  {/* Group Description Input with Live Character Counter */}
                  <div className={styles.stitchInputSection}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label className={styles.stitchLabel}>{t("modals.groupDescLabel")}</label>
                      <span
                        className={styles.charCounter}
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          color: createGroupDescription.length >= 240 ? "#ff4949" : "var(--color-on-surface-variant)",
                        }}
                      >
                        {createGroupDescription.length} / 255
                      </span>
                    </div>
                    <div className={styles.stitchInputWrapper}>
                      <textarea
                        maxLength={255}
                        placeholder={t("modals.groupDescPlaceholder")}
                        value={createGroupDescription}
                        onChange={(e) => setCreateGroupDescription(e.target.value)}
                        className={styles.stitchTextarea}
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Group Privacy Toggle (Public vs Private/Secret) */}
                  <div className={styles.stitchInputSection}>
                    <label className={styles.stitchLabel}>{t("modals.groupPrivacyLabel")}</label>
                    <div className={styles.privacyToggleGrid}>
                      <button
                        type="button"
                        onClick={() => setCreateGroupIsPublic(true)}
                        className={`${styles.privacyToggleOption} ${createGroupIsPublic ? styles.privacyToggleOptionActive : ""}`}
                      >
                        <span className={styles.privacyIcon}>🌐</span>
                        <div className={styles.privacyInfo}>
                          <div className={styles.privacyTitle}>{t("modals.publicServerTitle")}</div>
                          <div className={styles.privacyDesc}>{t("modals.publicServerDesc")}</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCreateGroupIsPublic(false)}
                        className={`${styles.privacyToggleOption} ${!createGroupIsPublic ? styles.privacyToggleOptionActive : ""}`}
                      >
                        <span className={styles.privacyIcon}>🔒</span>
                        <div className={styles.privacyInfo}>
                          <div className={styles.privacyTitle}>{t("modals.privateGroupTitle")}</div>
                          <div className={styles.privacyDesc}>{t("modals.privateGroupDesc")}</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Group Category Picker */}
                  <div className={styles.stitchInputSection}>
                    <label className={styles.stitchLabel}>{t("modals.categoryLabel")}</label>
                    <div className={styles.stitchCategorySelectGrid}>
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCreateGroupCategory(cat)}
                          className={`${styles.stitchCatSelectChip} ${createGroupCategory === cat ? styles.stitchCatSelectChipActive : ""}`}
                        >
                          <span>{CATEGORY_EMOJIS[cat] || "🏷️"}</span>
                          <span>{t(`categories.${cat}`, cat)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Add Members Section */}
                  <div className={styles.stitchInputSection}>
                    <label className={styles.stitchLabel}>{t("modals.addMembersLabel")}</label>

                    {/* Selected Members Removable Chips */}
                    {selectedUsers.length > 0 && (
                      <div className={styles.selectedMembersChipContainer}>
                        {selectedUsers.map((su) => (
                          <button
                            key={su.id}
                            type="button"
                            onClick={() => setSelectedUsers(selectedUsers.filter((u) => u.id !== su.id))}
                            className={styles.selectedMemberChip}
                            title="Click to remove member"
                          >
                            <span>{su.username}</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className={styles.stitchInputWrapper}>
                      <svg className={styles.stitchInputLeftIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                      <input
                        type="text"
                        placeholder={t("modals.searchMemberPlaceholder")}
                        value={userSearchQuery}
                        onChange={(e) => handleSearchUsers(e.target.value)}
                        className={`${styles.stitchInput} ${styles.stitchInputWithLeftIcon}`}
                      />
                    </div>

                    {/* Member Selection List */}
                    <div className={styles.stitchUserList}>
                      {searchedUsers.length > 0 ? (
                        searchedUsers.map((u) => {
                          const isSelected = selectedUsers.some((su) => su.id === u.id);
                          return (
                            <div
                              key={u.id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedUsers(selectedUsers.filter((su) => su.id !== u.id));
                                } else {
                                  setSelectedUsers([...selectedUsers, u]);
                                }
                              }}
                              className={`${styles.stitchUserRow} ${isSelected ? styles.stitchUserRowSelected : ""}`}
                            >
                              <div className={styles.stitchAvatarBox}>
                                <div className={styles.stitchAvatarPlaceholder}>
                                  {u.username ? u.username.substring(0, 2).toUpperCase() : "U"}
                                </div>
                                <span className={`${styles.statusDot} ${styles.statusOnline}`}></span>
                              </div>

                              <div className={styles.stitchUserInfo}>
                                <div className={styles.stitchUserName}>{u.username}</div>
                                <div className={styles.stitchUserRole}>{u.email}</div>
                              </div>

                              <div className={`${styles.stitchCheckbox} ${isSelected ? styles.stitchCheckboxChecked : ""}`}>
                                {isSelected && (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ padding: "12px", color: "var(--color-on-surface-variant)", fontSize: "0.8rem", textAlign: "center" }}>
                          {t("modals.typeToSearchMembers")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* TAB: DIRECT MESSAGE */
                <div className={styles.stitchFormGroup}>
                  <div className={styles.stitchInputSection}>
                    <label className={styles.stitchLabel}>{t("modals.findUserLabel")}</label>
                    <div className={styles.stitchInputWrapper}>
                      <svg className={styles.stitchInputLeftIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <input
                        type="text"
                        placeholder={t("modals.typeToStartChatting")}
                        value={userSearchQuery}
                        onChange={(e) => handleSearchUsers(e.target.value)}
                        className={`${styles.stitchInput} ${styles.stitchInputWithLeftIcon}`}
                      />
                    </div>

                    <div className={styles.stitchUserList} style={{ marginTop: "12px" }}>
                      {searchedUsers.map((u) => {
                        const isSelected = selectedDmUser?.id === u.id;
                        return (
                          <div
                            key={u.id}
                            onClick={() => setSelectedDmUser(u)}
                            className={`${styles.stitchUserRow} ${isSelected ? styles.stitchUserRowSelected : ""}`}
                          >
                            <div className={styles.stitchAvatarBox}>
                              <div className={styles.stitchAvatarPlaceholder}>
                                {u.username ? u.username.substring(0, 2).toUpperCase() : "U"}
                              </div>
                              <span className={`${styles.statusDot} ${styles.statusOnline}`}></span>
                            </div>

                            <div className={styles.stitchUserInfo}>
                              <div className={styles.stitchUserName}>{u.username}</div>
                              <div className={styles.stitchUserRole}>{u.email}</div>
                            </div>

                            <div className={`${styles.stitchCheckbox} ${isSelected ? styles.stitchCheckboxChecked : ""}`}>
                              {isSelected && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className={styles.stitchModalFooter}>
              <button
                type="button"
                className={styles.stitchCancelBtn}
                onClick={() => setShowCreateModal(false)}
              >
                {t("modals.cancelBtn")}
              </button>
              <button
                type="button"
                disabled={createLoading}
                className={styles.stitchSubmitBtn}
                onClick={handleCreateConversation}
              >
                {createLoading ? t("modals.creatingBtn") : createModalTab === "group" ? t("modals.createGroupBtn") : t("modals.startChatBtn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedProfile && (
        <div className={styles.modalOverlay} onClick={() => setSelectedProfile(null)}>
          <div className={styles.profileModal} onClick={(event) => event.stopPropagation()}>
            <button className={styles.modalCloseBtn} onClick={() => setSelectedProfile(null)} aria-label="Close profile">×</button>
            <div className={styles.profileModalBanner}></div>
            <div className={styles.profileModalAvatar}>{selectedProfile.username.charAt(0).toUpperCase()}</div>
            <div className={styles.profileModalContent}>
              <h2>{selectedProfile.username}</h2>
              <p className={styles.profileHandle}>@{selectedProfile.username}</p>
              
              {/* Online Status Pill */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", margin: "6px 0 10px", padding: "4px 10px", background: "rgba(255,255,255,0.05)", borderRadius: "12px", border: "1px solid var(--color-border-subtle)", fontSize: "0.75rem", fontWeight: 600 }}>
                <span className={`${styles.statusDot} ${selectedProfile.id && onlineUserIds.has(selectedProfile.id) ? styles.statusOnline : styles.statusOffline}`}></span>
                <span style={{ color: selectedProfile.id && onlineUserIds.has(selectedProfile.id) ? "#4ade80" : "var(--color-on-surface-variant)" }}>
                  {selectedProfile.id && onlineUserIds.has(selectedProfile.id) ? t("common.online") : t("common.offline")}
                </span>
              </div>

              {/* Biography Section */}
              <div style={{ margin: "10px 0", textAlign: "center", padding: "10px 14px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", border: "1px solid var(--color-border-subtle)" }}>
                <p style={{ fontSize: "0.83rem", color: "var(--color-on-surface-variant)", fontStyle: "italic", margin: 0 }}>
                  "{selectedProfile.bio || "Hey there! I am using Vibe Connect."}"
                </p>
              </div>

              {profileModalLoading ? <p className={styles.profileMeta}>Profil yükleniyor…</p> : (
                <p className={styles.profileMeta}>{selectedProfile.created_at ? `${t("modals.joinedDatePrefix")}${new Date(selectedProfile.created_at).toLocaleDateString("tr-TR")}` : t("modals.defaultMemberMeta")}</p>
              )}
              {profileModalError && <p className={styles.profileError}>{profileModalError}</p>}
              {selectedProfile.id && selectedProfile.id !== user?.id && (
                <button className={styles.profileDmButton} disabled={startingDm} onClick={() => startDirectMessage(selectedProfile)}>
                  {startingDm ? t("modals.preparingChat") : t("modals.sendMessageBtn")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", color: "#c084fc" }}>Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
