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

    const prompt = `당신은 전문 B2B 영업 컨설턴트입니다. 아래 정보를 바탕으로 후속 미팅 대응 전략을 제안해주세요.

[회사 정보]
- 회사명: ${project.companyName}
- 사업자번호: ${project.businessNumber}
- 대표자: ${project.representative}
${project.industry ? `- 업종: ${project.industry}` : ""}

[기존 분석 제안서 내용 요약]
${project.report.textAnalysis.substring(0, 5000)}
${project.report.textAnalysis.length > 5000 ? "\n... (이하 생략)" : ""}

[고객 미팅 결과]
${meetingNotes}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 응답 형식 지침 (매우 중요!)

반드시 아래의 마크다운 문법을 사용해서 작성하세요:

1. **대제목**: \`## 제목\` 형식 (샵 2개 + 공백 + 제목)
2. **소제목**: \`### 제목\` 형식 (샵 3개 + 공백 + 제목)
3. **리스트**: \`- 항목\` 또는 \`1. 항목\` 형식
4. **강조**: \`**굵은 글씨**\` 형식
5. **인용문**: \`> 인용 내용\` 형식
6. **구분선**: \`---\` 형식

## 예시 출력 형식:

## 1. 미팅 결과 분석

### 1.1 고객의 주요 관심사항

- **비용 절감**: 현재 운영비 대비 30% 절감 가능성에 관심
- **도입 기간**: 빠른 도입을 희망함

> 고객은 특히 ROI에 대한 구체적인 수치를 원하고 있습니다.

### 1.2 긍정적인 신호

1. 대표님이 직접 미팅에 참석
2. 구체적인 견적 요청

---

## 작성해야 할 섹션:

## 1. 미팅 결과 분석
### 1.1 고객의 주요 관심사항
### 1.2 긍정적인 신호
### 1.3 우려 사항
### 1.4 의사결정 단계 평가

## 2. 고객 우려사항 대응 전략
### 2.1 우려사항별 대응 방안
### 2.2 활용 가능한 레퍼런스
### 2.3 예상 반론 및 답변

## 3. 후속 액션 플랜
### 3.1 다음 미팅 준비사항
### 3.2 추가 자료 및 데모 제안
### 3.3 의사결정권자 참여 유도

## 4. 제안 조정 사항
### 4.1 강조 포인트
### 4.2 수정/보완 필요사항
### 4.3 고객 맞춤형 추가 제안

## 5. 협상 전략
### 5.1 예상 협상 포인트
### 5.2 양보 가능/불가능 영역
### 5.3 계약 성사 핵심 전략

---

위 섹션들을 모두 포함하여 실용적이고 구체적인 조언을 작성해주세요.
각 섹션에서 반드시 \`##\`, \`###\` 헤더와 \`-\` 리스트, \`>\` 인용문, \`---\` 구분선을 적극 활용하세요.`

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
