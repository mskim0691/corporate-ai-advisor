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

    // Gemini API로 후속 분석 생성
    const modelName = await getLatestAvailableModel()
    const model = genAI.getGenerativeModel({
      model: modelName,
      tools: [{ googleSearch: {} as any }] as any,
    })

    const prompt = `당신은 전문 B2B 영업 컨설턴트입니다.
아래 정보를 바탕으로 후속 미팅 대응 전략을 제안해주세요.

## 회사 정보
- 회사명: ${project.companyName}
- 사업자번호: ${project.businessNumber}
- 대표자: ${project.representative}
${project.industry ? `- 업종: ${project.industry}` : ""}

## 기존 분석 제안서 내용 (요약)
${project.report.textAnalysis.substring(0, 5000)}
${project.report.textAnalysis.length > 5000 ? "\n... (이하 생략)" : ""}

## 고객 미팅 결과
${meetingNotes}

---

위 미팅 결과를 바탕으로 다음 내용을 작성해주세요:

### 1. 미팅 결과 분석
- 고객의 주요 관심사항 파악
- 긍정적인 신호와 우려 사항 분류
- 의사결정 단계 평가 (관심/검토/결정 단계 중)

### 2. 고객 우려사항 대응 전략
- 각 우려사항에 대한 구체적인 대응 방안
- 활용할 수 있는 레퍼런스나 사례
- 예상 반론과 이에 대한 답변

### 3. 후속 액션 플랜
- 다음 미팅까지 준비할 사항
- 제안할 추가 자료나 데모
- 의사결정권자 참여 유도 방안

### 4. 제안 조정 사항
- 기존 제안서에서 강조해야 할 부분
- 수정이나 보완이 필요한 부분
- 고객 맞춤형 추가 제안

### 5. 협상 전략
- 예상 협상 포인트
- 양보 가능한 부분과 불가능한 부분
- 계약 성사를 위한 핵심 전략

실용적이고 구체적인 조언을 제공해주세요. 영업 현장에서 바로 활용할 수 있도록 작성해주세요.`

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
