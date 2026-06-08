export interface Movie {
  id: string;
  title: string;
  description: string;
  posterUrl: string;
  backdropUrl: string;
  rating: string;
  duration: number; // in minutes
  genre: string[];
  trailerUrl: string;
  status: 'now-showing' | 'coming-soon';
  cast: string[];
  director: string;
}

export interface Theater {
  id: string;
  name: string;
  location: string;
  screens: string[];
}

export interface Showtime {
  id: string;
  movieId: string;
  theaterId: string;
  screenName: string;
  time: string; // e.g., "14:30"
  date: string; // e.g., "2026-06-10"
  price: number; // Base price in USD
}

export interface Seat {
  id: string; // e.g., "A5"
  row: string; // e.g., "A"
  number: number; // e.g., 5
  type: 'standard' | 'premium' | 'wheelchair';
  priceMultiplier: number;
}

export interface TempLock {
  id: string;
  showtimeId: string;
  seats: string[];
  userId: string;
  expiresAt: number; // Timestamp
}

export interface Booking {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  showtimeId: string;
  seats: string[];
  totalPrice: number;
  bookingDate: string;
  status: 'confirmed' | 'cancelled';
  qrCode: string; // Mock barcode/QR data
}

export interface User {
  id: string;
  email: string;
  name: string;
  membershipPoints: number;
  isAdmin: boolean;
}

// Responses & Payload types
export interface AuthResponse {
  user: User;
  token: string;
}

export interface RealtimeStateResponse {
  showtimeId: string;
  bookedSeats: string[];
  lockedSeats: { [seatId: string]: string }; // seatId -> userId who locked it
  lockExpires: { [seatId: string]: number }; // seatId -> expiry timestamp
}
