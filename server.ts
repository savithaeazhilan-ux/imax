import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { Movie, Showtime, Theater, Booking, User, TempLock, RealtimeStateResponse } from "./src/types.js";

// Deriving ESM paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initial database seeding state (In-Memory for persistent, fast sandbox interactions)
let users: User[] = [
  {
    id: "u-admin",
    email: "admin@imax.com",
    name: "IMAX Theater Director",
    membershipPoints: 1500,
    isAdmin: true,
  },
  {
    id: "u-savitha",
    email: "savitha@imax.com",
    name: "Savitha Eazhilan",
    membershipPoints: 240,
    isAdmin: false,
  },
  {
    id: "u-guest",
    email: "guest@imax.com",
    name: "Guest Explorer",
    membershipPoints: 0,
    isAdmin: false,
  }
];

// Helper to keep simulated credentials simple
const userPasswords: { [userId: string]: string } = {
  "u-admin": "admin123",
  "u-savitha": "vip2026",
  "u-guest": "guest123",
};

let movies: Movie[] = [
  {
    id: "m-dune-2",
    title: "Dune: Part Two",
    description: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee. Filmed entirely for IMAX with certified digital cameras.",
    posterUrl: "https://images.unsplash.com/photo-1547483238-f400e65ccd56?q=80&w=600&auto=format&fit=crop", // Elegant sand dunes visual
    backdropUrl: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=1200&auto=format&fit=crop", // Sand storm / cosmic sky backdrop
    rating: "PG-13",
    duration: 166,
    genre: ["Sci-Fi", "Adventure", "Drama"],
    trailerUrl: "https://www.youtube.com/embed/Way9Dexny3w",
    status: "now-showing",
    cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Austin Butler"],
    director: "Denis Villeneuve",
  },
  {
    id: "m-oppenheimer",
    title: "Oppenheimer",
    description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb. Shot on IMAX 65mm and 65mm large-format film, including sections in IMAX black and white analog photography.",
    posterUrl: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=600&auto=format&fit=crop", // Atmospheric noir lighting
    backdropUrl: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?q=80&w=1200&auto=format&fit=crop", // Flare / fire galaxy background
    rating: "R",
    duration: 180,
    genre: ["Biography", "Drama", "History"],
    trailerUrl: "https://www.youtube.com/embed/uYPbbksJxIg",
    status: "now-showing",
    cast: ["Cillian Murphy", "Emily Blunt", "Matt Damon", "Robert Downey Jr."],
    director: "Christopher Nolan",
  },
  {
    id: "m-interstellar",
    title: "Interstellar: IMAX Revival",
    description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival. Featuring Hans Zimmer's mesmerizing score, experience this masterpiece in the tallest cinematic ratio ever engineered.",
    posterUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop", // Orbit cosmic view
    backdropUrl: "https://images.unsplash.com/photo-1538370965046-79c0d6907d47?q=80&w=1200&auto=format&fit=crop", // Deep space horizon
    rating: "PG-13",
    duration: 169,
    genre: ["Sci-Fi", "Adventure", "Mystery"],
    trailerUrl: "https://www.youtube.com/embed/zSWdZVtXT7E",
    status: "now-showing",
    cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain", "Michael Caine"],
    director: "Christopher Nolan",
  },
  {
    id: "m-avatar-2",
    title: "Avatar: The Way of Water 3D",
    description: "Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Na'vi race to protect their home. Mastered in High Frame Rate (HFR) with absolute IMAX laser depth.",
    posterUrl: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?q=80&w=600&auto=format&fit=crop", // Ocean deep bioluminescence
    backdropUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop", // Beautiful coastal shoreline
    rating: "PG-13",
    duration: 192,
    genre: ["Action", "Sci-Fi", "Fantasy"],
    trailerUrl: "https://www.youtube.com/embed/d9MyW72ELq0",
    status: "now-showing",
    cast: ["Sam Worthington", "Zoe Saldana", "Sigourney Weaver", "Kate Winslet"],
    director: "James Cameron",
  },
  {
    id: "m-blade-2049",
    title: "Blade Runner 2049",
    description: "A new blade runner, LAPD Officer K, unearths a long-buried secret that has the potential to plunge what's left of society into chaos. Roger Deakins' sublime cinematography customized to maximum IMAX brilliance.",
    posterUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600&auto=format&fit=crop", // Cyberpunk cityscape neon
    backdropUrl: "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?q=80&w=1200&auto=format&fit=crop", // Warm industrial sunset glow
    rating: "R",
    duration: 164,
    genre: ["Sci-Fi", "Action", "Thriller"],
    trailerUrl: "https://www.youtube.com/embed/gCcx85zby3A",
    status: "coming-soon",
    cast: ["Ryan Gosling", "Harrison Ford", "Ana de Armas", "Robin Wright"],
    director: "Denis Villeneuve",
  },
  {
    id: "m-tron-ares",
    title: "Tron: Ares",
    description: "A highly sophisticated program, Ares, is sent from the digital world into the physical world on a dangerous mission, marking humankind's first encounter with A.I. beings. Designed for stunning auditory and visual bass delivery.",
    posterUrl: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=600&auto=format&fit=crop", // Dark techno red glow
    backdropUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop", // Grid circuit board pattern
    rating: "PG-13",
    duration: 145,
    genre: ["Sci-Fi", "Action", "Adventure"],
    trailerUrl: "https://www.youtube.com/embed/LPD2Lqf23sc",
    status: "coming-soon",
    cast: ["Jared Leto", "Greta Lee", "Evan Peters", "Gillian Anderson"],
    director: "Joachim Rønning",
  }
];

let theaters: Theater[] = [
  {
    id: "t-metreon",
    name: "Metreon IMAX Theater",
    location: "San Francisco, CA",
    screens: ["Grand Screen 1"]
  },
  {
    id: "t-lincoln",
    name: "Lincoln Square 13 IMAX",
    location: "New York, NY",
    screens: ["IMAX 70mm Auditorium"]
  },
  {
    id: "t-tokyo",
    name: "Tokyo Ocean Dome IMAX",
    location: "Shinjuku, Tokyo",
    screens: ["Laser Dome B"]
  }
];

// Pre-create showtimes relative to virtual date 2026-06-08
let showtimes: Showtime[] = [
  // Dune: Part Two
  { id: "s-dune-1", movieId: "m-dune-2", theaterId: "t-metreon", screenName: "Grand Screen 1", time: "11:30", date: "2026-06-08", price: 21.50 },
  { id: "s-dune-2", movieId: "m-dune-2", theaterId: "t-metreon", screenName: "Grand Screen 1", time: "15:30", date: "2026-06-08", price: 23.50 },
  { id: "s-dune-3", movieId: "m-dune-2", theaterId: "t-lincoln", screenName: "IMAX 70mm Auditorium", time: "19:00", date: "2026-06-08", price: 26.00 },
  { id: "s-dune-4", movieId: "m-dune-2", theaterId: "t-tokyo", screenName: "Laser Dome B", time: "21:30", date: "2026-06-08", price: 24.50 },
  { id: "s-dune-5", movieId: "m-dune-2", theaterId: "t-metreon", screenName: "Grand Screen 1", time: "14:00", date: "2026-06-09", price: 22.00 },
  { id: "s-dune-6", movieId: "m-dune-2", theaterId: "t-lincoln", screenName: "IMAX 70mm Auditorium", time: "18:00", date: "2026-06-09", price: 25.00 },
  { id: "s-dune-7", movieId: "m-dune-2", theaterId: "t-lincoln", screenName: "IMAX 70mm Auditorium", time: "15:00", date: "2026-06-10", price: 22.50 },

  // Oppenheimer
  { id: "s-opp-1", movieId: "m-oppenheimer", theaterId: "t-lincoln", screenName: "IMAX 70mm Auditorium", time: "11:00", date: "2026-06-08", price: 24.00 },
  { id: "s-opp-2", movieId: "m-oppenheimer", theaterId: "t-lincoln", screenName: "IMAX 70mm Auditorium", time: "15:00", date: "2026-06-08", price: 25.50 },
  { id: "s-opp-3", movieId: "m-oppenheimer", theaterId: "t-metreon", screenName: "Grand Screen 1", time: "19:15", date: "2026-06-08", price: 24.50 },
  { id: "s-opp-4", movieId: "m-oppenheimer", theaterId: "t-metreon", screenName: "Grand Screen 1", time: "18:30", date: "2026-06-09", price: 23.50 },
  { id: "s-opp-5", movieId: "m-oppenheimer", theaterId: "t-tokyo", screenName: "Laser Dome B", time: "17:00", date: "2026-06-10", price: 25.00 },

  // Interstellar
  { id: "s-inter-1", movieId: "m-interstellar", theaterId: "t-metreon", screenName: "Grand Screen 1", time: "22:45", date: "2026-06-08", price: 25.00 },
  { id: "s-inter-2", movieId: "m-interstellar", theaterId: "t-lincoln", screenName: "IMAX 70mm Auditorium", time: "22:30", date: "2026-06-08", price: 26.50 },
  { id: "s-inter-3", movieId: "m-interstellar", theaterId: "t-tokyo", screenName: "Laser Dome B", time: "13:30", date: "2026-06-09", price: 23.00 },
  { id: "s-inter-4", movieId: "m-interstellar", theaterId: "t-metreon", screenName: "Grand Screen 1", time: "21:15", date: "2026-06-10", price: 24.00 },

  // Avatar 2
  { id: "s-ava-1", movieId: "m-avatar-2", theaterId: "t-tokyo", screenName: "Laser Dome B", time: "10:30", date: "2026-06-08", price: 23.00 },
  { id: "s-ava-2", movieId: "m-avatar-2", theaterId: "t-tokyo", screenName: "Laser Dome B", time: "18:00", date: "2026-06-08", price: 25.00 },
  { id: "s-ava-3", movieId: "m-avatar-2", theaterId: "t-metreon", screenName: "Grand Screen 1", time: "10:00", date: "2026-06-09", price: 21.00 },
  { id: "s-ava-4", movieId: "m-avatar-2", theaterId: "t-lincoln", screenName: "IMAX 70mm Auditorium", time: "11:30", date: "2026-06-10", price: 23.50 }
];

// Seed standard bookings to populate dashboards/charts nicely
let bookings: Booking[] = [
  {
    id: "b-1001",
    userId: "u-savitha",
    userEmail: "savitha@imax.com",
    userName: "Savitha Eazhilan",
    showtimeId: "s-dune-3", // Dune Part 2 in Lincoln Square Auditorium
    seats: ["F8", "F9"],
    totalPrice: 52.00,
    bookingDate: "2026-06-07 18:24",
    status: "confirmed",
    qrCode: "IMAX-D3-F8F9-SAVITHA-CONFIRMED-9972"
  },
  {
    id: "b-1002",
    userId: "u-savitha",
    userEmail: "savitha@imax.com",
    userName: "Savitha Eazhilan",
    showtimeId: "s-opp-1",
    seats: ["G12"],
    totalPrice: 24.00,
    bookingDate: "2026-06-06 14:10",
    status: "confirmed",
    qrCode: "IMAX-OP-G12-SAVITHA-CONFIRMED-4812"
  },
  {
    id: "b-1003",
    userId: "u-guest",
    userEmail: "guest@imax.com",
    userName: "Guest Explorer",
    showtimeId: "s-inter-1",
    seats: ["E1", "E2", "E3"],
    totalPrice: 75.00,
    bookingDate: "2026-06-08 09:12",
    status: "confirmed",
    qrCode: "IMAX-IN-E123-GUEST-CONFIRMED-2210"
  },
  {
    id: "b-1004",
    userId: "u-savitha",
    userEmail: "savitha@imax.com",
    userName: "Savitha Eazhilan",
    showtimeId: "s-opp-3",
    seats: ["H6", "H7"],
    totalPrice: 49.00,
    bookingDate: "2026-06-05 21:05",
    status: "cancelled",
    qrCode: "IMAX-OP-H6H7-SAVITHA-CANCELLED-1093"
  }
];

// Temporarily locked seats. Lock duration: 5 minutes = 300000ms
let tempLocks: TempLock[] = [];

// Clean expired locks every 10 seconds
setInterval(() => {
  const now = Date.now();
  const originalLength = tempLocks.length;
  tempLocks = tempLocks.filter(lock => lock.expiresAt > now);
  if (tempLocks.length !== originalLength) {
    console.log(`Cleaned expired locks. Remaining locks: ${tempLocks.length}`);
  }
}, 10000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // Simple Sim token auth parser
  const getLoggedInUser = (req: express.Request): User | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.substring(7); // "Bearer [userId]"
    const found = users.find(u => u.id === token || u.email === token);
    return found || null;
  };

  // --- API ENDPOINTS ---

  // Auth: Login
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!foundUser) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const matchPass = userPasswords[foundUser.id];
    if (matchPass !== password) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    return res.json({
      user: foundUser,
      token: foundUser.id
    });
  });

  // Auth: Register
  app.post("/api/auth/register", (req, res) => {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: "Email already registered." });
    }

    const newId = "u-" + Math.random().toString(36).substr(2, 9);
    const newUser: User = {
      id: newId,
      email,
      name,
      membershipPoints: 50, // Welcome gift points!
      isAdmin: false
    };

    users.push(newUser);
    userPasswords[newId] = password;

    return res.status(201).json({
      user: newUser,
      token: newUser.id
    });
  });

  // Movies: List
  app.get("/api/movies", (req, res) => {
    res.json(movies);
  });

  // Movies: Create (Admin only)
  app.post("/api/movies", (req, res) => {
    const user = getLoggedInUser(req);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Admin access required." });
    }

    const { title, description, posterUrl, backdropUrl, rating, duration, genre, trailerUrl, status, cast, director } = req.body;
    if (!title || !description || !posterUrl || !rating || !duration) {
      return res.status(400).json({ error: "Required fields missing." });
    }

    const newMovie: Movie = {
      id: "m-" + Math.random().toString(36).substr(2, 9),
      title,
      description,
      posterUrl,
      backdropUrl: backdropUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop",
      rating,
      duration: Number(duration),
      genre: Array.isArray(genre) ? genre : [genre],
      trailerUrl: trailerUrl || "",
      status: status || "now-showing",
      cast: Array.isArray(cast) ? cast : cast ? [cast] : [],
      director: director || "Unknown Director"
    };

    movies.push(newMovie);
    res.status(201).json(newMovie);
  });

  // Movies: Update (Admin and edit)
  app.put("/api/movies/:id", (req, res) => {
    const user = getLoggedInUser(req);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Admin access required." });
    }

    const idx = movies.findIndex(m => m.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: "Movie not found" });
    }

    movies[idx] = { ...movies[idx], ...req.body };
    res.json(movies[idx]);
  });

  // Movies: Delete (Admin only)
  app.delete("/api/movies/:id", (req, res) => {
    const user = getLoggedInUser(req);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Admin access required." });
    }

    movies = movies.filter(m => m.id !== req.params.id);
    res.json({ success: true, message: "Movie deleted." });
  });

  // Theaters: List
  app.get("/api/theaters", (req, res) => {
    res.json(theaters);
  });

  // Showtimes: List
  app.get("/api/showtimes", (req, res) => {
    res.json(showtimes);
  });

  // Showtimes: Add (Admin only)
  app.post("/api/showtimes", (req, res) => {
    const user = getLoggedInUser(req);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Admin access required." });
    }

    const { movieId, theaterId, screenName, time, date, price } = req.body;
    if (!movieId || !theaterId || !screenName || !time || !date || !price) {
      return res.status(400).json({ error: "All showtime schedules parameters are required." });
    }

    const newId = "s-" + Math.random().toString(36).substr(2, 9);
    const newShow: Showtime = {
      id: newId,
      movieId,
      theaterId,
      screenName,
      time,
      date,
      price: Number(price)
    };

    showtimes.push(newShow);
    res.status(201).json(newShow);
  });

  // Showtimes: Delete (Admin only)
  app.delete("/api/showtimes/:id", (req, res) => {
    const user = getLoggedInUser(req);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Admin access required." });
    }

    showtimes = showtimes.filter(s => s.id !== req.params.id);
    res.json({ success: true, message: "Showtime scheduled successfully removed." });
  });

  // Seat Status & Real-Time Locks for a showtime
  app.get("/api/showtime-seats/:id", (req, res) => {
    const showtimeId = req.params.id;
    const now = Date.now();

    // Find already booked seats from confirmed bookings
    const bookedSeats = bookings
      .filter(b => b.showtimeId === showtimeId && b.status === "confirmed")
      .reduce((acc, current) => [...acc, ...current.seats], [] as string[]);

    // Find actively locked seats (not expired)
    const activeLocks = tempLocks.filter(lock => lock.showtimeId === showtimeId && lock.expiresAt > now);

    const lockedSeats: { [seatId: string]: string } = {};
    const lockExpires: { [seatId: string]: number } = {};

    activeLocks.forEach(lock => {
      lock.seats.forEach(seatId => {
        lockedSeats[seatId] = lock.userId;
        lockExpires[seatId] = lock.expiresAt;
      });
    });

    res.json({
      showtimeId,
      bookedSeats,
      lockedSeats,
      lockExpires
    });
  });

  // Lock Seats
  app.post("/api/seats/lock", (req, res) => {
    const user = getLoggedInUser(req);
    if (!user) {
      return res.status(401).json({ error: "Sign in required to lock seats." });
    }

    const { showtimeId, seats } = req.body;
    if (!showtimeId || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ error: "Invalid showtime or seat selection." });
    }

    const now = Date.now();

    // Check if any of these seats are booked
    const bookedSeats = bookings
      .filter(b => b.showtimeId === showtimeId && b.status === "confirmed")
      .reduce((acc, b) => [...acc, ...b.seats], [] as string[]);

    const isAnyBooked = seats.some(seatId => bookedSeats.includes(seatId));
    if (isAnyBooked) {
      return res.status(409).json({ error: "One or more selected seats have already been sold." });
    }

    // Check if any are already actively locked by other users
    const isAnyLocked = tempLocks.some(lock => {
      const matchShow = lock.showtimeId === showtimeId;
      const notCurrentUser = lock.userId !== user.id;
      const notExpired = lock.expiresAt > now;
      if (matchShow && notCurrentUser && notExpired) {
        return lock.seats.some(seat => seats.includes(seat));
      }
      return false;
    });

    if (isAnyLocked) {
      return res.status(409).json({ error: "One or more seats are currently locked by another guest." });
    }

    // Release any previous locks this user has for this showtime
    tempLocks = tempLocks.filter(lock => !(lock.userId === user.id && lock.showtimeId === showtimeId));

    // Create new seat lock, expires in 5 minutes (300,000 ms)
    const lockExpiry = now + 300000;
    const newLock: TempLock = {
      id: "lock-" + Math.random().toString(36).substr(2, 9),
      showtimeId,
      seats,
      userId: user.id,
      expiresAt: lockExpiry
    };

    tempLocks.push(newLock);

    res.json({
      message: "Seats secured for 5 minutes.",
      lockExpiry
    });
  });

  // Release Seat Lock
  app.post("/api/seats/unlock", (req, res) => {
    const user = getLoggedInUser(req);
    if (!user) return res.status(401).json({ error: "Authentication required." });

    const { showtimeId } = req.body;
    tempLocks = tempLocks.filter(lock => !(lock.userId === user.id && lock.showtimeId === showtimeId));
    res.json({ status: "unlocked" });
  });

  // Book Tickets (Checkout Completion)
  app.post("/api/book", (req, res) => {
    const user = getLoggedInUser(req);
    if (!user) {
      return res.status(401).json({ error: "Log in to finalize purchase." });
    }

    const { showtimeId, seats, totalPrice } = req.body;
    if (!showtimeId || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ error: "Invalid booking details." });
    }

    // Verify seats are not already booked
    const bookedSeats = bookings
      .filter(b => b.showtimeId === showtimeId && b.status === "confirmed")
      .reduce((acc, b) => [...acc, ...b.seats], [] as string[]);

    const duplicateBooking = seats.some(seat => bookedSeats.includes(seat));
    if (duplicateBooking) {
      return res.status(409).json({ error: "One or more seats were booked in another concurrent checkout." });
    }

    // Capture booking
    const bookingId = "b-" + (1000 + bookings.length + 1);
    const newBooking: Booking = {
      id: bookingId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      showtimeId,
      seats,
      totalPrice: Number(totalPrice),
      bookingDate: new Date().toISOString().replace('T', ' ').substr(0, 16),
      status: "confirmed",
      qrCode: `IMAX-${showtimeId.split('-')[1].toUpperCase()}-${seats.join('')}-${user.id.toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`
    };

    // Add to library
    bookings.push(newBooking);

    // Release user's active locks
    tempLocks = tempLocks.filter(loc => !(loc.userId === user.id && loc.showtimeId === showtimeId));

    // Increase user point rewards (e.g. 10 points per seat)
    const pointsGranted = seats.length * 20;
    const userIdx = users.findIndex(u => u.id === user.id);
    if (userIdx !== -1) {
      users[userIdx].membershipPoints += pointsGranted;
    }

    res.status(201).json({
      booking: newBooking,
      earnedPoints: pointsGranted,
      newTotalPoints: userIdx !== -1 ? users[userIdx].membershipPoints : 0
    });
  });

  // Booking list
  app.get("/api/bookings", (req, res) => {
    const user = getLoggedInUser(req);
    if (!user) {
      return res.status(401).json({ error: "Login required." });
    }

    if (user.isAdmin) {
      // Returns all bookings for the administration logs
      return res.json(bookings);
    } else {
      // Return specific user bookings
      return res.json(bookings.filter(b => b.userId === user.id));
    }
  });

  // Cancel Booking
  app.post("/api/bookings/cancel/:id", (req, res) => {
    const user = getLoggedInUser(req);
    if (!user) {
      return res.status(401).json({ error: "Login required." });
    }

    const bookingId = req.params.id;
    const idx = bookings.findIndex(b => b.id === bookingId);
    if (idx === -1) {
      return res.status(404).json({ error: "Booking record list could not be found." });
    }

    const booking = bookings[idx];
    if (booking.userId !== user.id && !user.isAdmin) {
      return res.status(403).json({ error: "Access denied." });
    }

    bookings[idx].status = "cancelled";

    // Deduct loyalty points refunded (only if cancelled by normal user)
    const refundedPoints = booking.seats.length * 20;
    const userIdx = users.findIndex(u => u.id === booking.userId);
    if (userIdx !== -1) {
      users[userIdx].membershipPoints = Math.max(0, users[userIdx].membershipPoints - refundedPoints);
    }

    res.json({
      success: true,
      booking: bookings[idx],
      deductedPoints: refundedPoints,
      newTotalPoints: userIdx !== -1 ? users[userIdx].membershipPoints : 0
    });
  });

  // Reports Dashboard API (Admin only)
  app.get("/api/admin/reports", (req, res) => {
    const user = getLoggedInUser(req);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Admin dashboard restriction." });
    }

    const confirmedBookings = bookings.filter(b => b.status === "confirmed");
    const totalTransactions = bookings.length;
    
    // Revenue calculations
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalPrice, 0);

    // Seating occupancy calculations
    // Seating capacities standard: Total of 150 potential seats per IMAX screen
    const totalPossibleSeats = showtimes.length * 150;
    const ticketsSold = confirmedBookings.reduce((sum, b) => sum + b.seats.length, 0);
    const averageOccupancy = totalPossibleSeats > 0 ? (ticketsSold / totalPossibleSeats) * 100 : 0;

    // Revenue by Movie
    const revenueByMovie: { [title: string]: number } = {};
    const salesByMovie: { [title: string]: number } = {};
    
    movies.forEach(m => {
      revenueByMovie[m.title] = 0;
      salesByMovie[m.title] = 0;
    });

    confirmedBookings.forEach(b => {
      const show = showtimes.find(s => s.id === b.showtimeId);
      if (show) {
        const movie = movies.find(m => m.id === show.movieId);
        if (movie) {
          revenueByMovie[movie.title] += b.totalPrice;
          salesByMovie[movie.title] += b.seats.length;
        }
      }
    });

    const moviesReport = Object.keys(revenueByMovie).map(title => ({
      name: title,
      revenue: revenueByMovie[title],
      ticketsSold: salesByMovie[title]
    })).sort((a, b) => b.revenue - a.revenue);

    // Seating type popular distribution
    let standardCount = 0;
    let premiumCount = 0;
    let wheelchairCount = 0;

    confirmedBookings.forEach(b => {
      b.seats.forEach(seatId => {
        const row = seatId.charAt(0);
        if (["A", "B", "C", "D"].includes(row)) {
          standardCount++;
        } else if (["E", "F", "G", "H", "I", "J"].includes(row)) {
          premiumCount++;
        } else {
          wheelchairCount++;
        }
      });
    });

    res.json({
      summary: {
        totalRevenue,
        ticketsSold,
        averageOccupancy: Math.round(averageOccupancy),
        totalTransactions
      },
      moviesSales: moviesReport,
      seatDistribution: [
        { name: "Standard Rows", value: standardCount },
        { name: "Premium Elite Rows", value: premiumCount },
        { name: "VIP Double Loungers", value: wheelchairCount }
      ]
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server fully synchronized at http://localhost:${PORT}`);
  });
}

startServer();
