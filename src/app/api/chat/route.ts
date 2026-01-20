import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { searchKnowledge, KnowledgeEntry } from "@/lib/consulting-knowledge"

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

    // 1. 지식 베이스에서 관련 정보 검색 (RAG)
    const relevantKnowledge = searchKnowledge(message, 5)

    // 2. 컨텍스트 구성
    const knowledgeContext = buildKnowledgeContext(relevantKnowledge)

    // 3. 시스템 프롬프트 구성
    const systemPrompt = buildSystemPrompt(knowledgeContext, relevantKnowledge.length > 0)

    // 4. Gemini API 호출
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

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
    return NextResponse.json(
      { error: "답변 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
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

## 핵심 원칙 (매우 중요)

1. **출처 기반 답변만 제공**
   - 반드시 제공된 지식 베이스의 정보만을 기반으로 답변하세요
   - 답변 시 항상 출처를 명시하세요 (예: "[출처: 국세청, 법인세법 제55조]")
   - 출처가 없는 정보는 절대 추측하거나 지어내지 마세요

2. **불확실한 경우 솔직하게 모른다고 답변**
   - 지식 베이스에 관련 정보가 없으면: "죄송합니다. 해당 질문에 대한 신뢰할 수 있는 정보가 제 데이터베이스에 없습니다."
   - 부분적으로만 답변 가능하면: "일부 정보만 답변 가능합니다. [답변 가능한 부분]에 대해서만 안내드리겠습니다."
   - 정보가 오래되었을 수 있으면: "이 정보는 [날짜] 기준이며, 최신 법령은 전문가에게 확인하시기 바랍니다."

3. **전문가 상담 권장**
   - 복잡한 세무/법률 문제는 반드시 전문가 상담을 권장하세요
   - 구체적인 금액 계산이나 절세 전략은 세무사/회계사 상담 필요
   - 법적 분쟁이 예상되는 경우 변호사 상담 권장

4. **답변 형식**
   - 간결하고 명확하게 답변
   - 중요한 내용은 불릿 포인트로 정리
   - 숫자, 세율, 기한 등은 정확하게 명시
   - 답변 마지막에 출처를 명시

## 주의사항
- 세법/규정은 자주 변경되므로 항상 최신 정보 확인 필요 언급
- 개인의 상황에 따라 적용이 다를 수 있음을 안내
- 일반적인 정보 제공일 뿐 세무/법률 자문이 아님을 명시`

  if (hasKnowledge) {
    return `${basePrompt}

## 참고할 수 있는 지식 베이스 정보

아래 정보를 기반으로 답변하세요. 아래 정보에 없는 내용은 답변하지 마세요.

${knowledgeContext}`
  } else {
    return `${basePrompt}

## 현재 상황
사용자의 질문과 관련된 정보가 지식 베이스에서 발견되지 않았습니다.
솔직하게 모른다고 답변하고, 전문가 상담을 권장해주세요.`
  }
}
