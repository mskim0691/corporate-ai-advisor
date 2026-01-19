import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const followupPromptTemplate = `당신은 전문 B2B 영업 컨설턴트입니다. 아래 정보를 바탕으로 후속 미팅 대응 전략을 제안해주세요.

[회사 정보]
- 회사명: {{companyName}}
- 사업자번호: {{businessNumber}}
- 대표자: {{representative}}
{{#if industry}}- 업종: {{industry}}{{/if}}

[기존 분석 제안서 내용 요약]
{{textAnalysisSummary}}

[고객 미팅 결과]
{{meetingNotes}}

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

async function main() {
  console.log('Seeding followup prompt...')

  const existingPrompt = await prisma.prompt.findUnique({
    where: { name: 'followup_analysis' }
  })

  if (existingPrompt) {
    console.log('Followup prompt already exists, updating...')
    await prisma.prompt.update({
      where: { name: 'followup_analysis' },
      data: {
        content: followupPromptTemplate,
        description: '후속 미팅 대응 분석 프롬프트 - 미팅 결과를 바탕으로 후속 전략 생성'
      }
    })
  } else {
    console.log('Creating followup prompt...')
    await prisma.prompt.create({
      data: {
        name: 'followup_analysis',
        content: followupPromptTemplate,
        description: '후속 미팅 대응 분석 프롬프트 - 미팅 결과를 바탕으로 후속 전략 생성'
      }
    })
  }

  console.log('Done!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
