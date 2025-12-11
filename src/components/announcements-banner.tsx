'use client';

import { useEffect, useState } from 'react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export function AnnouncementsBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/announcements');
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || announcements.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-3">
      {announcements.map((announcement) => (
        <div
          key={announcement.id}
          className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden"
        >
          <div
            className="p-4 cursor-pointer hover:bg-blue-100 transition-colors"
            onClick={() =>
              setExpandedId(expandedId === announcement.id ? null : announcement.id)
            }
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg
                    className="h-5 w-5 text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-900">
                    {announcement.title}
                  </h3>
                  {expandedId === announcement.id && (
                    <div className="mt-2 text-sm text-blue-800 whitespace-pre-wrap">
                      {announcement.content}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-blue-600">
                    {new Date(announcement.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
              <button
                className="ml-3 flex-shrink-0 text-blue-600 hover:text-blue-800"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedId(expandedId === announcement.id ? null : announcement.id);
                }}
              >
                <svg
                  className={`h-5 w-5 transform transition-transform ${
                    expandedId === announcement.id ? 'rotate-180' : ''
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
