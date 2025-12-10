"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import { MermaidDiagram } from "./mermaid-diagram"

interface Slide {
  slideNumber: number
  title: string
  content: string
  chartType?: string
  chartData?: unknown
}

interface SlideViewerProps {
  slides: Slide[]
}

export function SlideViewer({ slides }: SlideViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const goToNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    }
  }

  const goToPrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  // Safety check for empty slides or invalid data
  if (!slides || slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">슬라이드 데이터가 없습니다.</div>
      </div>
    )
  }

  const slide = slides[currentSlide]

  // Safety check for invalid slide data
  if (!slide || !slide.title) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">슬라이드 데이터 형식이 올바르지 않습니다.</div>
      </div>
    )
  }

  // Helper function to process content and handle escaped newlines
  const processContent = (content: string) => {
    // Replace escaped newlines with actual newlines for proper markdown parsing
    let processed = content.replace(/\\n/g, '\n')

    // Fix markdown tables with incorrect separator rows
    // This regex matches: header row + separator row (but not data rows)
    processed = processed.replace(
      /(\|[^\n]+\|)\n(\|:?-+:?\|(?::?-+:?\|)*)/g,
      (match, headerRow, separatorRow) => {
        // Count columns in header (number of pipes + 1)
        const headerCols = (headerRow.match(/\|/g) || []).length + 1

        // Count columns in separator
        const separatorCols = (separatorRow.match(/\|/g) || []).length + 1

        // If they match, no need to fix
        if (headerCols === separatorCols) {
          return match
        }

        // Create correct separator with same number of columns as header
        const separator = '|' + Array(headerCols).fill(':-------').join('|') + '|'

        return `${headerRow}\n${separator}`
      }
    )

    return processed
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Current slide view */}
      <div className="mb-8">
        <Card className="min-h-[600px] shadow-xl">
          <CardContent className="p-12">
            <div className="text-sm text-gray-500 mb-4 flex items-center justify-between">
              <span>슬라이드 {currentSlide + 1} / {slides.length}</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {slide.title}
              </span>
            </div>
            <h2 className="text-4xl font-bold mb-8 text-gray-900 border-b-4 border-blue-600 pb-4">
              {slide.title}
            </h2>
            <div className="prose prose-lg max-w-none">
              <style jsx global>{`
                .prose h3 {
                  color: #1e40af;
                  font-size: 1.5rem;
                  font-weight: 600;
                  margin-top: 1.5rem;
                  margin-bottom: 1rem;
                }

                .prose h4 {
                  color: #1e3a8a;
                  font-size: 1.25rem;
                  font-weight: 600;
                  margin-top: 1.25rem;
                  margin-bottom: 0.75rem;
                }

                .prose p {
                  color: #374151;
                  line-height: 1.8;
                  margin-bottom: 1rem;
                  font-size: 1.1rem;
                }

                .prose ul, .prose ol {
                  margin-top: 1rem;
                  margin-bottom: 1.5rem;
                  padding-left: 1.5rem;
                }

                .prose li {
                  color: #374151;
                  line-height: 1.8;
                  margin-bottom: 0.75rem;
                  font-size: 1.05rem;
                }

                .prose ul > li {
                  list-style-type: disc;
                }

                .prose ol > li {
                  list-style-type: decimal;
                }

                .prose strong {
                  color: #1f2937;
                  font-weight: 700;
                }

                .prose em {
                  color: #4b5563;
                  font-style: italic;
                }

                .prose blockquote {
                  border-left: 4px solid #3b82f6;
                  padding-left: 1rem;
                  font-style: italic;
                  color: #4b5563;
                  margin: 1.5rem 0;
                }

                .prose table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 1.5rem 0;
                }

                .prose th {
                  background-color: #eff6ff;
                  color: #1e40af;
                  font-weight: 600;
                  padding: 0.75rem;
                  text-align: left;
                  border: 1px solid #dbeafe;
                }

                .prose td {
                  padding: 0.75rem;
                  border: 1px solid #e5e7eb;
                }

                .prose tr:nth-child(even) {
                  background-color: #f9fafb;
                }
              `}</style>
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    const language = match ? match[1] : ''

                    if (language === 'mermaid') {
                      return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />
                    }

                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {processContent(String(slide.content || ""))}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-6 bg-white rounded-lg shadow-md p-4">
        <Button
          onClick={goToPrevious}
          disabled={currentSlide === 0}
          variant="outline"
          size="lg"
          className="px-6"
        >
          ← 이전
        </Button>
        <div className="text-lg font-semibold text-gray-700">
          {currentSlide + 1} / {slides.length}
        </div>
        <Button
          onClick={goToNext}
          disabled={currentSlide === slides.length - 1}
          size="lg"
          className="px-6 bg-blue-600 hover:bg-blue-700"
        >
          다음 →
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-3 bg-white rounded-lg shadow-md p-4">
        {slides.map((s, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`p-3 border-2 rounded-lg text-sm font-semibold transition-all ${
              index === currentSlide
                ? "bg-blue-600 text-white border-blue-600 shadow-lg scale-105"
                : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300"
            }`}
            title={s.title}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Hidden slides for PDF generation - A4 width, auto height */}
      <div className="fixed -left-[10000px] top-0">
        {slides.map((s, index) => (
          <div
            key={`pdf-slide-${index}`}
            data-slide-index={index}
            style={{ width: '842px', backgroundColor: 'white' }}
          >
            <div className="p-12">
              <h2 className="text-4xl font-bold mb-6 text-gray-900 border-b-4 border-blue-600 pb-4">
                {s.title}
              </h2>
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  components={{
                    code({ node, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '')
                      const language = match ? match[1] : ''

                      if (language === 'mermaid') {
                        return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />
                      }

                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {processContent(String(s.content || ""))}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
