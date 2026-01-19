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

위 미팅 결과를 바탕으로 아래 형식에 맞춰 작성해주세요.
**중요: 반드시 마크다운 헤더(##, ###, ####)를 사용하여 계층 구조를 명확히 해주세요.**

## 1. 미팅 결과 분석

### 1.1 고객의 주요 관심사항
(내용 작성)

### 1.2 긍정적인 신호
(내용 작성)

### 1.3 우려 사항
(내용 작성)

### 1.4 의사결정 단계 평가
(관심/검토/결정 단계 중 어디에 해당하는지 평가)

## 2. 고객 우려사항 대응 전략

### 2.1 우려사항별 대응 방안
(각 우려사항에 대한 구체적인 대응 방안)

### 2.2 활용 가능한 레퍼런스
(활용할 수 있는 레퍼런스나 사례)

### 2.3 예상 반론 및 답변
(예상 반론과 이에 대한 답변)

## 3. 후속 액션 플랜

### 3.1 다음 미팅 준비사항
(다음 미팅까지 준비할 사항)

### 3.2 추가 자료 및 데모 제안
(제안할 추가 자료나 데모)

### 3.3 의사결정권자 참여 유도
(의사결정권자 참여 유도 방안)

## 4. 제안 조정 사항

### 4.1 강조 포인트
(기존 제안서에서 강조해야 할 부분)

### 4.2 수정/보완 필요사항
(수정이나 보완이 필요한 부분)

### 4.3 고객 맞춤형 추가 제안
(고객 맞춤형 추가 제안)

## 5. 협상 전략

### 5.1 예상 협상 포인트
(예상 협상 포인트)

### 5.2 양보 가능/불가능 영역
(양보 가능한 부분과 불가능한 부분)

### 5.3 계약 성사 핵심 전략
(계약 성사를 위한 핵심 전략)

---
실용적이고 구체적인 조언을 제공해주세요. 영업 현장에서 바로 활용할 수 있도록 작성해주세요.
각 섹션 사이에 충분한 줄바꿈을 넣어 가독성을 높여주세요.`

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
