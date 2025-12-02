import { GoogleGenerativeAI } from "@google/generative-ai"
import prisma from "./prisma"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "")

// 캐시된 모델 이름 (서버 재시작 시까지 유지)
let cachedModelName: string | null = null

interface GeminiModel {
  name: string
  supportedGenerationMethods?: string[]
}

/**
 * 사용 가능한 최신 Gemini 모델을 자동으로 선택합니다.
 * 우선순위: Flash > Pro (Flash가 더 빠르고 비용 효율적)
 * 버전: 최신 버전 우선 (2.5 > 2.0 > 1.5)
 */
async function getLatestAvailableModel(): Promise<string> {
  // 이미 모델을 선택했다면 캐시된 값 사용
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

    // generateContent를 지원하는 모델만 필터링
    const availableModels = (data.models as GeminiModel[]).filter(
      (model) =>
        model.supportedGenerationMethods?.includes("generateContent") &&
        model.name.includes("gemini")
    )

    if (availableModels.length === 0) {
      throw new Error("No compatible models found")
    }

    // 모델 이름에서 버전 추출 및 정렬 (최신 버전 우선)
    const sortedModels = availableModels.sort((a, b) => {
      const aName = a.name.replace("models/", "")
      const bName = b.name.replace("models/", "")

      // Flash 모델 우선 (더 빠르고 비용 효율적)
      const aIsFlash = aName.includes("flash")
      const bIsFlash = bName.includes("flash")
      if (aIsFlash && !bIsFlash) return -1
      if (!aIsFlash && bIsFlash) return 1

      // 버전 번호 비교 (2.5 > 2.0 > 1.5)
      const aVersion = parseFloat(aName.match(/\d+\.\d+/)?.[0] || "0")
      const bVersion = parseFloat(bName.match(/\d+\.\d+/)?.[0] || "0")
      return bVersion - aVersion
    })

    // 최적의 모델 선택
    const selectedModel = sortedModels[0].name.replace("models/", "")
    cachedModelName = selectedModel

    console.log(`🤖 Selected Gemini model: ${selectedModel}`)
    return selectedModel
  } catch (error) {
    console.error("Error fetching available models:", error)
    // 폴백: 안정적인 기본 모델 사용
    cachedModelName = "gemini-2.5-flash"
    console.log(`⚠️  Using fallback model: ${cachedModelName}`)
    return cachedModelName
  }
}

export interface AnalysisSlide {
  slideNumber: number
  title: string
  content: string
  chartType?: "none" | "bar" | "pie" | "line"
  chartData?: unknown
  speaker_notes?: string
}

export interface AnalysisResult {
  slides: AnalysisSlide[]
}

export interface TextAnalysisResult {
  analysis: string
}

export interface UploadedGeminiFile {
  file: Awaited<ReturnType<typeof uploadFileToGemini>>
  filename: string
}

interface RawSlideData {
  slideNumber: number
  title: string
  content: string
  speaker_notes?: string
  type?: string
}

/**
 * 데이터베이스에서 프롬프트를 가져오고 변수를 치환합니다.
 */
async function getPrompt(name: string, variables: Record<string, string>): Promise<string> {
  const promptRecord = await prisma.prompt.findUnique({
    where: { name }
  })

  if (!promptRecord) {
    throw new Error(`Prompt not found: ${name}`)
  }

  let prompt = promptRecord.content

  // 변수 치환
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g')
    prompt = prompt.replace(regex, value)
  }

  return prompt
}

/**
 * Gemini File API를 사용하여 파일을 업로드하고 URI를 반환합니다.
 */
export async function uploadFileToGemini(filePath: string, mimeType: string) {
  const { GoogleAIFileManager } = await import("@google/generative-ai/server")

  const fileManager = new GoogleAIFileManager(process.env.GOOGLE_GEMINI_API_KEY || "")

  const uploadResponse = await fileManager.uploadFile(filePath, {
    mimeType,
    displayName: filePath.split("/").pop() || "uploaded-file",
  })

  console.log(`✓ File uploaded: ${uploadResponse.file.displayName}`)
  return uploadResponse.file
}

/**
 * 1단계: 현황분석 (현황 및 예상 리스크)
 */
export async function analyzeInitialRisk(
  companyInfo: {
    companyName: string
    businessNumber: string
    representative: string
    industry?: string
  },
  uploadedFiles: UploadedGeminiFile[],
  additionalRequest?: string
): Promise<TextAnalysisResult> {
  const modelName = await getLatestAvailableModel()
  const model = genAI.getGenerativeModel({ model: modelName })

  const fileList = uploadedFiles.map(f => `- ${f.filename}`).join("\n")

  // 데이터베이스에서 프롬프트 가져오기
  const prompt = await getPrompt('step1-initial-risk-analysis', {
    companyName: companyInfo.companyName,
    businessNumber: companyInfo.businessNumber,
    representative: companyInfo.representative,
    industry: companyInfo.industry ? `**업종:** ${companyInfo.industry}` : "",
    fileList: fileList,
    additionalRequest: additionalRequest ? `\n**추가 분석 요청사항:**\n${additionalRequest}\n` : ""
  })

  try {
    const parts = [
      { text: prompt },
      ...uploadedFiles.map(f => ({
        fileData: {
          mimeType: f.file.mimeType,
          fileUri: f.file.uri
        }
      }))
    ]

    const result = await model.generateContent(parts)
    const response = await result.response
    const text = response.text()

    return {
      analysis: text
    }
  } catch (error) {
    console.error("Gemini API error (initial risk analysis):", error)
    throw new Error("현황분석 중 오류가 발생했습니다")
  }
}

/**
 * 2단계: 솔루션 도출 - 상세 텍스트 분석 결과를 생성합니다.
 */
export async function analyzeCompanyText(
  companyInfo: {
    companyName: string
    businessNumber: string
    representative: string
    industry?: string
  },
  uploadedFiles: UploadedGeminiFile[],
  initialRiskAnalysis?: string
): Promise<TextAnalysisResult> {
  const modelName = await getLatestAvailableModel()
  const model = genAI.getGenerativeModel({ model: modelName })

  const fileList = uploadedFiles.map(f => `- ${f.filename}`).join("\n")

  // 데이터베이스에서 프롬프트 가져오기
  const prompt = await getPrompt('step2-solution-sales-script', {
    companyName: companyInfo.companyName,
    businessNumber: companyInfo.businessNumber,
    representative: companyInfo.representative,
    industry: companyInfo.industry ? `**업종:** ${companyInfo.industry}` : "",
    fileList: fileList,
    initialRiskAnalysis: initialRiskAnalysis ? `\n## 1단계 현황분석 결과\n이미 다음과 같은 현황분석이 완료되었습니다. 이를 참고하여 더 깊이 있는 솔루션 도출을 진행하십시오:\n\n${initialRiskAnalysis}\n` : ""
  })

  try {
    const parts = [
      { text: prompt },
      ...uploadedFiles.map(f => ({
        fileData: {
          mimeType: f.file.mimeType,
          fileUri: f.file.uri
        }
      }))
    ]

    const result = await model.generateContent(parts)
    const response = await result.response
    const text = response.text()

    return {
      analysis: text
    }
  } catch (error) {
    console.error("Gemini API error (text analysis):", error)
    throw new Error("AI 분석 중 오류가 발생했습니다")
  }
}

/**
 * 3단계: 텍스트 분석을 기반으로 프레젠테이션 슬라이드를 생성합니다.
 */
export async function generatePresentationSlides(
  textAnalysis: string,
  companyName: string
): Promise<AnalysisResult> {
  const modelName = await getLatestAvailableModel()
  const model = genAI.getGenerativeModel({ model: modelName })

  // 데이터베이스에서 프롬프트 가져오기
  const prompt = await getPrompt('step3-presentation-generation', {
    companyName: companyName,
    textAnalysis: textAnalysis
  })

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // JSON 부분만 추출 (가끔 마크다운 블록으로 감싸져 나오는 경우 대비)
    let jsonText = text

    // 마크다운 코드 블록 제거
    const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1]
    } else {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonText = jsonMatch[0]
      }
    }

    let parsedData: { slides: RawSlideData[] }
    try {
      parsedData = JSON.parse(jsonText)
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      console.error("Problematic JSON (first 1000 chars):", jsonText.substring(0, 1000))
      console.error("Problematic JSON (around error position):", jsonText.substring(4700, 4900))

      // 일반적인 JSON 이스케이프 문제 시도 수정
      try {
        // 잘못된 백슬래시 시퀀스 수정 시도
        const fixedJson = jsonText
          .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')  // 유효하지 않은 이스케이프 시퀀스 수정

        parsedData = JSON.parse(fixedJson)
        console.log("JSON parsing succeeded after fixing escape sequences")
      } catch (retryError) {
        console.error("JSON parsing failed even after attempting fixes")
        throw new Error("Invalid JSON response from AI")
      }
    }

    // AnalysisResult 타입으로 매핑
    const analysisResult: AnalysisResult = {
      slides: parsedData.slides.map((slide) => ({
        slideNumber: slide.slideNumber,
        title: slide.title,
        content: slide.content,
        // speaker_notes가 API 응답에 있다면 포함 (옵셔널)
        speaker_notes: slide.speaker_notes || "",
        chartType: "none" as const,
      }))
    }

    return analysisResult
  } catch (error) {
    console.error("Gemini API error (presentation generation):", error)
    throw new Error("프레젠테이션 생성 중 오류가 발생했습니다")
  }
}