import React, { useState, useEffect, useRef } from "react";
import { 
  Film, 
  Calendar, 
  MapPin, 
  Clock, 
  Tv, 
  Compass, 
  Award, 
  CheckCircle, 
  X, 
  User as UserIcon, 
  Lock, 
  Play, 
  ArrowRight, 
  Check, 
  AlertTriangle, 
  Trash2, 
  Plus, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Percent, 
  QrCode, 
  FileText, 
  Info,
  ChevronRight,
  Upload,
  ShieldCheck
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import Header from "./components/Header";
import { Movie, Theater, Showtime, Booking, User, RealtimeStateResponse } from "./types";

interface Message {
  type: 'success' | 'error';
  text: string;
}

export default function App() {
  // Navigation & User session states
  const [activeView, setActiveView] = useState<'home' | 'movies' | 'schedules' | 'dashboard' | 'admin'>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>("");

  // Data states
  const [movies, setMovies] = useState<Movie[]>([]);
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  
  // Filtering states
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [movieStatusFilter, setMovieStatusFilter] = useState<'now-showing' | 'coming-soon'>('now-showing');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTheaterFilter, setSelectedTheaterFilter] = useState<string>("all");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("2026-06-08");

  // Booking states
  const [bookingShowtime, setBookingShowtime] = useState<Showtime | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [seatingState, setSeatingState] = useState<{
    bookedSeats: string[];
    lockedSeats: { [seatId: string]: string };
    lockExpires: { [seatId: string]: number };
  }>({
    bookedSeats: [],
    lockedSeats: {},
    lockExpires: {}
  });
  const [lockTimer, setLockTimer] = useState<string | null>(null);
  const [lockExpiryTime, setLockExpiryTime] = useState<number | null>(null);

  // Authentication Dialog state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");

  // Trailer visual modal state
  const [trailerVideoUrl, setTrailerVideoUrl] = useState<string | null>(null);

  // Notification Banner
  const [globalMessage, setGlobalMessage] = useState<Message | null>(null);

  // Admin section forms & reports state
  const [adminReports, setAdminReports] = useState<any>(null);
  const [adminBookings, setAdminBookings] = useState<Booking[]>([]);
  const [tabAdminSection, setTabAdminSection] = useState<'reports' | 'movies' | 'schedules' | 'bookings'>('reports');
  
  // Admin movie schema form
  const [newMovieTitle, setNewMovieTitle] = useState("");
  const [newMovieDesc, setNewMovieDesc] = useState("");
  const [newMovieGenre, setNewMovieGenre] = useState("");
  const [newMovieRating, setNewMovieRating] = useState("PG-13");
  const [newMovieDuration, setNewMovieDuration] = useState(130);
  const [newMoviePoster, setNewMoviePoster] = useState("");
  const [newMovieBackdrop, setNewMovieBackdrop] = useState("");
  const [newMovieTrailer, setNewMovieTrailer] = useState("");
  const [newMovieCast, setNewMovieCast] = useState("");
  const [newMovieDirector, setNewMovieDirector] = useState("");
  const [newMovieStatus, setNewMovieStatus] = useState<'now-showing' | 'coming-soon'>('now-showing');

  // Interactive drop zone for simulated visual assets upload
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Showtime creator form state
  const [newShowMovieId, setNewShowMovieId] = useState("");
  const [newShowTheaterId, setNewShowTheaterId] = useState("");
  const [newShowScreen, setNewShowScreen] = useState("");
  const [newShowTime, setNewShowTime] = useState("18:30");
  const [newShowDate, setNewShowDate] = useState("2026-06-08");
  const [newShowPrice, setNewShowPrice] = useState(24.00);

  // Temporary local state for user ticket view
  const [myBookings, setMyBookings] = useState<Booking[]>([]);

  // Timer intervals
  let countdownRef = useRef<NodeJS.Timeout | null>(null);
  let seatRefreshRef = useRef<NodeJS.Timeout | null>(null);

  // Toast notifier helper
  const triggerToast = (text: string, type: 'success' | 'error' = 'success') => {
    setGlobalMessage({ text, type });
    setTimeout(() => setGlobalMessage(null), 5000);
  };

  // Setup initial token / user cache on start
  useEffect(() => {
    const savedToken = localStorage.getItem("imax_token");
    const savedUser = localStorage.getItem("imax_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setCurrentUser(JSON.parse(savedUser));
    }

    // Load initial data
    loadCatalog();
  }, []);

  // Fetch movies, theaters, showtimes
  const loadCatalog = async () => {
    try {
      const mRes = await fetch("/api/movies");
      const sMovies = await mRes.json();
      setMovies(sMovies);

      const tRes = await fetch("/api/theaters");
      const sTheaters = await tRes.json();
      setTheaters(sTheaters);

      const stRes = await fetch("/api/showtimes");
      const sShowtimes = await stRes.json();
      setShowtimes(sShowtimes);
    } catch (e) {
      console.error("Failed to fetch initial library assets.", e);
    }
  };

  // Re-fetch user specific bookings
  const loadUserBookings = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/bookings", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const list = await res.json();
        setMyBookings(list);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Polling bookings on active user dashboard view
  useEffect(() => {
    if (currentUser) {
      loadUserBookings();
    }
  }, [currentUser, activeView]);

  // Load Admin Reports
  const loadAdminReports = async () => {
    if (!currentUser?.isAdmin) return;
    try {
      const tHeader = { "Authorization": `Bearer ${token}` };
      const repRes = await fetch("/api/admin/reports", { headers: tHeader });
      const booksRes = await fetch("/api/bookings", { headers: tHeader });
      if (repRes.ok && booksRes.ok) {
        setAdminReports(await repRes.json());
        setAdminBookings(await booksRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Polling admin reports when admin view changes
  useEffect(() => {
    if (activeView === 'admin' && currentUser?.isAdmin) {
      loadAdminReports();
    }
  }, [activeView, tabAdminSection]);

  // Timer counter calculations for locked tickets checkout duration
  useEffect(() => {
    if (lockExpiryTime) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      
      countdownRef.current = setInterval(() => {
        const remaining = lockExpiryTime - Date.now();
        if (remaining <= 0) {
          setLockTimer(null);
          setLockExpiryTime(null);
          setSelectedSeats([]);
          triggerToast("Booking window expired. Your seats have been unlocked.", "error");
          if (bookingShowtime) {
            refreshSeatsState(bookingShowtime.id);
          }
          if (countdownRef.current) clearInterval(countdownRef.current);
        } else {
          const mins = Math.floor(remaining / 60000);
          const secs = Math.floor((remaining % 60000) / 1000);
          setLockTimer(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        }
      }, 1000);
    } else {
      setLockTimer(null);
      if (countdownRef.current) clearInterval(countdownRef.current);
    }

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [lockExpiryTime, bookingShowtime]);

  // Seat polling while seating chart or booking is open
  const refreshSeatsState = async (showtimeId: string) => {
    try {
      const res = await fetch(`/api/showtime-seats/${showtimeId}`);
      if (res.ok) {
        const data: RealtimeStateResponse = await res.ok ? await res.json() : null;
        if (data) {
          setSeatingState({
            bookedSeats: data.bookedSeats,
            lockedSeats: data.lockedSeats,
            lockExpires: data.lockExpires
          });
        }
      }
    } catch (e) {
      console.error("Failed to synchronously retrieve real-time lock schema", e);
    }
  };

  useEffect(() => {
    if (bookingShowtime) {
      refreshSeatsState(bookingShowtime.id);
      
      if (seatRefreshRef.current) clearInterval(seatRefreshRef.current);
      seatRefreshRef.current = setInterval(() => {
        refreshSeatsState(bookingShowtime.id);
      }, 5000); // Poll lock state every 5 seconds
    } else {
      if (seatRefreshRef.current) clearInterval(seatRefreshRef.current);
    }

    return () => {
      if (seatRefreshRef.current) clearInterval(seatRefreshRef.current);
    };
  }, [bookingShowtime]);

  // Handle Authentication submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword || (authMode === 'register' && !authName)) {
      triggerToast("Please provide all required credentials.", "error");
      return;
    }

    try {
      const url = authMode === 'login' ? "/api/auth/login" : "/api/auth/register";
      const payload = authMode === 'login' 
        ? { email: authEmail, password: authPassword }
        : { email: authEmail, name: authName, password: authPassword };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        triggerToast(data.error || "Authentication procedure failed.", "error");
        return;
      }

      // Success
      localStorage.setItem("imax_token", data.token);
      localStorage.setItem("imax_user", JSON.stringify(data.user));
      setToken(data.token);
      setCurrentUser(data.user);
      setAuthModalOpen(false);
      triggerToast(`Welcome back, ${data.user.name}! Enjoy IMAX quality audio and vision.`);
      
      // Clear forms
      setAuthEmail("");
      setAuthPassword("");
      setAuthName("");
    } catch (e) {
      triggerToast("Network link timed out.", "error");
    }
  };

  // Log user out
  const handleLogout = () => {
    localStorage.removeItem("imax_token");
    localStorage.removeItem("imax_user");
    setToken("");
    setCurrentUser(null);
    setSelectedSeats([]);
    setBookingShowtime(null);
    setLockExpiryTime(null);
    setActiveView('home');
    triggerToast("Your theater profile has been disconnected.");
  };

  // Launch seat selector view
  const initiateBookingFlow = (showtime: Showtime) => {
    if (!currentUser) {
      setAuthMode('login');
      setAuthModalOpen(true);
      triggerToast("You must initialize a guest profile in order to choose seat reservations.", "error");
      return;
    }
    setBookingShowtime(showtime);
    setSelectedSeats([]);
    setLockExpiryTime(null);
    setActiveView('schedules'); // Seats selection resides on schedules/booking panel
  };

  // Toggle seat selection with real-time locks
  const handleSeatClick = async (seatId: string) => {
    if (!bookingShowtime || !currentUser) return;

    // Reject if already sold
    if (seatingState.bookedSeats.includes(seatId)) {
      triggerToast("This individual seat has been purchased and finalized.", "error");
      return;
    }

    // Reject if locked by someone else
    const lockOwner = seatingState.lockedSeats[seatId];
    const isOwnerMe = lockOwner === currentUser.id;
    if (lockOwner && !isOwnerMe) {
      triggerToast("This seat is currently held under temporary reservation.", "error");
      return;
    }

    let nextSeats = [...selectedSeats];
    if (nextSeats.includes(seatId)) {
      nextSeats = nextSeats.filter(s => s !== seatId);
    } else {
      // Limit to max 6 reservations
      if (nextSeats.length >= 6) {
        triggerToast("Maximum of 6 tickets can be reserved per sequence.", "error");
        return;
      }
      nextSeats.push(seatId);
    }

    setSelectedSeats(nextSeats);

    // Call locks API to lock these seats for the user
    if (nextSeats.length > 0) {
      try {
        const res = await fetch("/api/seats/lock", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            showtimeId: bookingShowtime.id,
            seats: nextSeats
          })
        });

        const data = await res.json();
        if (res.ok) {
          setLockExpiryTime(data.lockExpiry);
          refreshSeatsState(bookingShowtime.id);
        } else {
          // Sync issue or locked by someone else
          triggerToast(data.error || "Lock sync failed. Please re-select.", "error");
          setSelectedSeats([]);
        }
      } catch (err) {
        console.error("Lock error", err);
      }
    } else {
      // Unlocked everything
      try {
        await fetch("/api/seats/unlock", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ showtimeId: bookingShowtime.id })
        });
        setLockExpiryTime(null);
        refreshSeatsState(bookingShowtime.id);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Finalize booking transaction
  const handlePurchaseSubmit = async () => {
    if (!bookingShowtime || selectedSeats.length === 0) return;

    const priceSum = calculateTotalCost();

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          showtimeId: bookingShowtime.id,
          seats: selectedSeats,
          totalPrice: priceSum
        })
      });

      const data = await res.json();
      if (!res.ok) {
        triggerToast(data.error || "Error during purchase validation. Seats may have expired.", "error");
        return;
      }

      // Success
      triggerToast(`Grand VIP reservation success! Built digital pass. Earned +${data.earnedPoints} IMAX Reward points!`);
      
      // Update local profile points
      if (currentUser) {
        const copy = { ...currentUser, membershipPoints: data.newTotalPoints };
        setCurrentUser(copy);
        localStorage.setItem("imax_user", JSON.stringify(copy));
      }

      // Clear states
      setSelectedSeats([]);
      setBookingShowtime(null);
      setLockExpiryTime(null);
      
      // Redirect to Dashboard
      setActiveView('dashboard');
    } catch (e) {
      triggerToast("Database process failure. Please check server logs.", "error");
    }
  };

  // Cancel order
  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this IMAX booking? Deducted points will be adjusted.")) return;

    try {
      const res = await fetch(`/api/bookings/cancel/${bookingId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) {
        triggerToast(data.error || "Failed to cancel booking", "error");
        return;
      }

      triggerToast("Booking cancelled. Refunding balance process complete.");
      
      // Update local user points
      if (currentUser) {
        const copy = { ...currentUser, membershipPoints: data.newTotalPoints };
        setCurrentUser(copy);
        localStorage.setItem("imax_user", JSON.stringify(copy));
      }

      loadUserBookings();
      if (currentUser?.isAdmin) {
        loadAdminReports();
      }
    } catch (e) {
      triggerToast("Error communicating with servers.", "error");
    }
  };

  // Admin: Add Movie Action
  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMovieTitle || !newMovieDesc || !newMoviePoster) {
      triggerToast("Please provide movie title, overview and cover poster URL.", "error");
      return;
    }

    try {
      const res = await fetch("/api/movies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newMovieTitle,
          description: newMovieDesc,
          posterUrl: newMoviePoster,
          backdropUrl: newMovieBackdrop,
          rating: newMovieRating,
          duration: newMovieDuration,
          genre: newMovieGenre.split(',').map(g => g.trim()),
          trailerUrl: newMovieTrailer,
          status: newMovieStatus,
          cast: newMovieCast.split(',').map(c => c.trim()),
          director: newMovieDirector
        })
      });

      if (res.ok) {
        triggerToast(`"${newMovieTitle}" cataloged successfully into IMAX archive.`);
        loadCatalog();
        // Reset form
        setNewMovieTitle("");
        setNewMovieDesc("");
        setNewMoviePoster("");
        setNewMovieBackdrop("");
        setNewMovieTrailer("");
        setNewMovieCast("");
        setNewMovieDirector("");
      } else {
        const err = await res.json();
        triggerToast(err.error || "Failed to save movie.", "error");
      }
    } catch (e) {
      triggerToast("Database interaction error.", "error");
    }
  };

  // Admin: Delete Movie Action
  const handleDeleteMovie = async (movieId: string) => {
    if (!confirm("Are you sure you want to drop this movie from database? Users won't find it anymore.")) return;

    try {
      const res = await fetch(`/api/movies/${movieId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        triggerToast("Movie archived");
        loadCatalog();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Admin: Add Showtime Action
  const handleAddShowtime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShowMovieId || !newShowTheaterId || !newShowScreen || !newShowTime || !newShowDate || !newShowPrice) {
      triggerToast("All scheduling slots must be defined.", "error");
      return;
    }

    try {
      const res = await fetch("/api/showtimes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          movieId: newShowMovieId,
          theaterId: newShowTheaterId,
          screenName: newShowScreen,
          time: newShowTime,
          date: newShowDate,
          price: newShowPrice
        })
      });

      if (res.ok) {
        triggerToast("New IMAX session successfully populated into theater systems.");
        loadCatalog();
        setNewShowScreen("");
      } else {
        const err = await res.json();
        triggerToast(err.error || "Scheduling conflict generated.", "error");
      }
    } catch (e) {
      triggerToast("Error.", "error");
    }
  };

  // Admin: Delete Showtime Action
  const handleDeleteShowtime = async (id: string) => {
    if (!confirm("Delete and pull this showtime scheduled sequence?")) return;
    try {
      const res = await fetch(`/api/showtimes/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        triggerToast("Session deleted.");
        loadCatalog();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Drag & drop handlers for visual mock upload assets feature support
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      // Simulate file upload setting poster URI
      const dummyUrl = `https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop&sig=${Math.floor(Math.random() * 1000)}`;
      setNewMoviePoster(dummyUrl);
      triggerToast(`Accepted local draft asset: "${file.name}". Simulated hosting path set.`);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const dummyUrl = `https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop&sig=${Math.floor(Math.random() * 1000)}`;
      setNewMoviePoster(dummyUrl);
      triggerToast(`Uploaded image Asset: "${file.name}"`);
    }
  };

  // Seating configuration and pricing matrix helpers
  const getSeatCategory = (row: string): { type: string; priceMultiplier: number; label: string; color: string } => {
    if (["A", "B", "C", "D"].includes(row)) {
      return { type: 'standard', priceMultiplier: 1.0, label: "Standard Rows (A-D)", color: "border-sky-500 text-sky-400" };
    } else if (["E", "F", "G", "H"].includes(row)) {
      return { type: 'premium', priceMultiplier: 1.25, label: "Premium Elite (E-H)", color: "border-[var(--color-imax-gold)] text-[var(--color-imax-gold)]" };
    } else {
      return { type: 'vip', priceMultiplier: 1.5, label: "VIP Loungers (I-J)", color: "border-[var(--color-imax-cyan)] text-[var(--color-imax-cyan)]" };
    }
  };

  const calculateTotalCost = (): number => {
    if (!bookingShowtime || selectedSeats.length === 0) return 0;
    const base = bookingShowtime.price;
    return selectedSeats.reduce((sum, seatId) => {
      const row = seatId.charAt(0);
      const cat = getSeatCategory(row);
      return sum + (base * cat.priceMultiplier);
    }, 0);
  };

  // Helper arrays for theater seats structure grid
  const seatRows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  const seatCols = Array.from({ length: 14 }, (_, i) => i + 1);

  // Filter helper results
  const filteredMovies = movies.filter(m => {
    const matchStatus = m.status === movieStatusFilter;
    const matchSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        m.genre.some(g => g.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        m.director.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const getSchedulesForSelection = (): Showtime[] => {
    return showtimes.filter(s => {
      const matchTheater = selectedTheaterFilter === "all" || s.theaterId === selectedTheaterFilter;
      const matchDate = s.date === selectedDateFilter;
      return matchTheater && matchDate;
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white relative flex flex-col font-sans overflow-x-hidden selection:bg-[var(--color-imax-cyan)] selection:text-black">
      {/* Immersive radial mesh gradients background */}
      <div className="fixed inset-0 mesh-bg pointer-events-none z-0" />

      {/* Global Toast Message Indicator */}
      {globalMessage && (
        <div 
          onClick={() => setGlobalMessage(null)}
          className={`fixed top-20 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-2xl transition-all duration-300 cursor-pointer animate-fade-in ${
            globalMessage.type === 'success' 
              ? 'glass border-emerald-500/40 bg-emerald-950/80 text-emerald-200' 
              : 'glass border-rose-500/40 bg-rose-950/80 text-rose-200'
          }`}
          id="global-toast-banner"
        >
          {globalMessage.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
          )}
          <p className="text-sm font-medium tracking-wide">{globalMessage.text}</p>
        </div>
      )}

      {/* Embedded Trailer Video Backdrop Modal */}
      {trailerVideoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
          <div className="relative w-full max-w-4xl glass border border-white/10 rounded-2xl overflow-hidden aspect-video shadow-[0_0_50px_rgba(0,174,239,0.3)]">
            <button 
              onClick={() => setTrailerVideoUrl(null)}
              className="absolute top-4 right-4 z-10 rounded-full p-2 bg-black/70 border border-white/20 text-white hover:bg-white/10 hover:text-rose-500 transition-all pointer-events-auto cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <iframe 
              src={trailerVideoUrl} 
              title="IMAX Official Trailer Player"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      {/* Application Header Navigation */}
      <Header 
        currentUser={currentUser}
        onNavigate={(v) => {
          setBookingShowtime(null); // Clear active checkout state upon menu navigate
          setSelectedSeats([]);
          setActiveView(v);
        }}
        activeView={activeView === 'schedules' && bookingShowtime ? 'schedules' : activeView}
        onOpenAuth={() => {
          setAuthMode('login');
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Core Dynamic Content Frame */}
      <main className="flex-1 relative z-10 z-index:1 flex flex-col justify-between">
        
        {/* VIEW 1: HOME PAGE (DEFAULT) */}
        {activeView === 'home' && (
          <div className="flex-1" id="view-section-home">
            
            {/* IMAX EXCLUSIVE HERO BANNER */}
            <section className="relative w-full min-h-[500px] md:min-h-[620px] flex items-center justify-start py-12 px-6 sm:px-12 lg:px-20 overflow-hidden">
              {/* Backsplash image background */}
              <div className="absolute inset-0 z-0">
                <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1547483238-f400e65ccd56?q=80&w=1200')] bg-cover bg-center opacity-40"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050505] to-transparent"></div>
              </div>

              {/* Glowing laser representative beam across the bottom of screen */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] imax-laser-beam"></div>

              <div className="relative z-10 max-w-2xl flex flex-col items-start gap-4" id="home-hero-text">
                <span className="px-3.5 py-1.5 glass rounded-full text-xs font-bold tracking-[0.2em] text-[var(--color-imax-cyan)] border-[var(--color-imax-cyan)]/30 uppercase inline-flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-imax-cyan)]"></span>
                  EXPERIENCE RECORD IN IMAX LASER
                </span>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-none font-display text-white">
                  DUNE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-imax-cyan)] to-[var(--color-imax-blue)]">PART TWO</span>
                </h1>
                
                <p className="text-sm md:text-base text-gray-300 leading-relaxed max-w-lg">
                  Experience Denis Villeneuve's masterpiece in the taller 1.43:1 expanded aspect ratio, engineered exclusively for custom 70mm analog film formats and dual laser visual projection systems.
                </p>

                <div className="flex flex-wrap gap-4 mt-4">
                  <button 
                    onClick={() => {
                      const dune = movies.find(m => m.id === "m-dune-2");
                      if (dune) setSelectedMovie(dune);
                      setActiveView('movies');
                    }}
                    className="imax-gradient px-7 py-3.5 rounded-xl font-bold text-sm tracking-wide text-black hover:brightness-110 active:scale-95 shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center gap-2 duration-150"
                  >
                    Watch Trailer & Info
                    <Play className="h-4 w-4 fill-black text-black" />
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedTheaterFilter("all");
                      setSelectedDateFilter("2026-06-08");
                      setActiveView('schedules');
                    }}
                    className="glass hover:bg-white/10 px-7 py-3.5 rounded-xl font-bold text-sm tracking-wide border-white/20 hover:border-white/40 cursor-pointer flex items-center gap-2 transition-all duration-150"
                  >
                    Quick Timetable
                    <Calendar className="h-4 w-4 text-[var(--color-imax-cyan)]" />
                  </button>
                </div>
              </div>
            </section>

            {/* CURATED CATEGORY ROW INDEX */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              
              {/* STATUS PICKER */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-white/5 pb-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
                    IMAX Screenings Selection
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">Experience physical sound mechanics with our customized spatial layout</p>
                </div>

                <div className="flex overflow-hidden rounded-xl border border-white/10 p-1 bg-white/5 font-medium" id="home-filter-toggles">
                  <button 
                    onClick={() => setMovieStatusFilter('now-showing')}
                    className={`px-4 py-2 text-xs rounded-lg transition-all ${
                      movieStatusFilter === 'now-showing' 
                        ? 'bg-[var(--color-imax-blue)] text-black font-semibold' 
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Currently Screening
                  </button>
                  <button 
                    onClick={() => setMovieStatusFilter('coming-soon')}
                    className={`px-4 py-2 text-xs rounded-lg transition-all ${
                      movieStatusFilter === 'coming-soon' 
                        ? 'bg-[var(--color-imax-blue)] text-black font-semibold' 
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Coming Soon
                  </button>
                </div>
              </div>

              {/* MOVIES COLLECTION GRID */}
              {filteredMovies.length === 0 ? (
                <div className="glass p-12 text-center rounded-2xl border-white/5">
                  <Film className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-300 font-medium">No movies found matching status.</p>
                  <p className="text-xs text-zinc-500 mt-1">Please try modifying filters or search query above.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="home-movies-grid">
                  {filteredMovies.map(movie => {
                    // Collect showtimes for this show
                    const movieShows = showtimes.filter(s => s.movieId === movie.id);

                    return (
                      <div 
                        key={movie.id}
                        className="group glass p-4 rounded-2xl border-white/5 hover:border-[var(--color-imax-border)] hover:bg-white/10 transition-all duration-300 flex flex-col justify-between"
                      >
                        <div>
                          {/* Poster frame with curve design */}
                          <div className="relative aspect-video sm:aspect-[16/10] overflow-hidden rounded-xl mb-4 bg-zinc-900 border border-white/5">
                            <img 
                              src={movie.posterUrl} 
                              alt={movie.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                            
                            {/* Tags */}
                            <span className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10 text-[10px] font-bold text-[var(--color-imax-cyan)] uppercase mono">
                              {movie.rating}
                            </span>

                            <span className="absolute bottom-3 right-3 text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-[var(--color-imax-cyan)]" />
                              {movie.duration} min
                            </span>
                          </div>

                          {/* Movie metadata */}
                          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                            {movie.genre.map((g, i) => (
                              <span key={i} className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-zinc-400">
                                {g}
                              </span>
                            ))}
                          </div>

                          <h3 className="font-display font-medium text-lg text-white line-clamp-1 group-hover:text-[var(--color-imax-cyan)] transition-colors">
                            {movie.title}
                          </h3>

                          <p className="text-xs text-zinc-400 mb-4 line-clamp-2 mt-1 leading-relaxed">
                            {movie.description}
                          </p>
                        </div>

                        {/* Interactive trigger strip */}
                        <div className="border-t border-white/5 pt-4">
                          {movie.status === 'now-showing' ? (
                            <div className="flex items-center justify-between gap-2">
                              {/* Inline mini quick pick schedule indicator */}
                              <div className="text-zinc-500 text-[10px]">
                                {movieShows.length > 0 ? (
                                  <span className="text-[var(--color-imax-cyan)] font-mono">{movieShows.length} sessions active</span>
                                ) : (
                                  <span>No current dates</span>
                                )}
                              </div>
                              <button 
                                onClick={() => {
                                  setSelectedMovie(movie);
                                  setActiveView('movies');
                                }}
                                className="px-4 py-2 bg-[var(--color-imax-blue)]/10 hover:bg-[var(--color-imax-blue)] text-[var(--color-imax-blue)] hover:text-black font-semibold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1"
                              >
                                Ticket Options
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-zinc-500 text-xs py-1">
                              <span className="text-zinc-500">Scheduled Launch Incoming</span>
                              <span className="px-2 py-1 bg-amber-500/10 text-[var(--color-imax-gold)] font-mono text-[9px] uppercase border border-amber-500/20 rounded">
                                Coming Soon
                              </span>
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </section>

            {/* HIGH-FIDELITY IMMERSIVE TECHNOLOGY VALUE PROPOSITION BOX */}
            <section className="bg-gradient-to-b from-[#0c0c11]/80 to-black border-t border-white/5 py-16 px-4">
              <div className="max-w-5xl mx-auto glass p-8 md:p-12 rounded-3xl border-white/10 relative overflow-hidden flex flex-col md:flex-row gap-8 items-center">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full filter blur-3xl pointer-events-none"></div>
                
                <div className="shrink-0 rounded-2xl bg-zinc-950 p-4 border border-white/10 shadow-[0_0_20px_rgba(0,174,239,0.15)] flex items-center justify-center">
                  <Tv className="h-16 w-16 text-[var(--color-imax-cyan)] stroke-[1.5]" />
                </div>

                <div className="space-y-3 text-center md:text-left">
                  <h3 className="font-display font-extrabold text-2xl tracking-tight text-white sm:text-3xl">
                    Why IMAX is the Ultimate Cinematic Format
                  </h3>
                  <p className="text-zinc-300 text-sm leading-relaxed max-w-xl">
                    Our screens are engineered to wrap your peripheral vision. Proprietary laser alignments distribute sub-bass audio frequencies across precise acoustical patterns. It is not just witnessing a film — it is belonging inside the frame.
                  </p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold flex items-center justify-center md:justify-start gap-1">
                    <Check className="h-3 w-3 text-cyan-400" /> Laser Dual Projection | 12-Channel Spatial Sound | High-Frame HFR
                  </p>
                </div>
              </div>
            </section>

          </div>
        )}

        {/* VIEW 2: MOVIES DETAIL PAGE */}
        {activeView === 'movies' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8" id="view-section-movies">
            
            {/* Left Column: Movies Listing or Selected details */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="glass p-5 rounded-2xl border-white/5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-imax-cyan)] mb-4">
                   IMAX Cinema Archive
                </h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {movies.map(m => (
                    <div 
                      key={m.id}
                      onClick={() => {
                        setSelectedMovie(m);
                        setBookingShowtime(null); // Reset booking preview
                        setSelectedSeats([]);
                      }}
                      className={`p-3 rounded-xl cursor-pointer flex gap-3 items-center transition-all ${
                        selectedMovie?.id === m.id 
                          ? 'bg-[var(--color-imax-blue)]/20 border border-[var(--color-imax-blue)]/40' 
                          : 'glass hover:bg-white/5 border border-white/5'
                      }`}
                    >
                      <img 
                        src={m.posterUrl} 
                        alt={m.title}
                        className="w-10 h-14 object-cover rounded-md bg-zinc-800 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-zinc-500 flex items-center gap-1.5 justify-between">
                          <span>{m.rating}</span>
                          <span className="font-mono text-[10px] text-[var(--color-imax-cyan)]">{m.status === 'now-showing' ? 'SCREENING' : 'UPCOMING'}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white truncate">{m.title}</h4>
                        <p className="text-[10px] text-zinc-400 truncate">{m.genre.join(', ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Contact & Info widget */}
              <div className="glass p-5 rounded-2xl border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-zinc-300">
                  <MapPin className="h-4 w-4 text-[var(--color-imax-blue)]" />
                  <span className="text-xs font-semibold">Active IMAX Theatres</span>
                </div>
                <div className="space-y-1 text-zinc-400 text-xs">
                  {theaters.map(the => (
                    <div key={the.id} className="flex items-center justify-between border-b border-white/5 py-1.5 last:border-0">
                      <span>{the.name}</span>
                      <span className="text-[10px] font-mono text-zinc-500">{the.location.split(',')[1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Detailed Overview of selected screen */}
            <div className="lg:col-span-8 flex flex-col">
              {selectedMovie ? (
                <div className="glass p-6 md:p-8 rounded-3xl border-white/5 space-y-6 relative overflow-hidden">
                  
                  {/* Backdrop banner visual */}
                  <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10">
                    <img 
                      src={selectedMovie.backdropUrl || selectedMovie.posterUrl} 
                      alt="" 
                      className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent"></div>
                    
                    {/* Launch Trailer overlay button */}
                    {selectedMovie.trailerUrl && (
                      <button 
                        onClick={() => setTrailerVideoUrl(selectedMovie.trailerUrl)}
                        className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 font-semibold text-xs text-black bg-[var(--color-imax-cyan)] rounded-full hover:brightness-110 active:scale-95 shadow-md shadow-cyan-500/20 cursor-pointer pointer-events-auto transition-all"
                      >
                        <Play className="h-3 w-3 fill-black text-black" />
                        Play Official Trailer
                      </button>
                    )}
                  </div>

                  {/* Header Title Metadata */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded text-xs font-mono">{selectedMovie.rating}</span>
                        <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded text-xs font-mono">{selectedMovie.duration} mins</span>
                        {selectedMovie.genre.map((gen, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-cyan-950/40 text-[var(--color-imax-cyan)] border border-cyan-500/20 rounded text-xs">
                            {gen}
                          </span>
                        ))}
                      </div>

                      <h2 className="text-3xl md:text-4xl font-display font-extrabold text-white mt-2">
                        {selectedMovie.title}
                      </h2>
                      
                      <div className="text-zinc-400 text-xs mt-1">
                        Directed by <span className="text-white hover:underline">{selectedMovie.director}</span>
                      </div>
                    </div>

                    {selectedMovie.status === 'now-showing' && (
                      <button 
                        onClick={() => {
                          setSelectedTheaterFilter("all");
                          setSelectedDateFilter("2026-06-08");
                          setActiveView('schedules'); // Jump straight to booking calendar
                        }}
                        className="imax-gradient py-3.5 px-6 rounded-xl font-bold text-xs tracking-wide text-black hover:scale-102 transition-transform cursor-pointer shadow-lg shadow-cyan-500/20"
                      >
                        Schedule Showtimes
                      </button>
                    )}
                  </div>

                  {/* Synopsis box */}
                  <div className="space-y-2 border-t border-white/5 pt-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-imax-cyan)]">
                      Film Narrative Overview
                    </h3>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      {selectedMovie.description}
                    </p>
                  </div>

                  {/* Cast block */}
                  <div className="space-y-2 border-t border-white/5 pt-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Co-Starring Cast Ensemble
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedMovie.cast.map((actor, idx) => (
                        <span key={idx} className="glass px-3.5 py-1.5 rounded-lg text-xs text-zinc-200 border-white/5">
                          {actor}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Showcase details */}
                  <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
                    <div className="glass p-4 rounded-xl border-white/5 space-y-1">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Director</div>
                      <div className="text-sm font-semibold text-white">{selectedMovie.director}</div>
                    </div>
                    <div className="glass p-4 rounded-xl border-white/5 space-y-1">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Sound Engineered</div>
                      <div className="text-sm font-semibold text-[var(--color-imax-cyan)]">12 CH spatial acoustics</div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="glass p-16 text-center rounded-3xl border-white/5 flex flex-col items-center justify-center h-full space-y-3">
                  <Film className="h-12 w-12 text-zinc-600 animate-pulse" />
                  <div>
                    <h2 className="text-xl font-bold text-white font-display">No movie selected</h2>
                    <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                      Review premium digital poster sheets on the left panel or jump back home to select show times.
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      const duneDef = movies.find(m => m.id === "m-dune-2");
                      if (duneDef) setSelectedMovie(duneDef);
                    }}
                    className="mt-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-zinc-300 border border-white/10"
                  >
                    Load Dune: Part Two
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* VIEW 3: SCHEDULES & SEATS SELECTION (THE CORE FLUID EXPERIENCE) */}
        {activeView === 'schedules' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col gap-8" id="view-section-schedules">
            
            {/* STAGE A: SEATING CHECKOUT MODE CHOOSED */}
            {bookingShowtime ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Seat Matrix grid layout (Left side) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  
                  {/* Seating header details with 5 mins countdown lock reminder */}
                  <div className="glass p-4 rounded-2xl border-white/10 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Real-Time Booking State</div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {movies.find(m => m.id === bookingShowtime.movieId)?.title}
                        <span className="text-xs font-normal text-zinc-400">({bookingShowtime.screenName})</span>
                      </h3>
                      <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-[var(--color-imax-cyan)]" />
                        {theaters.find(t => t.id === bookingShowtime.theaterId)?.name} • {bookingShowtime.time} • {bookingShowtime.date}
                      </p>
                    </div>

                    {/* Safety lock Timer badge */}
                    {lockTimer ? (
                      <div className="bg-amber-500/10 border border-amber-500/30 text-[var(--color-imax-gold)] rounded-xl px-4 py-2 font-mono flex items-center gap-2 text-xs">
                        <Lock className="h-4 w-4 stroke-[2px] animate-pulse" />
                        <div>
                          <div className="text-[10px] uppercase text-zinc-400">Secure timer</div>
                          <span className="font-bold text-sm tracking-widest">{lockTimer}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="glass text-zinc-500 px-4 py-2.5 rounded-xl text-[11px] max-w-[200px] leading-snug">
                        Select an available tile to secure your 5-minute reservation timer.
                      </div>
                    )}
                  </div>

                  {/* Seat matrix grid box */}
                  <div className="glass p-6 md:p-10 rounded-3xl border-white/5 flex flex-col items-center">
                    
                    {/* Curved Screen projection representation glowing element */}
                    <div className="w-full max-w-lg mb-16 text-center select-none">
                      <div className="h-2 w-full bg-cyan-500 rounded-full imax-curve-glow mb-2"></div>
                      <span className="text-[10px] tracking-[0.3em] font-extrabold text-[var(--color-imax-cyan)] uppercase">
                        IMAX 3D CURVED LASER SCREEN
                      </span>
                    </div>

                    {/* SEAT GRID CONTAINER */}
                    <div className="w-full overflow-x-auto py-2 flex items-center justify-center">
                      <div className="grid gap-3 min-w-[550px]" style={{ gridTemplateColumns: `auto repeat(${seatCols.length}, minmax(0, 1fr))` }}>
                        {seatRows.map(row => {
                          const catInfo = getSeatCategory(row);
                          return (
                            <React.Fragment key={row}>
                              {/* Row heading identifier */}
                              <span className="text-zinc-500 text-xs font-bold font-mono flex items-center justify-center w-6">
                                {row}
                              </span>

                              {seatCols.map(col => {
                                const seatId = `${row}${col}`;
                                
                                // State checks
                                const isSold = seatingState.bookedSeats.includes(seatId);
                                const otherLockUser = seatingState.lockedSeats[seatId];
                                const isLockedByMe = otherLockUser === currentUser?.id;
                                const isLockedOther = otherLockUser && !isLockedByMe;
                                
                                const isSelected = selectedSeats.includes(seatId);

                                // Seating state colors
                                let seatBg = "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-sky-500 hover:text-white";
                                if (catInfo.type === 'premium') seatBg = "bg-amber-950/20 border-amber-900/50 text-[var(--color-imax-gold)] hover:border-[var(--color-imax-gold)]";
                                if (catInfo.type === 'vip') seatBg = "bg-cyan-950/20 border-cyan-900/50 text-[var(--color-imax-cyan)] hover:border-[var(--color-imax-cyan)]";
                                
                                if (isSelected) {
                                  seatBg = "bg-sky-500 border-sky-400 text-black font-bold scale-102 ring-2 ring-sky-500/50";
                                } else if (isSold) {
                                  seatBg = "bg-zinc-950 border-zinc-900 text-zinc-700 cursor-not-allowed opacity-40 line-through";
                                } else if (isLockedOther) {
                                  seatBg = "bg-rose-950 border-rose-900 text-rose-500/70 cursor-not-allowed opacity-60";
                                }

                                return (
                                  <button
                                    key={seatId}
                                    id={`seat-tile-${seatId}`}
                                    onClick={() => handleSeatClick(seatId)}
                                    disabled={isSold || isLockedOther}
                                    className={`aspect-square sm:w-8 sm:h-8 rounded-lg border text-[9px] font-mono flex items-center justify-center transition-all cursor-pointer ${seatBg}`}
                                    title={`${seatId} (${catInfo.label})`}
                                  >
                                    {col}
                                  </button>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>

                    {/* SEATING MAP LEGEND KEY */}
                    <div className="flex flex-wrap items-center justify-center gap-6 mt-12 border-t border-white/5 pt-6 w-full text-xs text-zinc-400">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded bg-zinc-800 border border-zinc-700"></span>
                        <span>Available Standard</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded bg-amber-950/60 border border-amber-500/40"></span>
                        <span>Available Premium</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded bg-cyan-950/60 border border-cyan-500/40"></span>
                        <span>Available VIP Lounger</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded bg-sky-500 border border-sky-400"></span>
                        <span className="text-white font-medium">Selected Seats</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded bg-rose-950 border border-rose-900 opacity-60"></span>
                        <span>Locked (Other Guest)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded bg-zinc-950 border border-zinc-900 opacity-40"></span>
                        <span>Sold Out</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Checkout pricing panel (Right side) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  
                  {/* Selected tickets summary panel */}
                  <div className="glass p-6 rounded-2xl border-white/5 space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-[var(--color-imax-cyan)]">
                        Checkout Summary
                      </h4>
                      <button 
                        onClick={() => {
                          setBookingShowtime(null);
                          setSelectedSeats([]);
                        }}
                        className="text-zinc-500 hover:text-white transition-colors text-xs"
                      >
                        Cancel
                      </button>
                    </div>

                    {/* Movie info snippet */}
                    <div className="flex gap-4 items-center">
                      <img 
                        src={movies.find(m => m.id === bookingShowtime.movieId)?.posterUrl} 
                        alt="" 
                        className="w-12 h-16 object-cover bg-zinc-800 rounded-lg shrink-0 border border-white/5"
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate">
                          {movies.find(m => m.id === bookingShowtime.movieId)?.title}
                        </h4>
                        <p className="text-xs text-zinc-400 mt-0.5">{bookingShowtime.screenName}</p>
                        <p className="text-[10px] text-[var(--color-imax-gold)] font-mono">{bookingShowtime.date} @ {bookingShowtime.time}</p>
                      </div>
                    </div>

                    {/* Seats list list */}
                    <div className="border-t border-white/5 pt-4 space-y-2">
                      <h5 className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Reserved Seating Positions</h5>
                      {selectedSeats.length === 0 ? (
                        <p className="text-xs text-zinc-500 italic">Select seat tiles on left auditorium grid...</p>
                      ) : (
                        <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                          {selectedSeats.map(seatId => {
                            const row = seatId.charAt(0);
                            const cat = getSeatCategory(row);
                            const seatPrice = bookingShowtime.price * cat.priceMultiplier;
                            return (
                              <div key={seatId} className="flex items-center justify-between text-xs py-1 hover:bg-white/5 px-2 rounded">
                                <span className="font-bold text-white flex items-center gap-1.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${cat.type === 'standard' ? 'bg-sky-400' : cat.type === 'premium' ? 'bg-amber-400' : 'bg-cyan-400'}`}></span>
                                  Seat {seatId}
                                </span>
                                <span className="text-zinc-400">{cat.label.split(' ')[0]}</span>
                                <span className="font-mono text-white">${seatPrice.toFixed(2)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Fees and rewards */}
                    {selectedSeats.length > 0 && (
                      <div className="border-t border-white/5 pt-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-zinc-400">
                          <span>Loyalty Club Reward Points</span>
                          <span className="text-emerald-400 font-semibold font-mono font-bold">+{selectedSeats.length * 20} PTS</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-snug">
                          Loyalty rewards are instantly added to your dashboard balance upon billing verification.
                        </p>
                      </div>
                    )}

                    {/* Pricing Total block */}
                    <div className="border-t border-white/5 pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-400">Transaction Balance Due</span>
                        <span className="text-2xl font-mono font-extrabold text-white">${calculateTotalCost().toFixed(2)}</span>
                      </div>

                      {/* Payment Checkout button */}
                      <button
                        onClick={handlePurchaseSubmit}
                        disabled={selectedSeats.length === 0}
                        id="payment-checkout-submit"
                        className={`w-full py-3.5 rounded-xl text-xs font-bold cursor-pointer tracking-wider flex items-center justify-center gap-2 transition-all ${
                          selectedSeats.length > 0
                            ? 'imax-gradient text-black hover:brightness-110 active:scale-98 shadow-md shadow-cyan-500/10'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        }`}
                      >
                        <Award className="h-4 w-4" />
                        Pay with Simulated Sandbox Card
                      </button>
                    </div>

                  </div>
                </div>

              </div>
            ) : (
              /* STAGE B: CALENDAR AND SCHEDULE FINDER (DEFAULT) */
              <div className="space-y-8">
                
                {/* Advanced Search & Filtering Box */}
                <div className="glass p-6 rounded-3xl border-white/5 space-y-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold font-display text-white tracking-tight">
                        IMAX Digital Schedules
                      </h2>
                      <p className="text-xs text-zinc-400">Select dates and theaters below to check dual laser projection timetables.</p>
                    </div>

                    {/* Instant Search Bar */}
                    <div className="relative max-w-sm w-full">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400 pointer-events-none">
                        <Compass className="h-4 w-4" />
                      </span>
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search directors, genres, movie titles..." 
                        className="bg-zinc-950/60 border border-white/10 rounded-xl px-9 py-2.5 text-xs w-full focus:outline-none focus:ring-1 ring-cyan-500 text-white placeholder-zinc-500"
                      />
                    </div>
                  </div>

                  {/* Date & Theater Filters Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    
                    {/* Date select picker */}
                    <div className="space-y-1.5 flex flex-col">
                      <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Select Screening Date</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["2026-06-08", "2026-06-09", "2026-06-10"].map(dtStr => {
                          const dateObj = new Date(dtStr);
                          const dayNum = dtStr.split('-')[2];
                          const dayName = dtStr === "2026-06-08" ? "MON" : dtStr === "2026-06-09" ? "TUE" : "WED";
                          
                          return (
                            <div 
                              key={dtStr}
                              onClick={() => setSelectedDateFilter(dtStr)}
                              className={`p-2.5 rounded-xl text-center cursor-pointer border transition-all ${
                                selectedDateFilter === dtStr 
                                  ? 'bg-[var(--color-imax-blue)]/10 border-[var(--color-imax-blue)]/50 text-[var(--color-imax-cyan)]' 
                                  : 'glass hover:bg-white/5 border-white/5 text-zinc-400'
                              }`}
                            >
                              <div className="text-[10px] opacity-60 uppercase font-mono">{dayName}</div>
                              <div className="text-base font-bold">{dayNum}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Theater location selection */}
                    <div className="space-y-1.5 flex flex-col">
                      <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Auditorium Location</label>
                      <div className="grid grid-cols-4 gap-2">
                        <button
                          onClick={() => setSelectedTheaterFilter("all")}
                          className={`p-2 rounded-xl text-xs border truncate font-medium ${
                            selectedTheaterFilter === "all"
                              ? 'bg-[var(--color-imax-blue)]/10 border-[var(--color-imax-blue)] text-[var(--color-imax-cyan)]'
                              : 'glass hover:bg-white/5 border-white/5 text-zinc-300'
                          }`}
                        >
                          All Sites
                        </button>
                        {theaters.map(t => (
                          <button
                            key={t.id}
                            onClick={() => setSelectedTheaterFilter(t.id)}
                            className={`p-2 rounded-xl text-center text-xs border truncate font-medium ${
                              selectedTheaterFilter === t.id
                                ? 'bg-[var(--color-imax-blue)] border-[var(--color-imax-blue)] text-black font-semibold'
                                : 'glass hover:bg-white/5 border-white/5 text-zinc-300'
                            }`}
                            title={t.name}
                          >
                            {t.name.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Schedules grid result */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    Available Show timings list
                  </h3>

                  {getSchedulesForSelection().length === 0 ? (
                    <div className="glass p-12 text-center rounded-2xl border-white/5">
                      <Calendar className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                      <p className="text-zinc-300 font-medium text-sm">No active showtimes scheduled for this search criteria.</p>
                      <p className="text-xs text-zinc-500 mt-1">Please explore alternate date settings.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {/* Unique movies with active timetables inside our lists */}
                      {Array.from(new Set(getSchedulesForSelection().map(s => s.movieId))).map(mId => {
                        const mMovie = movies.find(m => m.id === mId);
                        const movieAudSchedules = getSchedulesForSelection().filter(s => s.movieId === mId);

                        if (!mMovie) return null;

                        return (
                          <div 
                            key={mId}
                            className="glass p-5 rounded-2xl border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row gap-5 items-start md:items-center justify-between"
                          >
                            {/* Film heading info */}
                            <div className="flex gap-4 items-center min-w-0 flex-1">
                              <img 
                                src={mMovie.posterUrl} 
                                alt="" 
                                className="w-12 h-16 object-cover bg-zinc-800 rounded-lg shrink-0 border border-white/5"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="bg-white/5 text-[9px] px-1.5 py-0.5 rounded text-zinc-400 font-mono">{mMovie.rating}</span>
                                  <span className="text-[10px] text-zinc-500">{mMovie.duration} mins</span>
                                </div>
                                <h4 className="text-base font-bold text-white truncate mt-1">{mMovie.title}</h4>
                                <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{mMovie.genre.join(' • ')}</p>
                              </div>
                            </div>

                            {/* Active hours grid buttons */}
                            <div className="flex flex-wrap items-center gap-2 flex-grow-0 shrink-0">
                              {movieAudSchedules.map(show => {
                                const theater = theaters.find(t => t.id === show.theaterId);
                                return (
                                  <button
                                    key={show.id}
                                    onClick={() => initiateBookingFlow(show)}
                                    className="px-4 py-3 bg-white/5 hover:bg-[var(--color-imax-cyan)] hover:text-black border border-white/10 text-white rounded-xl text-center duration-150 cursor-pointer min-w-[100px]"
                                  >
                                    <div className="text-sm font-bold tracking-wide font-mono">{show.time}</div>
                                    <div className="text-[8px] opacity-60 uppercase truncate tracking-tight">{theater?.name.split(' ')[0]}</div>
                                  </button>
                                );
                              })}
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>

              </div>
            )}
            
          </div>
        )}

        {/* VIEW 4: USER DASHBOARD (REWARDS & HISTORIC BOOKINGS) */}
        {activeView === 'dashboard' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in" id="view-section-dashboard">
            
            {/* Left side: Profile card and Loyalty scheme progress */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Profile Card */}
              <div className="glass p-6 rounded-2xl border-white/10 relative overflow-hidden flex flex-col items-center text-center">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full filter blur-2xl pointer-events-none"></div>

                <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-amber-500/30 flex items-center justify-center text-zinc-200 text-xl font-bold mb-3 shadow-lg">
                  <UserIcon className="h-6 w-6 text-[var(--color-imax-gold)]" strokeWidth={1.5} />
                </div>

                <h3 className="text-lg font-bold text-white leading-tight">{currentUser?.name || "Theater guest"}</h3>
                <p className="text-xs text-zinc-400 mt-1">{currentUser?.email || "savitha@imax.com"}</p>

                {/* Membership badge */}
                <div className="mt-4 px-3 py-1 bg-gradient-to-r from-amber-500/10 to-[var(--color-imax-gold)]/20 border border-[var(--color-imax-gold)]/40 rounded-full text-[10px] text-[var(--color-imax-gold)] tracking-widest font-mono font-bold uppercase inline-flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 animate-pulse" />
                  IMAX Prestige Club
                </div>
              </div>

              {/* Rewards Progress tracker block */}
              <div className="glass p-6 rounded-2xl border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400"> club Tier Points</h4>
                  <span className="text-xs text-zinc-500 font-semibold">{currentUser?.membershipPoints || 0} PTS Balance</span>
                </div>

                {/* Segment points visual */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-mono text-zinc-300">
                    <span>Bronze Starter</span>
                    <span>Gold VIP Lounge (500 pts)</span>
                  </div>
                  <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-white/5 p-0.5">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-[var(--color-imax-gold)] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, ((currentUser?.membershipPoints || 0) / 500) * 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-snug">
                    You are exactly <span className="text-white font-bold">{Math.max(0, 500 - (currentUser?.membershipPoints || 0))} pts</span> away from qualifying for complementary elite lounge invitations and digital companion passes!
                  </p>
                </div>
              </div>

              {/* Secure barcode ticket scanner notice */}
              <div className="glass p-5 rounded-2xl border-white/5 flex gap-3 text-zinc-400 text-xs">
                <Info className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  Simply present the dynamic generated pass ticket barcode on your mobile display when entering IMAX custom double-laser barrier terminals.
                </p>
              </div>

            </div>

            {/* Right side: Historic Bookings List */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <h3 className="text-lg font-bold font-display text-white tracking-tight flex items-center justify-between">
                <span>My Saved Theater Tickets</span>
                <span className="text-xs text-zinc-500 font-normal">Active & Cancelled History</span>
              </h3>

              {myBookings.length === 0 ? (
                <div className="glass p-16 text-center rounded-3xl border-white/5 h-full flex flex-col items-center justify-center space-y-3">
                  <Tv className="h-10 w-10 text-zinc-600" />
                  <div>
                    <h4 className="text-base font-bold text-zinc-300">No ticket records found</h4>
                    <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                      Review interactive film listings to schedule your screen time allocation.
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveView('schedules')}
                    className="px-5 py-2.5 bg-[var(--color-imax-blue)] text-black font-semibold text-xs rounded-xl hover:brightness-110 active:scale-95 transition-transform"
                  >
                    Examine Schedules
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myBookings.map(b => {
                    const st = showtimes.find(s => s.id === b.showtimeId);
                    const mv = movies.find(m => m.id === st?.movieId);
                    
                    return (
                      <div 
                        key={b.id}
                        className={`p-5 rounded-2xl border relative overflow-hidden flex flex-col md:flex-row justify-between gap-6 transition-all ${
                          b.status === 'confirmed' 
                            ? 'glass border-white/10 hover:border-white/20' 
                            : 'glass bg-rose-950/20 border-rose-500/10 opacity-70'
                        }`}
                      >
                        {/* Film summary visual (Left) */}
                        <div className="flex gap-4 items-start flex-1 min-w-0">
                          <img 
                            src={mv?.posterUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600"} 
                            alt="" 
                            className="w-14 h-20 object-cover bg-zinc-800 rounded-xl border border-white/10 shrink-0"
                          />
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-zinc-400 font-mono uppercase">
                                ID: {b.id}
                              </span>
                              <span className={`text-[10px] uppercase font-mono tracking-widest font-bold ${b.status === 'confirmed' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                ● {b.status}
                              </span>
                            </div>

                            <h4 className="text-base font-bold text-white truncate">{mv?.title || "Film screening"}</h4>
                            
                            <p className="text-xs text-zinc-300 font-mono">
                              {st?.screenName} • Seat: <strong className="text-white bg-white/10 px-1.5 py-0.5 rounded">{b.seats.join(', ')}</strong>
                            </p>
                            
                            <p className="text-[10px] text-zinc-400">
                              Showtime: {st?.date} @ {st?.time} • Billed: ${b.totalPrice.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Interactive dynamic ticket barcode representation (Right) */}
                        <div className="flex flex-col items-center md:items-end justify-center shrink-0 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 min-w-[150px]">
                          {b.status === 'confirmed' ? (
                            <div className="text-center md:text-right space-y-3">
                              {/* QR simulated visual bar code */}
                              <div className="flex items-center justify-center gap-1.5 p-2 bg-white rounded-lg">
                                <QrCode className="h-10 w-10 text-black stroke-[1.5]" />
                                <div className="text-left font-mono font-bold text-black select-all text-[8px] leading-tight">
                                  <span>IMAX DUAL</span><br/>
                                  <span>SECURE</span><br/>
                                  <span className="opacity-60">{b.id}</span>
                                </div>
                              </div>
                              
                              <button 
                                onClick={() => handleCancelBooking(b.id)}
                                className="text-[10px] font-semibold text-rose-400 hover:text-rose-300 hover:underline cursor-pointer flex items-center justify-center md:justify-end gap-1.5 w-full"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Cancel & Refund
                              </button>
                            </div>
                          ) : (
                            <div className="text-center md:text-right">
                              <span className="text-[11px] text-zinc-500 font-mono">Billed Void</span>
                              <div className="text-zinc-600 text-xs mt-1">Refunding action finished</div>
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>

          </div>
        )}

        {/* VIEW 5: ADMIN/DIRECTOR MANAGEMENT CONSOLE */}
        {activeView === 'admin' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8" id="view-section-admin">
            
            {/* Header / Subtab Selection */}
            <div className="lg:col-span-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
              <div>
                <h2 className="text-2xl font-bold font-display text-white tracking-tight flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-red-400" />
                  IMAX Director Administration Center
                </h2>
                <p className="text-xs text-zinc-400 mt-1">Establish active projections, add film listings and monitor real-time statistics logs.</p>
              </div>

              {/* Sub navigation bar controls */}
              <div className="flex overflow-hidden rounded-xl border border-white/10 p-1 bg-white/5 text-xs font-semibold">
                <button 
                  onClick={() => setTabAdminSection('reports')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    tabAdminSection === 'reports' ? 'bg-red-500/20 text-red-400' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  System KPIs
                </button>
                <button 
                  onClick={() => setTabAdminSection('movies')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    tabAdminSection === 'movies' ? 'bg-red-500/20 text-red-400' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Manage Archives
                </button>
                <button 
                  onClick={() => setTabAdminSection('schedules')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    tabAdminSection === 'schedules' ? 'bg-red-500/20 text-red-400' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Scheduling sessions
                </button>
                <button 
                  onClick={() => setTabAdminSection('bookings')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    tabAdminSection === 'bookings' ? 'bg-red-500/20 text-red-400' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Live Transactions
                </button>
              </div>
            </div>

            {/* Dynamic Admin Sub-sections */}
            {tabAdminSection === 'reports' && adminReports && (
              <div className="lg:col-span-12 space-y-8 animate-fade-in">
                
                {/* Visual scorecard metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  <div className="glass p-5 rounded-2xl border-white/5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Gross Revenue</span>
                      <DollarSign className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-mono font-bold">${adminReports.summary.totalRevenue.toFixed(2)}</div>
                    <div className="text-[9px] text-zinc-500">Gross billing of all bookings</div>
                  </div>

                  <div className="glass p-5 rounded-2xl border-white/5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Tickets Sold</span>
                      <Film className="h-4 w-4 text-teal-400" />
                    </div>
                    <div className="text-2xl font-mono font-bold">{adminReports.summary.ticketsSold}</div>
                    <div className="text-[9px] text-zinc-500">Billed ticket quantity</div>
                  </div>

                  <div className="glass p-5 rounded-2xl border-white/5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Auditorium Occupant</span>
                      <Percent className="h-4 w-4 text-sky-400" />
                    </div>
                    <div className="text-2xl font-mono font-bold">{adminReports.summary.averageOccupancy}%</div>
                    <div className="text-[9px] text-zinc-500">Average seating occupancies ratio</div>
                  </div>

                  <div className="glass p-5 rounded-2xl border-white/5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Transactions Count</span>
                      <Users className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="text-2xl font-mono font-bold">{adminReports.summary.totalTransactions}</div>
                    <div className="text-[9px] text-zinc-500">Confirmed & Cancelled logs</div>
                  </div>

                </div>

                {/* System charts visualizations */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Revenue by movie */}
                  <div className="lg:col-span-8 glass p-6 rounded-2xl border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Box Office Gross by Movie</h4>
                      <TrendingUp className="h-4 w-4 text-cyan-400" />
                    </div>

                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={adminReports.moviesSales}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="name" stroke="#a1a1aa" fontSize={10} tickLine={false} />
                          <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: "#0e0f14", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                            labelStyle={{ fontWeight: "bold", color: "#fff" }}
                          />
                          <Bar dataKey="revenue" fill="#00AEEF" radius={[4, 4, 0, 0]} name="Box Office Revenue ($)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Seating distribution metrics */}
                  <div className="lg:col-span-4 glass p-6 rounded-2xl border-white/5 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Seat Category popularity</h4>
                    
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={adminReports.seatDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            nameKey="name"
                          >
                            <Cell fill="#00AEEF" />
                            <Cell fill="#cfa853" />
                            <Cell fill="#00f3ff" />
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: "#0e0f14", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-1 text-xs text-zinc-400 font-mono">
                      {adminReports.seatDistribution.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between py-1 border-b border-white/5 last:border-0">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: i === 0 ? '#00AEEF' : i === 1 ? '#cfa853' : '#00f3ff' }}></span>
                            {item.name}
                          </span>
                          <span>{item.value} sold</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {tabAdminSection === 'movies' && (
              <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-8 animate-fade-in">
                
                {/* Left: Create/Add form with simulated drop visual zone */}
                <div className="md:col-span-5 glass p-6 rounded-2xl border-white/10 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--color-imax-cyan)]">Add Movie to Library</h3>

                  <form onSubmit={handleAddMovie} className="space-y-4 text-xs">
                    
                    <div className="space-y-1">
                      <label className="text-zinc-400">Movie Title</label>
                      <input 
                        type="text" 
                        required
                        value={newMovieTitle}
                        onChange={(e) => setNewMovieTitle(e.target.value)}
                        placeholder="e.g., Tron Ares"
                        className="w-full bg-zinc-950 border border-white/10 p-2.5 rounded-lg text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-zinc-400">Rating Classification</label>
                        <select 
                          value={newMovieRating}
                          onChange={(e) => setNewMovieRating(e.target.value)}
                          className="w-full bg-zinc-950 border border-white/10 p-2.5 rounded-lg text-white"
                        >
                          <option value="PG">PG</option>
                          <option value="PG-13">PG-13</option>
                          <option value="R">R</option>
                          <option value="G">G</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-zinc-400">Duration (Minutes)</label>
                        <input 
                          type="number" 
                          required
                          value={newMovieDuration}
                          onChange={(e) => setNewMovieDuration(Number(e.target.value))}
                          className="w-full bg-zinc-950 border border-white/10 p-2.5 rounded-lg text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-400">Overview Synopsis</label>
                      <textarea 
                        rows={3}
                        required
                        value={newMovieDesc}
                        onChange={(e) => setNewMovieDesc(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 p-2.5 rounded-lg text-white leading-relaxed"
                        placeholder="Paul Atreides unites with..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-500 uppercase font-bold tracking-widest text-[9px] flex items-center gap-1">
                        <Upload className="h-3 w-3" /> Poster Asset (Supports drag-drop)
                      </label>
                      <div 
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                          dragActive 
                            ? 'border-[var(--color-imax-cyan)] bg-[var(--color-imax-cyan)]/5' 
                            : 'border-white/10 hover:border-white/25 hover:bg-white/5'
                        }`}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileInputChange} 
                          className="hidden" 
                          accept="image/*"
                        />
                        <div className="text-zinc-400">
                          {newMoviePoster ? (
                            <span className="text-[var(--color-imax-cyan)] font-mono text-[10px] break-all">{newMoviePoster}</span>
                          ) : (
                            <span>Drag and drop promotional flyer or select file</span>
                          )}
                        </div>
                      </div>
                      <input 
                        type="url"
                        value={newMoviePoster}
                        onChange={(e) => setNewMoviePoster(e.target.value)}
                        placeholder="Or input explicit flyer URL link..."
                        className="w-full bg-zinc-950 border border-white/10 p-2 text-[10px] rounded-lg mt-1"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-400">Genres (Comma separated list)</label>
                      <input 
                        type="text" 
                        value={newMovieGenre}
                        onChange={(e) => setNewMovieGenre(e.target.value)}
                        placeholder="Sci-Fi, Adventure"
                        className="w-full bg-zinc-950 border border-white/10 p-2.5 rounded-lg text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-zinc-400">Director</label>
                        <input 
                          type="text" 
                          value={newMovieDirector}
                          onChange={(e) => setNewMovieDirector(e.target.value)}
                          placeholder="Denis Villeneuve"
                          className="w-full bg-zinc-950 border border-white/10 p-2.5 rounded-lg text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-zinc-400">Screening Status</label>
                        <select 
                          value={newMovieStatus}
                          onChange={(e) => setNewMovieStatus(e.target.value as any)}
                          className="w-full bg-zinc-950 border border-white/10 p-2.5 rounded-lg text-white"
                        >
                          <option value="now-showing">Now Screening</option>
                          <option value="coming-soon">Coming Soon</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-400">Backdrop Scenic link URL</label>
                      <input 
                        type="url" 
                        value={newMovieBackdrop}
                        onChange={(e) => setNewMovieBackdrop(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-zinc-950 border border-white/10 p-2.5 rounded-lg text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-400">Trailer Youtube Embed URL</label>
                      <input 
                        type="url" 
                        value={newMovieTrailer}
                        onChange={(e) => setNewMovieTrailer(e.target.value)}
                        placeholder="https://www.youtube.com/embed/..."
                        className="w-full bg-zinc-950 border border-white/10 p-2.5 rounded-lg text-white"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3 bg-red-600 hover:bg-red-500 font-bold text-xs tracking-wider rounded-xl cursor-pointer duration-150 text-white shadow-lg shadow-red-500/15"
                    >
                      Publish Film Schema
                    </button>

                  </form>
                </div>

                {/* Right: Active listing list with remove options */}
                <div className="md:col-span-7 glass p-6 rounded-2xl border-white/5 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-400">Catalog of Archive Assets ({movies.length})</h3>
                  
                  <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
                    {movies.map(m => (
                      <div key={m.id} className="p-3 bg-zinc-950 rounded-xl border border-white/5 flex items-center justify-between gap-4 py-4">
                        <div className="flex gap-3 items-center min-w-0">
                          <img src={m.posterUrl} className="w-10 h-14 object-cover bg-zinc-90 w-10 h-14 rounded-md" alt="" />
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-white truncate">{m.title}</h4>
                            <p className="text-xs text-zinc-400">ID: {m.id} • Rating: {m.rating} • {m.duration} mins</p>
                            <span className="text-[9px] bg-red-950/40 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-mono uppercase mt-1 inline-block">
                              {m.status}
                            </span>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleDeleteMovie(m.id)}
                          className="p-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded-xl cursor-pointer duration-150 shrink-0"
                          title="Archive from system catalogue"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {tabAdminSection === 'schedules' && (
              <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-8 animate-fade-in">
                
                {/* Left: Schedule showtime creator */}
                <div className="md:col-span-5 glass p-6 rounded-2xl border-white/10 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--color-imax-cyan)]">Populate Showtime Schedule</h3>

                  <form onSubmit={handleAddShowtime} className="space-y-4 text-xs">
                    
                    <div className="space-y-1">
                      <label className="text-zinc-400">Select Film</label>
                      <select 
                        required
                        value={newShowMovieId}
                        onChange={(e) => setNewShowMovieId(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 p-2.5 rounded-lg text-white"
                      >
                        <option value="">-- Choose film title --</option>
                        {movies.filter(m => m.status === 'now-showing').map(m => (
                          <option key={m.id} value={m.id}>{m.title}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-400">Theatrical Building Site</label>
                      <select 
                        required
                        value={newShowTheaterId}
                        onChange={(e) => setNewShowTheaterId(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 p-2.5 rounded-lg text-white"
                      >
                        <option value="">-- Choose site structure --</option>
                        {theaters.map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.location})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-400">Screen/Auditorium Name</label>
                      <input 
                        type="text"
                        required
                        value={newShowScreen}
                        onChange={(e) => setNewShowScreen(e.target.value)}
                        placeholder="e.g., Laser Auditorium H"
                        className="w-full bg-zinc-950 border border-white/10 p-2.5 rounded-lg text-white"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1 col-span-2">
                        <label className="text-zinc-400">Screen Date</label>
                        <input 
                          type="date" 
                          required
                          value={newShowDate}
                          onChange={(e) => setNewShowDate(e.target.value)}
                          className="w-full bg-zinc-950 border border-white/10 p-2 rounded-lg text-white font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-zinc-400">Time (HH:MM)</label>
                        <input 
                          type="text" 
                          required
                          value={newShowTime}
                          onChange={(e) => setNewShowTime(e.target.value)}
                          placeholder="e.g., 19:40"
                          className="w-full bg-zinc-950 border border-white/10 p-2 rounded-lg text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-400">Base Ticket Price ($ USD)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        value={newShowPrice}
                        onChange={(e) => setNewShowPrice(Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-white/10 p-2.5 rounded-lg text-white font-mono"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3 bg-red-600 hover:bg-red-500 font-bold text-xs tracking-wider rounded-xl cursor-pointer duration-150 text-white shadow-lg"
                    >
                      Initialize Showtime schedule
                    </button>

                  </form>
                </div>

                {/* Right: Active Listing showtimes list */}
                <div className="md:col-span-7 glass p-6 rounded-2xl border-white/5 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-400">System Showtime Schedules ({showtimes.length})</h3>

                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {showtimes.map(st => {
                      const mv = movies.find(m => m.id === st.movieId);
                      const th = theaters.find(t => t.id === st.theaterId);
                      return (
                        <div key={st.id} className="p-3 bg-zinc-950 rounded-xl border border-white/5 flex items-center justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-sm text-white truncate">{mv?.title || "Unknown Movie"}</h4>
                            <p className="text-xs text-zinc-400 mt-1">
                              ID: {st.id} • {th?.name.split(' ')[0]} • {st.screenName}
                            </p>
                            <p className="text-[10px] font-mono text-[var(--color-imax-cyan)] mt-0.5">
                              {st.date} @ {st.time} — Price: ${st.price.toFixed(2)}
                            </p>
                          </div>

                          <button 
                            onClick={() => handleDeleteShowtime(st.id)}
                            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-rose-950/20 rounded-xl cursor-pointer duration-150 shrink-0"
                            title="Archived scheduling"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {tabAdminSection === 'bookings' && (
              <div className="lg:col-span-12 glass p-6 rounded-3xl border-white/5 space-y-4 animate-fade-in">
                <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-400">All Confirmed/Refunded Database Bookings Logs ({adminBookings.length})</h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-zinc-300 min-w-[700px]">
                    <thead className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 border-b border-white/10">
                      <tr>
                        <th className="py-3 px-4">Booking ID</th>
                        <th className="py-3 px-4">Identity</th>
                        <th className="py-3 px-4">Film Screening</th>
                        <th className="py-3 px-4">Date/Time</th>
                        <th className="py-3 px-4 text-center">Row Seats</th>
                        <th className="py-3 px-4 text-right">Sum paid</th>
                        <th className="py-3 px-4 text-center">Security Status</th>
                        <th className="py-3 px-4 text-right">Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {adminBookings.map(b => {
                        const st = showtimes.find(s => s.id === b.showtimeId);
                        const mv = movies.find(m => m.id === st?.movieId);
                        return (
                          <tr key={b.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-white">{b.id}</td>
                            <td className="py-3 px-4">
                              <div>{b.userName}</div>
                              <div className="text-[10px] text-zinc-500">{b.userEmail}</div>
                            </td>
                            <td className="py-3 px-4 max-w-[150px] truncate">{mv?.title || "Unknown Film"}</td>
                            <td className="py-3 px-4 font-mono text-[11px] text-zinc-400">
                              {st?.date} @ {st?.time}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {b.seats.map(s => (
                                <span key={s} className="px-1.5 py-0.5 bg-white/5 rounded mx-0.5 text-[10px] font-bold font-mono">
                                  {s}
                                </span>
                              ))}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-white">${b.totalPrice.toFixed(2)}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                b.status === 'confirmed' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              }`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {b.status === 'confirmed' && (
                                <button 
                                  onClick={() => handleCancelBooking(b.id)}
                                  className="text-[10px] text-rose-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                                  title="Force cancel and void tickets"
                                >
                                  Void Entry
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* FOOTER SECTION BRAND MARK */}
      <footer className="relative mt-20 border-t border-white/5 bg-black/60 backdrop-blur-md py-8 px-4 text-xs font-mono tracking-widest text-zinc-500 text-center uppercase z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>&copy; 1968 - 2026 IMAX CORPORATION. All rights reserved.</div>
          <div className="flex gap-6 text-[10px] tracking-[0.15em]">
            <a href="#" className="hover:text-[var(--color-imax-cyan)] text-zinc-400">Privacy Policy</a>
            <span className="text-zinc-800">|</span>
            <a href="#" className="hover:text-[var(--color-imax-cyan)] text-zinc-400">Terms of Service</a>
            <span className="text-zinc-800">|</span>
            <a href="#" className="hover:text-[var(--color-imax-cyan)] text-zinc-400">Dynamic Laser calibration</a>
          </div>
        </div>
      </footer>

      {/* AUTHENTICATION SHEET MODAL PANEL */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm glass p-6 md:p-8 rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(0,174,239,0.15)] space-y-6"
            id="auth-credentials-modal"
          >
            {/* Header branding info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <div className="rounded bg-[var(--color-imax-blue)] p-1">
                  <Film className="h-4.5 w-4.5 text-black" />
                </div>
                <span className="font-display font-extrabold text-white text-base">IMAX Prestige Membership</span>
              </div>
              <button 
                onClick={() => setAuthModalOpen(false)}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Selector switches tab */}
            <div className="grid grid-cols-2 border border-white/10 bg-white/5 p-1 rounded-xl text-xs font-semibold">
              <button 
                onClick={() => setAuthMode('login')}
                className={`py-2 rounded-lg text-center ${
                  authMode === 'login' ? 'bg-[var(--color-imax-cyan)] text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Log In
              </button>
              <button 
                onClick={() => setAuthMode('register')}
                className={`py-2 rounded-lg text-center ${
                  authMode === 'register' ? 'bg-[var(--color-imax-cyan)] text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
              
              {authMode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-medium">Display name</label>
                  <input 
                    type="text" 
                    required 
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="e.g., Savitha Eazhilan"
                    className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl placeholder-zinc-600 text-white"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium">Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl placeholder-zinc-600 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium">Password credentials</label>
                <input 
                  type="password" 
                  required 
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl placeholder-zinc-600 text-white"
                />
              </div>

              {/* Password credentials hint list */}
              <div className="p-2.5 bg-sky-950/20 rounded-xl border border-sky-500/10 text-[10px] text-zinc-400 space-y-1 leading-snug">
                <strong>Sandbox demo accounts:</strong>
                <div>Director: <code className="text-white">admin@imax.com</code> / pass: <code className="text-white">admin123</code></div>
                <div>Standard User: <code className="text-white">savitha@imax.com</code> / pass: <code className="text-white">vip2026</code></div>
              </div>

              <button 
                type="submit"
                id="auth-submit-trigger"
                className="w-full py-3.5 imax-gradient font-bold text-xs cursor-pointer tracking-wider rounded-xl text-black shadow-md shadow-cyan-500/10"
              >
                {authMode === 'login' ? "Connect Prestige Profile" : "Register Loyalty Account"}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
