export type ReadingStatus = 'reading' | 'completed' | 'want_to_read'

export interface Book {
  id: string
  title: string
  author: string
  isbn?: string
  cover_image?: string
  publisher?: string
  published_date?: string
  description?: string
  created_at: string
}

export interface ReadingRecord {
  id: string
  user_id: string
  book_id: string
  status: ReadingStatus
  rating?: number
  review?: string
  notes?: string
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
  books?: Book
}

export interface UserProfile {
  id: string
  username: string
  display_name?: string
  bio?: string
  avatar_url?: string
  created_at: string
}

