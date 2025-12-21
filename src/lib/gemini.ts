import { GoogleGenerativeAI } from "@google/generative-ai"
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server"
import { GoogleGenAI } from "@google/genai"
import { Blob } from "buffer"
import prisma from "./prisma"

// Conditionally import supabase only if env vars are present
const USE_SUPABASE = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
let supabase: any = null

if (USE_SUPABASE) {
  const { supabase: supabaseClient } = require("./supabase")
  supabase = supabaseClient
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "")
const fileManager = new GoogleAIFileManager(process.env.GOOGLE_GEMINI_API_KEY || "")
const genAIImage = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY || "" })

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

// The new return type from the fileManager.uploadFile method
type UploadedFile = Awaited<ReturnType<typeof fileManager.uploadFile>>["file"]

export interface UploadedGeminiFile {
  file: UploadedFile
  filename: string
}

interface RawSlideData {
  slideNumber: number
  title: string
  content: string
  speaker_notes?: string
  type?: string
}

// 기본 프롬프트 템플릿
const DEFAULT_PROMPTS: Record<string, string> = {
  'step3-presentation-generation': `당신은 전문 경영 컨설턴트입니다. 아래 분석 내용을 바탕으로 프레젠테이션 슬라이드를 생성해주세요.

회사명: {{companyName}}

분석 내용:
{{textAnalysis}}

다음 JSON 형식으로 슬라이드를 생성해주세요:
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "슬라이드 제목",
      "content": "슬라이드 내용 (마크다운 형식 지원)",
      "speaker_notes": "발표자 노트"
    }
  ]
}

슬라이드 구성:
1. 표지 (회사명, 컨설팅 제목)
2. 목차
3. 현황 분석 요약
4. 주요 리스크 분석
5. 솔루션 제안 (여러 슬라이드)
6. 기대 효과
7. 실행 계획
8. 결론 및 다음 단계

각 슬라이드는 간결하고 명확하게 작성하며, 핵심 포인트를 불릿 포인트로 정리해주세요.
총 10-15개의 슬라이드로 구성해주세요.`
}

/**
 * 데이터베이스에서 프롬프트를 가져오고 변수를 치환합니다.
 * 프롬프트가 없으면 기본 프롬프트를 사용합니다.
 */
async function getPrompt(name: string, variables: Record<string, string>): Promise<string> {
  const promptRecord = await prisma.prompt.findUnique({
    where: { name }
  })

  let prompt: string

  if (!promptRecord) {
    // 기본 프롬프트 사용
    if (DEFAULT_PROMPTS[name]) {
      console.log(`⚠️ Prompt "${name}" not found in database, using default prompt`)
      prompt = DEFAULT_PROMPTS[name]
    } else {
      throw new Error(`Prompt not found: ${name}`)
    }
  } else {
    prompt = promptRecord.content
  }

  // 변수 치환
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g')
    prompt = prompt.replace(regex, value)
  }

  return prompt
}

/**
 * Downloads a file from Supabase Storage (or local filesystem) and uploads it to Gemini.
 */
export async function uploadFileToGemini(filePath: string, mimeType: string) {
  const fs = await import("fs/promises")
  const path = await import("path")
  const os = await import("os")

  let buffer: Buffer

  if (USE_SUPABASE) {
    // 1. Download from Supabase
    const { data: blob, error: downloadError } = await supabase.storage
      .from("uploads")
      .download(filePath)

    if (downloadError) {
      console.error("Supabase download error:", downloadError)
      throw new Error(`Failed to download file from Supabase: ${filePath}`)
    }

    buffer = Buffer.from(await blob.arrayBuffer())
  } else {
    // 1. Read from local filesystem
    const uploadDir = process.env.UPLOAD_DIR || "./uploads"
    const fullPath = path.join(process.cwd(), uploadDir, filePath)

    try {
      buffer = await fs.readFile(fullPath)
      console.log(`✓ File read from local storage: ${fullPath}`)
    } catch (error) {
      console.error(`Local file read error for ${filePath}:`, error)
      throw new Error(`Failed to read file from local storage: ${filePath}`)
    }
  }

  // 2. Upload to Gemini using a temporary file
  try {
    const tempDir = os.tmpdir()
    const tempFilePath = path.join(tempDir, `gemini-upload-${Date.now()}-${filePath.split("/").pop()}`)

    await fs.writeFile(tempFilePath, buffer)

    const displayName = filePath.split("/").pop() || "uploaded-file"

    console.log(`Uploading ${displayName} to Gemini...`)
    const uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType,
      displayName,
    })

    // Clean up temp file
    await fs.unlink(tempFilePath)

    console.log(`✓ File uploaded: ${uploadResult.file.displayName} (${uploadResult.file.uri})`)

    // Wait until the file is processed and ready
    let file = uploadResult.file
    while (file.state === FileState.PROCESSING) {
      process.stdout.write(".");
      await new Promise(resolve => setTimeout(resolve, 5_000)); // Wait 5 seconds
      file = await fileManager.getFile(file.name);
    }

    if (file.state === FileState.FAILED) {
      throw new Error("File processing failed on Gemini.");
    }

    return file
  } catch (error) {
    console.error(`Gemini upload error for ${filePath}:`, error)
    throw new Error(`Failed to upload file to Gemini.`)
  }
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
 * 2단계: 솔루션 도출 - Google Search Grounding을 활용한 상세 분석 결과를 생성합니다.
 */
export async function analyzeCompanyText(
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

  // Google Search Grounding을 위한 도구 설정
  const model = genAI.getGenerativeModel({
    model: modelName,
    tools: [
      {
        googleSearch: {} as any
      }
    ] as any
  })

  const fileList = uploadedFiles.map(f => `- ${f.filename}`).join("\n")

  // 데이터베이스에서 프롬프트 가져오기
  const prompt = await getPrompt('step2-solution-sales-script', {
    companyName: companyInfo.companyName,
    businessNumber: companyInfo.businessNumber,
    representative: companyInfo.representative,
    industry: companyInfo.industry ? `**업종:** ${companyInfo.industry}` : "",
    fileList: fileList,
    additionalRequest: additionalRequest ? `\n**추가 정보:**\n${additionalRequest}\n` : ""
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

    console.log(`🔍 Starting detailed analysis with Google Search Grounding for ${companyInfo.companyName}...`)

    const result = await model.generateContent(parts)
    const response = await result.response
    const text = response.text()

    console.log(`✓ Detailed analysis completed with grounding`)

    return {
      analysis: text
    }
  } catch (error) {
    console.error("Gemini API error (text analysis with grounding):", error)
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

// 이미지 생성 모델 목록 (우선순위 순)
const IMAGE_MODELS = [
  "gemini-3-pro-image-preview",
  "gemini-2.5-flash-preview-image-generation",
]

// 재시도 설정
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

/**
 * 지수 백오프로 재시도하며 이미지를 생성합니다.
 */
async function generateImageWithRetry(
  prompt: string,
  modelIndex: number = 0,
  retryCount: number = 0
): Promise<string> {
  const model = IMAGE_MODELS[modelIndex]

  try {
    console.log(`🎨 Trying model: ${model} (attempt ${retryCount + 1}/${MAX_RETRIES})`)

    const response = await genAIImage.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K",
        },
      } as any,
    })

    // 응답에서 이미지 데이터 추출
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No candidates in response")
    }

    const parts = response.candidates[0].content?.parts || []

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        console.log(`✓ Image generated with ${model}`)
        return part.inlineData.data
      }
    }

    throw new Error("No image data in response")
  } catch (error: any) {
    const errorMessage = error?.message || String(error)
    const isOverloaded = errorMessage.includes("503") ||
                         errorMessage.includes("overloaded") ||
                         errorMessage.includes("UNAVAILABLE")

    console.error(`❌ Error with ${model}: ${errorMessage}`)

    // 재시도 가능한 경우
    if (retryCount < MAX_RETRIES - 1) {
      const delay = RETRY_DELAY_MS * Math.pow(2, retryCount) // 지수 백오프
      console.log(`⏳ Retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return generateImageWithRetry(prompt, modelIndex, retryCount + 1)
    }

    // 다음 모델로 폴백
    if (modelIndex < IMAGE_MODELS.length - 1) {
      console.log(`🔄 Falling back to next model: ${IMAGE_MODELS[modelIndex + 1]}`)
      return generateImageWithRetry(prompt, modelIndex + 1, 0)
    }

    throw new Error(`All models failed: ${errorMessage}`)
  }
}

/**
 * Gemini Imagen을 사용하여 슬라이드 이미지를 생성합니다.
 * @param slideContent 슬라이드 내용 (제목, 본문)
 * @param slideNumber 슬라이드 번호
 * @param companyName 회사명
 * @returns Base64 인코딩된 이미지 데이터
 */
export async function generateSlideImage(
  slideContent: { title: string; content: string },
  slideNumber: number,
  companyName: string
): Promise<string> {
  try {
    // 슬라이드 내용을 이미지 생성 프롬프트로 변환
    const prompt = `Create a professional business presentation slide image with the following specifications:

SLIDE ${slideNumber} for ${companyName}

TITLE: ${slideContent.title}

CONTENT:
${slideContent.content}

DESIGN REQUIREMENTS:
- Professional, modern corporate presentation style
- Clean, minimalist design with clear visual hierarchy
- Use blue and white color scheme as primary colors
- Title should be prominently displayed at the top
- Content should be organized with clear bullet points or sections
- Include subtle business-related visual elements or icons if appropriate
- Professional font styling suitable for business presentations
- 16:9 aspect ratio presentation slide format
- High contrast for readability

Generate a polished, professional presentation slide that would be suitable for a business consulting report.`

    console.log(`🎨 Generating image for slide ${slideNumber}...`)

    const imageData = await generateImageWithRetry(prompt)
    console.log(`✓ Image generated for slide ${slideNumber}`)
    return imageData
  } catch (error) {
    console.error(`Error generating image for slide ${slideNumber}:`, error)
    throw new Error(`슬라이드 ${slideNumber} 이미지 생성 중 오류가 발생했습니다`)
  }
}

/**
 * 여러 슬라이드의 이미지를 병렬로 생성합니다.
 * @param slides 슬라이드 배열
 * @param companyName 회사명
 * @returns Base64 인코딩된 이미지 데이터 배열
 */
export async function generateAllSlideImages(
  slides: Array<{ slideNumber: number; title: string; content: string }>,
  companyName: string
): Promise<string[]> {
  console.log(`🎨 Starting image generation for ${slides.length} slides...`)

  // 순차적으로 이미지 생성 (API rate limit 고려)
  const images: string[] = []

  for (const slide of slides) {
    try {
      const imageData = await generateSlideImage(
        { title: slide.title, content: slide.content },
        slide.slideNumber,
        companyName
      )
      images.push(imageData)

      // API rate limit을 위한 딜레이 (1초)
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`Failed to generate image for slide ${slide.slideNumber}:`, error)
      // 실패한 슬라이드는 빈 문자열로 처리
      images.push("")
    }
  }

  console.log(`✓ Generated ${images.filter(img => img).length}/${slides.length} slide images`)
  return images
}

/**
 * 프레젠테이션 표지 이미지를 생성합니다.
 * @param title 프레젠테이션 제목
 * @param companyName 회사명
 * @param representative 대표자명
 * @returns Base64 인코딩된 이미지 데이터
 */
export async function generateCoverImage(
  title: string,
  companyName: string,
  representative: string
): Promise<string | null> {
  try {
    const today = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const prompt = `Create a professional business presentation COVER PAGE image with the following specifications:

COMPANY NAME: ${companyName}
TITLE: ${title}
REPRESENTATIVE: ${representative}
DATE: ${today}

DESIGN REQUIREMENTS:
- This is a COVER PAGE, not a content slide
- Professional, elegant, modern corporate presentation cover style
- Clean, minimalist design with premium look and feel
- Use blue and white color scheme as primary colors
- Company name should be displayed prominently at the top
- Title should be large and centered in the middle of the page
- Representative name and date should be at the bottom
- Include subtle business-related decorative elements or patterns
- Korean text must be clearly readable
- 16:9 aspect ratio presentation slide format
- High contrast for readability
- Make it look like a professional consulting report cover

Generate a polished, professional cover page image that would be suitable as the first page of a business consulting report presentation.`

    console.log(`🎨 Generating cover image...`)

    const imageData = await generateImageWithRetry(prompt)
    console.log(`✓ Cover image generated`)
    return imageData
  } catch (error) {
    console.error(`Error generating cover image:`, error)
    return null
  }
}