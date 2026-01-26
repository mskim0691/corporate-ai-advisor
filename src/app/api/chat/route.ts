import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { searchKnowledgeWithDb, KnowledgeEntry } from "@/lib/consulting-knowledge"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "")

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface ChatRequest {
  message: string
  history?: ChatMessage[]
}

/**
 * RAG 기반 법인컨설팅 AI 챗봇
 * 출처가 있는 지식 베이스를 기반으로 답변하며,
 * 출처가 없거나 불확실한 경우 솔직하게 모른다고 답변
 */
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      )
    }

    const body: ChatRequest = await req.json()
    const { message, history = [] } = body

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "메시지를 입력해주세요" },
        { status: 400 }
      )
    }

    // 1. 지식 베이스에서 관련 정보 검색 (RAG) - DB와 정적 지식 모두 검색
    const relevantKnowledge = await searchKnowledgeWithDb(message, 5)

    // 2. 컨텍스트 구성
    const knowledgeContext = buildKnowledgeContext(relevantKnowledge)

    // 3. 시스템 프롬프트 구성
    const systemPrompt = buildSystemPrompt(knowledgeContext, relevantKnowledge.length > 0)

    // 4. Gemini API 호출 (환경변수로 모델 설정 가능, 기본값: 최신 Gemini 2.0)
    const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash"
    const model = genAI.getGenerativeModel({ model: modelName })

    // 대화 히스토리 구성
    const chatHistory = history.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }))

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.3, // 낮은 온도로 더 정확한 답변
      },
    })

    // 사용자 질문에 시스템 프롬프트 포함
    const fullPrompt = `${systemPrompt}

사용자 질문: ${message}`

    const result = await chat.sendMessage(fullPrompt)
    const response = await result.response
    const answer = response.text()

    // 5. 사용된 출처 정보 추출
    const sources = relevantKnowledge.map(k => ({
      category: k.category,
      source: k.source,
      sourceUrl: k.sourceUrl
    }))

    return NextResponse.json({
      answer,
      sources: sources.length > 0 ? sources : null,
      hasReliableSource: relevantKnowledge.length > 0
    })

  } catch (error) {
    console.error("Chat API error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Error details:", errorMessage)
    return NextResponse.json(
      { error: "답변 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", details: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * 지식 베이스 컨텍스트 구성
 */
function buildKnowledgeContext(knowledge: KnowledgeEntry[]): string {
  if (knowledge.length === 0) {
    return ""
  }

  let context = "=== 참고 자료 (지식 베이스) ===\n\n"

  for (const entry of knowledge) {
    context += `[${entry.category} - ${entry.subcategory}]\n`
    context += `질문: ${entry.question}\n`
    context += `답변: ${entry.answer}\n`
    context += `출처: ${entry.source}\n`
    if (entry.sourceUrl) {
      context += `출처 URL: ${entry.sourceUrl}\n`
    }
    context += `최종 업데이트: ${entry.lastUpdated}\n`
    context += "\n---\n\n"
  }

  return context
}

/**
 * 시스템 프롬프트 구성
 */
function buildSystemPrompt(knowledgeContext: string, hasKnowledge: boolean): string {
  const basePrompt = `당신은 법인컨설팅 전문 AI 어시스턴트입니다.

## 핵심 원칙

1. **검증된 출처가 있는 경우**
   - 제공된 지식 베이스의 정보를 기반으로 자신있게 답변하세요
   - 답변 시 출처를 명시하세요 (예: "[출처: 국세청, 법인세법 제55조]")

2. **검증된 출처가 없는 경우에도 도움을 제공**
   - 일반적인 실무 관행이나 통상적인 방식으로 답변해주세요
   - 단, 답변 마지막에 반드시 다음 주의사항을 추가하세요:
     "※ 위 내용은 일반적인 안내이며, 정확한 내용은 관련 법령이나 전문가를 통해 확인하시기 바랍니다."

3. **전문가 상담 권장**
   - 복잡한 세무/법률 문제는 전문가 상담을 권장하세요
   - 구체적인 금액 계산이나 절세 전략은 세무사/회계사 상담 필요
   - 법적 분쟁이 예상되는 경우 변호사 상담 권장

4. **답변 형식**
   - 친절하고 이해하기 쉽게 답변
   - 중요한 내용은 불릿 포인트로 정리
   - 숫자, 세율, 기한 등은 가능한 정확하게 명시

## 주의사항
- 세법/규정은 자주 변경되므로 최신 정보 확인 필요 언급
- 개인의 상황에 따라 적용이 다를 수 있음을 안내`

  if (hasKnowledge) {
    return `${basePrompt}

## 참고할 수 있는 지식 베이스 정보

아래 정보를 우선적으로 참고하여 답변하세요.

${knowledgeContext}`
  } else {
    return `${basePrompt}

## 현재 상황
사용자의 질문과 정확히 일치하는 정보가 지식 베이스에 없습니다.
일반적인 실무 지식을 바탕으로 답변하되, 반드시 답변 마지막에
"※ 위 내용은 일반적인 안내이며, 정확한 내용은 관련 법령이나 전문가를 통해 확인하시기 바랍니다."
라는 주의사항을 추가해주세요.`
  }
}
