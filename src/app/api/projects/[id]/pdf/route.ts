import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { PDFDocument, rgb, PDFPage, PDFFont } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const { id } = await params

    // Import fs and path once at the beginning
    const fs = await import('fs/promises')
    const path = await import('path')

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        report: true,
      },
    })

    if (!project || !project.report) {
      return NextResponse.json(
        { error: "리포트를 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    // If PDF already exists, return the existing file
    if (project.report.pdfUrl) {

      const pdfPath = path.join(process.cwd(), project.report.pdfUrl)

      try {
        const pdfBuffer = await fs.readFile(pdfPath)
        const filename = `${project.companyName}_분석리포트.pdf`
        const encodedFilename = encodeURIComponent(filename)

        return new NextResponse(pdfBuffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="report.pdf"; filename*=UTF-8''${encodedFilename}`,
          },
        })
      } catch (error) {
        console.error("Failed to read existing PDF, regenerating:", error)
        // If file doesn't exist, continue to generate new PDF
      }
    }

    const analysisData = JSON.parse(project.report.analysisData || '{"slides":[]}')

    // Helper function to remove emojis and special unicode characters that pdf-lib can't handle
    const removeEmojis = (text: string): string => {
      // Remove emojis and special symbols
      return text
        .replace(/[\u{1F000}-\u{1F9FF}]/gu, '') // Emoticons, symbols, pictographs
        .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
        .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
        .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc symbols and pictographs
        .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
        .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and map symbols
        .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental symbols and pictographs
        .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation selectors
        .replace(/[\u{200D}]/gu, '')            // Zero width joiner
        .trim()
    }

    // Create PDF document
    const pdfDoc = await PDFDocument.create()

    // Register fontkit to support custom fonts
    pdfDoc.registerFontkit(fontkit)

    // Load Korean font from local file
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'NanumGothic.ttf')
    const fontBytes = await fs.readFile(fontPath)

    // Embed Korean font
    const koreanFont = await pdfDoc.embedFont(fontBytes)
    const koreanFontBold = koreanFont // Using same font for both regular and bold

    // Helper function to add text to page with word wrapping
    const addTextWithWrapping = (
      page: PDFPage,
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      fontSize: number,
      font: PDFFont,
      color = rgb(0, 0, 0)
    ) => {
      const words = text.split(' ')
      let line = ''
      let currentY = y

      for (const word of words) {
        const testLine = line + word + ' '
        const width = font.widthOfTextAtSize(testLine, fontSize)

        if (width > maxWidth && line.length > 0) {
          page.drawText(line, {
            x,
            y: currentY,
            size: fontSize,
            font,
            color,
          })
          line = word + ' '
          currentY -= fontSize + 4
        } else {
          line = testLine
        }
      }

      if (line.length > 0) {
        page.drawText(line, {
          x,
          y: currentY,
          size: fontSize,
          font,
          color,
        })
        currentY -= fontSize + 4
      }

      return currentY
    }

    // Title Page - 16:9 landscape presentation format
    let page = pdfDoc.addPage([960, 540]) // 16:9 landscape (presentation size)
    const { width, height } = page.getSize()

    page.drawText('Corporate AI Advisor', {
      x: 50,
      y: height - 100,
      size: 24,
      font: koreanFontBold,
      color: rgb(0.11, 0.25, 0.69),
    })

    page.drawText('Business Analysis Report', {
      x: 50,
      y: height - 140,
      size: 18,
      font: koreanFont,
      color: rgb(0.3, 0.3, 0.3),
    })

    let yPosition = height - 200

    page.drawText(`Company: ${project.companyName}`, {
      x: 50,
      y: yPosition,
      size: 14,
      font: koreanFontBold,
    })
    yPosition -= 30

    page.drawText(`Business Number: ${project.businessNumber}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: koreanFont,
    })
    yPosition -= 25

    page.drawText(`Representative: ${project.representative}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: koreanFont,
    })
    yPosition -= 25

    page.drawText(`Analysis Date: ${new Date(project.createdAt).toLocaleDateString("ko-KR")}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: koreanFont,
    })

    // Add slides
    for (const slide of analysisData.slides) {
      page = pdfDoc.addPage([960, 540]) // 16:9 landscape
      yPosition = height - 80

      // Slide title
      const titleText = removeEmojis(`${slide.slideNumber}. ${slide.title}`)
      page.drawText(titleText, {
        x: 50,
        y: yPosition,
        size: 18,
        font: koreanFontBold,
        color: rgb(0.11, 0.25, 0.69),
      })

      // Draw underline
      page.drawLine({
        start: { x: 50, y: yPosition - 5 },
        end: { x: width - 50, y: yPosition - 5 },
        thickness: 2,
        color: rgb(0.11, 0.25, 0.69),
      })

      yPosition -= 40

      // Slide content
      const lines = slide.content.split('\n')

      for (const line of lines) {
        if (yPosition < 80) {
          // Add new page if needed
          page = pdfDoc.addPage([960, 540]) // 16:9 landscape
          yPosition = height - 80
        }

        const trimmedLine = line.trim()

        if (!trimmedLine) {
          yPosition -= 10
          continue
        }

        let fontSize = 11
        let font = koreanFont
        let color = rgb(0.22, 0.25, 0.29)
        let indent = 0

        // Handle markdown-like formatting
        if (trimmedLine.startsWith('###')) {
          fontSize = 14
          font = koreanFontBold
          color = rgb(0.11, 0.25, 0.69)
          const cleanText = removeEmojis(trimmedLine.replace(/^###\s*/, '').replace(/\*\*/g, ''))
          yPosition = addTextWithWrapping(page, cleanText, 50, yPosition, width - 100, fontSize, font, color)
          yPosition -= 10
        } else if (trimmedLine.startsWith('##')) {
          fontSize = 16
          font = koreanFontBold
          color = rgb(0.11, 0.25, 0.69)
          const cleanText = removeEmojis(trimmedLine.replace(/^##\s*/, '').replace(/\*\*/g, ''))
          yPosition = addTextWithWrapping(page, cleanText, 50, yPosition, width - 100, fontSize, font, color)
          yPosition -= 10
        } else if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
          indent = 20
          const cleanText = removeEmojis(trimmedLine.replace(/^[-•]\s*/, '').replace(/\*\*/g, ''))
          page.drawText('•', {
            x: 50 + indent,
            y: yPosition,
            size: fontSize,
            font,
            color,
          })
          yPosition = addTextWithWrapping(page, cleanText, 50 + indent + 15, yPosition, width - 100 - indent - 15, fontSize, font, color)
        } else {
          const cleanText = removeEmojis(trimmedLine.replace(/\*\*/g, '').replace(/\*/g, ''))
          yPosition = addTextWithWrapping(page, cleanText, 50, yPosition, width - 100, fontSize, font, color)
        }

        yPosition -= 5
      }
    }

    // Add footer to last page
    page.drawText(
      `Generated by CorporateAI Advisor - ${new Date().toLocaleDateString("ko-KR")}`,
      {
        x: 50,
        y: 30,
        size: 9,
        font: koreanFont,
        color: rgb(0.5, 0.5, 0.5),
      }
    )

    // Save PDF
    const pdfBytes = await pdfDoc.save()

    // Save PDF to file system
    const uploadDir = path.join(process.cwd(), 'uploads', session.user.id, id)
    await fs.mkdir(uploadDir, { recursive: true })

    const timestamp = Date.now()
    const pdfFilename = `${timestamp}_report.pdf`
    const pdfPath = path.join(uploadDir, pdfFilename)

    await fs.writeFile(pdfPath, pdfBytes)

    // Update pdfUrl in database
    const relativePdfPath = `uploads/${session.user.id}/${id}/${pdfFilename}`
    await prisma.report.update({
      where: { projectId: id },
      data: { pdfUrl: relativePdfPath },
    })

    const filename = `${project.companyName}_분석리포트.pdf`
    const encodedFilename = encodeURIComponent(filename)

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="report.pdf"; filename*=UTF-8''${encodedFilename}`,
      },
    })
  } catch (error) {
    console.error("PDF generation error:", error)
    return NextResponse.json(
      { error: "PDF 생성 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
