import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "")

// 사용 가능한 최신 Gemini 모델 선택
let cachedModelName: string | null = null

async function getLatestAvailableModel(): Promise<string> {
  if (cachedModelName) {
    return cachedModelName
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GOOGLE_GEMINI_API_KEY}`
    )
    const data = await response.json()

    if (!data.models || data.models.length === 0) {
      throw new Error("No models available")
    }

    const availableModels = data.models.filter(
      (model: { supportedGenerationMethods?: string[]; name: string }) =>
        model.supportedGenerationMethods?.includes("generateContent") &&
        model.name.includes("gemini")
    )

    if (availableModels.length === 0) {
      throw new Error("No compatible models found")
    }

    const sortedModels = availableModels.sort((a: { name: string }, b: { name: string }) => {
      const aName = a.name.replace("models/", "")
      const bName = b.name.replace("models/", "")

      const aIsPro = aName.includes("pro")
      const bIsPro = bName.includes("pro")
      if (aIsPro && !bIsPro) return -1
      if (!aIsPro && bIsPro) return 1

      const aVersion = parseFloat(aName.match(/\d+\.\d+/)?.[0] || "0")
      const bVersion = parseFloat(bName.match(/\d+\.\d+/)?.[0] || "0")
      return bVersion - aVersion
    })

    const selectedModel = sortedModels[0].name.replace("models/", "")
    cachedModelName = selectedModel
    console.log(`🤖 Selected Gemini model for followup: ${selectedModel}`)
    return selectedModel
  } catch (error) {
    console.error("Error fetching available models:", error)
    cachedModelName = "gemini-2.5-pro"
    return cachedModelName
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const { id: projectId } = await params
    const { meetingNotes } = await request.json()

    if (!meetingNotes || typeof meetingNotes !== "string" || meetingNotes.trim().length === 0) {
      return NextResponse.json({ error: "미팅 내용을 입력해주세요" }, { status: 400 })
    }

    // 프로젝트 및 리포트 조회
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { report: true },
    })

    if (!project) {
      return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다" }, { status: 404 })
    }

    if (project.userId !== session.user.id) {
      // admin 체크
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })
      if (user?.role !== "admin") {
        return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 })
      }
    }

    if (!project.report?.textAnalysis) {
      return NextResponse.json({ error: "분석 제안서가 없습니다. 먼저 분석을 완료해주세요." }, { status: 400 })
    }

    // DB에서 프롬프트 템플릿 가져오기
    const promptTemplate = await prisma.prompt.findUnique({
      where: { name: "followup_analysis" }
    })

    if (!promptTemplate) {
      return NextResponse.json(
        { error: "프롬프트 템플릿을 찾을 수 없습니다. 관리자에게 문의하세요." },
        { status: 500 }
      )
    }

    // 프롬프트 템플릿의 변수들을 실제 값으로 치환
    const textAnalysisSummary = project.report.textAnalysis.substring(0, 5000) +
      (project.report.textAnalysis.length > 5000 ? "\n... (이하 생략)" : "")

    let prompt = promptTemplate.content
      .replace(/\{\{companyName\}\}/g, project.companyName)
      .replace(/\{\{businessNumber\}\}/g, project.businessNumber)
      .replace(/\{\{representative\}\}/g, project.representative)
      .replace(/\{\{textAnalysisSummary\}\}/g, textAnalysisSummary)
      .replace(/\{\{meetingNotes\}\}/g, meetingNotes)

    // 조건부 industry 처리
    if (project.industry) {
      prompt = prompt.replace(/\{\{#if industry\}\}(.*?)\{\{\/if\}\}/gs, (_, content) =>
        content.replace(/\{\{industry\}\}/g, project.industry)
      )
    } else {
      prompt = prompt.replace(/\{\{#if industry\}\}.*?\{\{\/if\}\}/gs, "")
    }

    // Gemini API로 후속 분석 생성
    const modelName = await getLatestAvailableModel()
    const model = genAI.getGenerativeModel({
      model: modelName,
      tools: [{ googleSearch: {} as any }] as any,
    })

    console.log(`🔍 Generating followup analysis for ${project.companyName}...`)

    const result = await model.generateContent(prompt)
    const response = await result.response
    const followupAnalysis = response.text()

    console.log(`✓ Followup analysis completed for ${project.companyName}`)

    // 결과 저장
    await prisma.report.update({
      where: { id: project.report.id },
      data: {
        meetingNotes: meetingNotes.trim(),
        followupAnalysis,
      },
    })

    return NextResponse.json({
      success: true,
      followupAnalysis,
    })
  } catch (error) {
    console.error("Followup analysis error:", error)
    return NextResponse.json(
      { error: "후속 분석 생성 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
