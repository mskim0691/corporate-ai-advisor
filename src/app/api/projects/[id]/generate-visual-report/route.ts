import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { generatePresentationSlides, generateAllSlideImages } from "@/lib/gemini"
import { PDFDocument } from "pdf-lib"
import * as fs from "fs/promises"
import * as path from "path"

export const maxDuration = 300 // 5 minutes timeout for image generation

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const { id } = await params

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        report: true,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: "프로젝트를 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    if (!project.report?.textAnalysis) {
      return NextResponse.json(
        { error: "텍스트 분석 결과가 없습니다" },
        { status: 400 }
      )
    }

    try {
      // Step 1: Generate presentation slides using step3-presentation-generation prompt
      console.log(`📊 Step 1: Generating presentation slides for ${project.companyName}...`)
      const presentationResult = await generatePresentationSlides(
        project.report.textAnalysis,
        project.companyName
      )

      // Save slides data to report
      await prisma.report.update({
        where: { id: project.report.id },
        data: {
          analysisData: JSON.stringify(presentationResult),
        },
      })

      // Step 2: Generate images for each slide
      console.log(`🎨 Step 2: Generating images for ${presentationResult.slides.length} slides...`)
      const slideImages = await generateAllSlideImages(
        presentationResult.slides,
        project.companyName
      )

      // Step 3: Create PDF from images
      console.log(`📄 Step 3: Creating PDF from images...`)
      const pdfDoc = await PDFDocument.create()

      // 16:9 aspect ratio at 1K resolution (1024 x 576)
      const pageWidth = 1024
      const pageHeight = 576

      for (let i = 0; i < slideImages.length; i++) {
        const imageData = slideImages[i]

        if (!imageData) {
          console.log(`⚠️ Skipping slide ${i + 1} - no image data`)
          continue
        }

        try {
          // Convert base64 to buffer
          const imageBuffer = Buffer.from(imageData, "base64")

          // Embed image in PDF (assuming PNG format from Gemini)
          let image
          try {
            image = await pdfDoc.embedPng(imageBuffer)
          } catch {
            // Try JPEG if PNG fails
            image = await pdfDoc.embedJpg(imageBuffer)
          }

          // Add page with 16:9 aspect ratio
          const page = pdfDoc.addPage([pageWidth, pageHeight])

          // Scale image to fit page while maintaining aspect ratio
          const imgWidth = image.width
          const imgHeight = image.height
          const scale = Math.min(pageWidth / imgWidth, pageHeight / imgHeight)

          const scaledWidth = imgWidth * scale
          const scaledHeight = imgHeight * scale

          // Center image on page
          const x = (pageWidth - scaledWidth) / 2
          const y = (pageHeight - scaledHeight) / 2

          page.drawImage(image, {
            x,
            y,
            width: scaledWidth,
            height: scaledHeight,
          })

          console.log(`✓ Added slide ${i + 1} to PDF`)
        } catch (error) {
          console.error(`Failed to add slide ${i + 1} to PDF:`, error)
        }
      }

      // Save PDF
      const pdfBytes = await pdfDoc.save()

      // Create directory if it doesn't exist
      const uploadDir = process.env.UPLOAD_DIR || "./uploads"
      const userDir = path.join(process.cwd(), uploadDir, session.user.id, project.id)
      await fs.mkdir(userDir, { recursive: true })

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const filename = `${timestamp}_visual_report.pdf`
      const filePath = path.join(userDir, filename)

      // Write PDF file
      await fs.writeFile(filePath, pdfBytes)

      // Save PDF URL to database
      const relativePdfUrl = `uploads/${session.user.id}/${project.id}/${filename}`
      await prisma.report.update({
        where: { id: project.report.id },
        data: {
          pdfUrl: relativePdfUrl,
        },
      })

      console.log(`✓ Visual report PDF saved: ${relativePdfUrl}`)

      return NextResponse.json({
        status: "success",
        pdfUrl: relativePdfUrl,
        slidesCount: presentationResult.slides.length,
        imagesGenerated: slideImages.filter(img => img).length,
      })
    } catch (error) {
      console.error("Visual report generation error:", error)
      return NextResponse.json(
        { error: "비주얼 리포트 생성 중 오류가 발생했습니다" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Generate visual report API error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
