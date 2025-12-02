'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Navbar from '@/components/Navbar'

interface BookResult {
  title: string
  author: string
  cover: string
  isbn13: string
  publisher: string
  pubDate: string
  description: string
}

export default function BooksPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [books, setBooks] = useState<BookResult[]>([])
  const [loading, setLoading] = useState(false)

  const searchBooks = async () => {
    if (!query.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`)
      const data = await response.json()
      setBooks(data.item || [])
    } catch (error) {
      console.error('검색 실패:', error)
      alert('검색에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-3xl font-bold mb-6">책 찾기 📖</h1>
        
        {/* 검색 바 */}
        <div className="mb-8 flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchBooks()}
            placeholder="책 제목이나 저자를 검색하세요..."
            className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={searchBooks}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? '검색 중...' : '검색'}
          </button>
        </div>
        
        {/* 책 목록 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {books.map((book) => (
            <div
              key={book.isbn13}
              onClick={() => router.push(`/books/${book.isbn13}`)}
              className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
            >
              <div className="relative h-48 mb-2">
                <Image
                  src={book.cover}
                  alt={book.title}
                  fill
                  className="object-contain"
                />
              </div>
              <h3 className="font-semibold text-sm line-clamp-2">{book.title}</h3>
              <p className="text-xs text-gray-600 mt-1">{book.author}</p>
            </div>
          ))}
        </div>

        {books.length === 0 && !loading && (
          <p className="text-center text-gray-500 mt-12">
            검색 결과가 없습니다. 다른 키워드로 검색해보세요.
          </p>
        )}
      </div>
    </>
  )
}
