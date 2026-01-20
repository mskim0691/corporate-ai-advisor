import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse")

// PDF 파일 최대 크기: 10MB
const MAX_PDF_SIZE = 10 * 1024 * 1024

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const category = formData.get("category") as string
    const source = formData.get("source") as string
    const sourceUrl = formData.get("sourceUrl") as string | null

    if (!file) {
      return NextResponse.json(
        { error: "PDF 파일을 선택해주세요" },
        { status: 400 }
      )
    }

    if (!category || !source) {
      return NextResponse.json(
        { error: "카테고리와 출처는 필수입니다" },
        { status: 400 }
      )
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "PDF 파일만 업로드할 수 있습니다" },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_PDF_SIZE) {
      return NextResponse.json(
        { error: `파일 크기는 ${MAX_PDF_SIZE / (1024 * 1024)}MB 이하여야 합니다` },
        { status: 400 }
      )
    }

    // Read PDF file
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract text from PDF
    let pdfData
    try {
      pdfData = await pdfParse(buffer)
    } catch (parseError) {
      console.error("PDF parse error:", parseError)
      return NextResponse.json(
        { error: "PDF 파일을 읽는 중 오류가 발생했습니다. 파일이 손상되었거나 암호화되어 있을 수 있습니다." },
        { status: 400 }
      )
    }

    const extractedText = pdfData.text

    if (!extractedText || extractedText.trim().length < 50) {
      return NextResponse.json(
        { error: "PDF에서 충분한 텍스트를 추출할 수 없습니다. 이미지 기반 PDF는 지원하지 않습니다." },
        { status: 400 }
      )
    }

    // Split text into chunks (roughly 2000 characters each for reasonable context)
    const chunks = splitTextIntoChunks(extractedText, 2000)

    // Create knowledge entries from chunks
    const currentDate = new Date().toISOString().slice(0, 7) // YYYY-MM format
    const createdEntries = []

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]

      // Generate keywords from the chunk
      const keywords = extractKeywords(chunk.text)

      // Create a question/topic from the chunk
      const question = chunk.title || `${file.name} - 섹션 ${i + 1}`

      const entry = await prisma.chatbotKnowledge.create({
        data: {
          category,
          subcategory: `PDF 추출 (${file.name})`,
          question,
          answer: chunk.text,
          source,
          sourceUrl: sourceUrl || null,
          keywords: keywords.join(", "),
          isActive: true,
          lastUpdated: currentDate
        }
      })

      createdEntries.push(entry)
    }

    return NextResponse.json({
      success: true,
      message: `PDF에서 ${createdEntries.length}개의 지식 항목이 생성되었습니다.`,
      entriesCount: createdEntries.length,
      totalPages: pdfData.numpages,
      totalCharacters: extractedText.length
    })

  } catch (error) {
    console.error("PDF upload error:", error)
    return NextResponse.json(
      { error: "PDF 업로드 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}

/**
 * 텍스트를 청크로 분할합니다.
 * 문단이나 섹션 단위로 분할하려고 시도합니다.
 */
function splitTextIntoChunks(text: string, maxLength: number): Array<{ title: string; text: string }> {
  const chunks: Array<{ title: string; text: string }> = []

  // Clean up the text
  const cleanText = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  // Try to split by sections (numbered headings or clear separators)
  const sections = cleanText.split(/(?=\n\d+\.\s|\n[가-힣]+\.\s|\n#{1,3}\s|\n\*{3,}|\n-{3,})/g)

  for (const section of sections) {
    const trimmedSection = section.trim()
    if (!trimmedSection) continue

    if (trimmedSection.length <= maxLength) {
      // Extract title from first line if it looks like a heading
      const lines = trimmedSection.split("\n")
      const firstLine = lines[0].trim()
      const isHeading = /^(\d+\.|[가-힣]+\.|#{1,3})\s/.test(firstLine) || firstLine.length < 100

      chunks.push({
        title: isHeading ? firstLine.replace(/^(\d+\.|[가-힣]+\.|#{1,3})\s*/, "").slice(0, 100) : "",
        text: trimmedSection
      })
    } else {
      // Split long sections by paragraphs
      const paragraphs = trimmedSection.split(/\n\n+/)
      let currentChunk = ""
      let currentTitle = ""

      for (const para of paragraphs) {
        const trimmedPara = para.trim()
        if (!trimmedPara) continue

        if (!currentTitle && trimmedPara.length < 100) {
          currentTitle = trimmedPara
        }

        if ((currentChunk + "\n\n" + trimmedPara).length <= maxLength) {
          currentChunk = currentChunk ? currentChunk + "\n\n" + trimmedPara : trimmedPara
        } else {
          if (currentChunk) {
            chunks.push({ title: currentTitle, text: currentChunk })
          }
          currentChunk = trimmedPara
          currentTitle = trimmedPara.length < 100 ? trimmedPara : ""
        }
      }

      if (currentChunk) {
        chunks.push({ title: currentTitle, text: currentChunk })
      }
    }
  }

  return chunks
}

/**
 * 텍스트에서 주요 키워드를 추출합니다.
 */
function extractKeywords(text: string): string[] {
  // Korean tax/business related keywords to look for
  const importantTerms = [
    "법인세", "소득세", "부가가치세", "세금", "세율", "공제", "감면",
    "가업승계", "상속", "증여", "퇴직금", "급여", "4대보험",
    "법인", "기업", "중소기업", "중견기업", "사업자",
    "신고", "납부", "기한", "세무조사", "가산세",
    "손금", "익금", "과세표준", "세액",
    "자본금", "주식", "배당", "이익잉여금",
    "대출", "이자", "부채", "자산", "감가상각",
    "원천징수", "간이과세", "일반과세",
    "연금", "건강보험", "고용보험", "산재보험"
  ]

  const foundKeywords = new Set<string>()
  const textLower = text.toLowerCase()

  for (const term of importantTerms) {
    if (text.includes(term) || textLower.includes(term.toLowerCase())) {
      foundKeywords.add(term)
    }
  }

  // Also extract any numbers with % or 원
  const patterns = text.match(/\d+(?:\.\d+)?%|\d{1,3}(?:,\d{3})*원/g)
  if (patterns) {
    // Just note that there are financial figures
    foundKeywords.add("세율")
    foundKeywords.add("금액")
  }

  // If we found very few keywords, add some generic ones based on length
  if (foundKeywords.size < 3) {
    foundKeywords.add("법인컨설팅")
    foundKeywords.add("세무")
  }

  return Array.from(foundKeywords).slice(0, 15) // Limit to 15 keywords
}
