import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { generatePresentationSlides, generateAllSlideImages, generateCoverImage } from "@/lib/gemini"
import { PDFDocument } from "pdf-lib"
import { createClient } from "@supabase/supabase-js"

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const USE_SUPABASE = !!(supabaseUrl && supabaseServiceKey)

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

    // 이미 PDF가 있으면 생성하지 않음 (차감 방지)
    if (project.report?.pdfUrl) {
      return NextResponse.json({
        status: "already_exists",
        pdfUrl: project.report.pdfUrl,
      })
    }

    // 사용량 체크
    const user = await prisma.user.findUnique({
      where: { id: session.user.id! },
      include: { subscription: true },
    })

    const currentMonth = new Date().toISOString().slice(0, 7)
    const monthlyUsage = await prisma.monthlyUsage.findUnique({
      where: {
        userId_month: {
          userId: session.user.id!,
          month: currentMonth,
        },
      },
    })

    // 그룹 정책 확인
    let maxPresentations = user?.subscription?.monthlyPresentation || 0
    if (user?.groupPolicyId) {
      const groupPolicy = await prisma.groupPolicy.findUnique({
        where: { id: user.groupPolicyId },
      })
      if (groupPolicy) {
        maxPresentations = groupPolicy.monthlyPresentation
      }
    }

    const usedPresentations = monthlyUsage?.presentationCount || 0
    const remainingPresentations = maxPresentations - usedPresentations

    if (remainingPresentations <= 0) {
      return NextResponse.json(
        { error: "이번 달 비주얼 레포트 생성 횟수를 모두 사용했습니다." },
        { status: 403 }
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

      // Step 2.5: Generate cover image
      const coverTitle = presentationResult.slides[0]?.title || `${project.companyName} 컨설팅 리포트`
      console.log(`🎨 Step 2.5: Generating cover image...`)
      const coverImageData = await generateCoverImage(
        coverTitle,
        project.companyName,
        project.representative
      )

      // Step 3: Create PDF from images
      console.log(`📄 Step 3: Creating PDF from images...`)
      const pdfDoc = await PDFDocument.create()

      // 16:9 aspect ratio at 1K resolution (1024 x 576)
      const pageWidth = 1024
      const pageHeight = 576

      // Step 3-1: Add cover page
      if (coverImageData) {
        try {
          const coverBuffer = Buffer.from(coverImageData, "base64")
          let coverImage
          try {
            coverImage = await pdfDoc.embedPng(coverBuffer)
          } catch {
            coverImage = await pdfDoc.embedJpg(coverBuffer)
          }

          const coverPage = pdfDoc.addPage([pageWidth, pageHeight])
          const imgWidth = coverImage.width
          const imgHeight = coverImage.height
          const scale = Math.min(pageWidth / imgWidth, pageHeight / imgHeight)
          const scaledWidth = imgWidth * scale
          const scaledHeight = imgHeight * scale
          const x = (pageWidth - scaledWidth) / 2
          const y = (pageHeight - scaledHeight) / 2

          coverPage.drawImage(coverImage, {
            x,
            y,
            width: scaledWidth,
            height: scaledHeight,
          })
          console.log(`✓ Cover page added`)
        } catch (error) {
          console.error(`Failed to add cover page:`, error)
        }
      }

      // Step 3-2: Add slide images
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

      // Generate filename with timestamp and project id (ASCII only for Supabase compatibility)
      // Format: YYYYMMDD_HHMMSS-report.pdf
      const now = new Date()
      const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
      const filename = `${timestamp}-report.pdf`
      let relativePdfUrl: string

      if (USE_SUPABASE && supabaseUrl && supabaseServiceKey) {
        // Supabase Storage에 업로드
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const storagePath = `${session.user.id}/${project.id}/${filename}`

        const { error: uploadError } = await supabase.storage
          .from("uploads")
          .upload(storagePath, pdfBytes, {
            contentType: "application/pdf",
            upsert: true,
          })

        if (uploadError) {
          console.error("Supabase upload error:", uploadError)
          throw new Error("PDF 업로드 실패")
        }

        // Public URL 생성
        const { data: urlData } = supabase.storage
          .from("uploads")
          .getPublicUrl(storagePath)

        relativePdfUrl = urlData.publicUrl
        console.log(`✓ Visual report PDF uploaded to Supabase: ${relativePdfUrl}`)
      } else {
        // 로컬 파일 시스템에 저장 (개발 환경용)
        const fs = await import("fs/promises")
        const path = await import("path")

        const uploadDir = process.env.UPLOAD_DIR || "./uploads"
        const userDir = path.join(process.cwd(), uploadDir, session.user.id, project.id)
        await fs.mkdir(userDir, { recursive: true })

        const filePath = path.join(userDir, filename)
        await fs.writeFile(filePath, pdfBytes)

        relativePdfUrl = `uploads/${session.user.id}/${project.id}/${filename}`
        console.log(`✓ Visual report PDF saved locally: ${relativePdfUrl}`)
      }

      // Save PDF URL to database
      await prisma.report.update({
        where: { id: project.report.id },
        data: {
          pdfUrl: relativePdfUrl,
        },
      })

      // 비주얼 레포트 생성 횟수 차감
      const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM 형식

      // 현재 사용량 조회
      const existingUsage = await prisma.monthlyUsage.findUnique({
        where: {
          userId_month: {
            userId: session.user.id!,
            month: currentMonth,
          },
        },
      })

      if (existingUsage) {
        // 기존 레코드 업데이트
        await prisma.monthlyUsage.update({
          where: {
            userId_month: {
              userId: session.user.id!,
              month: currentMonth,
            },
          },
          data: {
            presentationCount: existingUsage.presentationCount + 1,
          },
        })
      } else {
        // 새 레코드 생성
        await prisma.monthlyUsage.create({
          data: {
            userId: session.user.id!,
            month: currentMonth,
            analysisCount: 0,
            presentationCount: 1,
          },
        })
      }

      console.log(`✓ Visual report usage counted for user ${session.user.id}`)

      return NextResponse.json({
        status: "success",
        pdfUrl: relativePdfUrl,
        slidesCount: presentationResult.slides.length,
        imagesGenerated: slideImages.filter(img => img).length,
      })
    } catch (error) {
      console.error("Visual report generation error:", error)
      const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류"
      const errorStack = error instanceof Error ? error.stack : ""
      console.error("Error details:", { message: errorMessage, stack: errorStack })

      // 서버 과부하 에러 처리
      if (errorMessage === "SERVER_OVERLOADED") {
        return NextResponse.json(
          { error: "현재 서버 과부하입니다. 나중에 다시 요청해주세요." },
          { status: 503 }
        )
      }

      return NextResponse.json(
        { error: `비주얼 리포트 생성 중 오류가 발생했습니다: ${errorMessage}` },
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
