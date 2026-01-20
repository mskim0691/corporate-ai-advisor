/**
 * 법인컨설팅 지식 베이스 - RAG용 출처 포함 데이터
 * 모든 정보에는 출처가 명시되어 있어야 함
 */

export interface KnowledgeEntry {
  id: string
  category: string
  subcategory: string
  question: string
  answer: string
  source: string
  sourceUrl?: string
  lastUpdated: string
  keywords: string[]
}

export const consultingKnowledge: KnowledgeEntry[] = [
  // ========== 법인세 관련 ==========
  {
    id: "corp-tax-001",
    category: "법인세",
    subcategory: "세율",
    question: "법인세 세율은 어떻게 되나요?",
    answer: `2024년 기준 법인세 세율은 다음과 같습니다:
- 과세표준 2억원 이하: 9%
- 과세표준 2억원 초과 ~ 200억원 이하: 19%
- 과세표준 200억원 초과 ~ 3,000억원 이하: 21%
- 과세표준 3,000억원 초과: 24%

※ 중소기업의 경우 2억원 이하 구간에 대해 특례세율 적용 가능`,
    source: "국세청, 법인세법 제55조",
    sourceUrl: "https://www.nts.go.kr",
    lastUpdated: "2024-01-01",
    keywords: ["법인세", "세율", "과세표준", "중소기업"]
  },
  {
    id: "corp-tax-002",
    category: "법인세",
    subcategory: "신고기한",
    question: "법인세 신고 기한은 언제인가요?",
    answer: `법인세 신고·납부 기한:
- 12월 결산법인: 다음해 3월 31일까지
- 3월 결산법인: 6월 30일까지
- 6월 결산법인: 9월 30일까지
- 9월 결산법인: 12월 31일까지

※ 사업연도 종료일이 속하는 달의 말일부터 3개월 이내`,
    source: "국세청, 법인세법 제60조",
    sourceUrl: "https://www.nts.go.kr",
    lastUpdated: "2024-01-01",
    keywords: ["법인세", "신고", "기한", "결산"]
  },
  {
    id: "corp-tax-003",
    category: "법인세",
    subcategory: "중간예납",
    question: "법인세 중간예납은 무엇인가요?",
    answer: `법인세 중간예납:
- 사업연도가 6개월을 초과하는 법인은 중간예납 의무가 있습니다
- 납부기한: 사업연도 개시일부터 6개월이 되는 날로부터 2개월 이내
- 계산방법:
  1) 직전 사업연도 산출세액 × 6/12
  2) 또는 당해 사업연도 6개월간 실적 기준 계산

※ 중소기업은 직전 사업연도 법인세가 50만원 이하인 경우 면제`,
    source: "국세청, 법인세법 제63조",
    sourceUrl: "https://www.nts.go.kr",
    lastUpdated: "2024-01-01",
    keywords: ["법인세", "중간예납", "납부", "중소기업"]
  },

  // ========== 가업승계 관련 ==========
  {
    id: "succession-001",
    category: "가업승계",
    subcategory: "가업상속공제",
    question: "가업상속공제란 무엇인가요?",
    answer: `가업상속공제 제도:
- 중소기업 또는 매출액 5,000억원 미만 중견기업의 가업을 상속받는 경우 적용
- 공제한도:
  - 가업영위기간 10년 이상: 300억원
  - 가업영위기간 20년 이상: 400억원
  - 가업영위기간 30년 이상: 600억원

주요 요건:
1. 피상속인 요건: 10년 이상 계속 경영, 50% 이상 지분 보유
2. 상속인 요건: 상속개시일 전 2년 이상 가업 종사
3. 사후관리: 7년간 업종유지, 고용유지, 지분유지 등`,
    source: "국세청, 상속세 및 증여세법 제18조",
    sourceUrl: "https://www.nts.go.kr",
    lastUpdated: "2024-01-01",
    keywords: ["가업승계", "상속공제", "중소기업", "중견기업", "사후관리"]
  },
  {
    id: "succession-002",
    category: "가업승계",
    subcategory: "가업승계 증여세 과세특례",
    question: "가업승계 증여세 과세특례는 무엇인가요?",
    answer: `가업승계 증여세 과세특례:
- 중소기업 또는 매출액 5,000억원 미만 중견기업 주식을 증여받는 경우 적용
- 과세특례 내용:
  - 100억원까지: 10% 세율 적용
  - 100억원 초과분: 20% 세율 적용
  - 5억원 공제 후 세율 적용

주요 요건:
1. 증여자: 60세 이상, 10년 이상 경영
2. 수증자: 18세 이상, 증여일 전 2년 이상 가업 종사
3. 사후관리: 7년간 업종유지, 고용유지 등

※ 일반 증여세율(10~50%)보다 낮은 세율 적용으로 세부담 경감`,
    source: "국세청, 조세특례제한법 제30조의6",
    sourceUrl: "https://www.nts.go.kr",
    lastUpdated: "2024-01-01",
    keywords: ["가업승계", "증여세", "과세특례", "주식", "세율"]
  },

  // ========== 퇴직금 관련 ==========
  {
    id: "retirement-001",
    category: "퇴직금",
    subcategory: "임원퇴직금 한도",
    question: "임원 퇴직금 손금 한도는 어떻게 되나요?",
    answer: `임원 퇴직금 손금 한도:
- 손금 인정 한도 = 퇴직 전 3년간 평균 총급여 × 1/10 × 근속연수 × 3배

계산 예시 (평균급여 1억원, 근속 20년):
- 한도 = 1억원 × 1/10 × 20년 × 3 = 6억원

주의사항:
1. 한도 초과분은 손금 불산입 (법인세 부담 증가)
2. 정관에 퇴직금 지급규정 명시 필요
3. 주주총회 또는 이사회 결의 필요

※ 2020년 이전 근속기간은 종전 규정(2배) 적용 가능`,
    source: "국세청, 법인세법 시행령 제44조",
    sourceUrl: "https://www.nts.go.kr",
    lastUpdated: "2024-01-01",
    keywords: ["퇴직금", "임원", "손금", "한도", "정관"]
  },
  {
    id: "retirement-002",
    category: "퇴직금",
    subcategory: "퇴직소득세",
    question: "퇴직소득세는 어떻게 계산하나요?",
    answer: `퇴직소득세 계산 방법:
1. 퇴직급여 - 비과세소득 = 퇴직소득금액
2. 퇴직소득금액 - 퇴직소득공제 = 퇴직소득과세표준
3. 환산급여 = (퇴직소득과세표준 / 근속연수) × 12
4. 환산급여에 기본세율 적용하여 환산산출세액 계산
5. 퇴직소득산출세액 = (환산산출세액 / 12) × 근속연수

퇴직소득공제:
- 근속연수 5년 이하: 30만원 × 근속연수
- 근속연수 5년 초과 10년 이하: 150만원 + 50만원 × (근속연수-5)
- 근속연수 10년 초과 20년 이하: 400만원 + 80만원 × (근속연수-10)
- 근속연수 20년 초과: 1,200만원 + 120만원 × (근속연수-20)`,
    source: "국세청, 소득세법 제48조, 제55조",
    sourceUrl: "https://www.nts.go.kr",
    lastUpdated: "2024-01-01",
    keywords: ["퇴직소득세", "퇴직금", "계산", "공제", "환산급여"]
  },

  // ========== 4대보험 관련 ==========
  {
    id: "insurance-001",
    category: "4대보험",
    subcategory: "보험료율",
    question: "4대보험 보험료율은 어떻게 되나요?",
    answer: `2024년 4대보험 보험료율:

1. 국민연금: 9% (사업주 4.5%, 근로자 4.5%)
2. 건강보험: 7.09% (사업주 3.545%, 근로자 3.545%)
   - 장기요양보험: 건강보험료의 12.95%
3. 고용보험:
   - 실업급여: 1.8% (사업주 0.9%, 근로자 0.9%)
   - 고용안정·직업능력개발: 사업주 부담 (규모에 따라 0.25%~0.85%)
4. 산재보험: 업종별 상이 (0.7%~18.6%, 전액 사업주 부담)

※ 월 보수를 기준으로 산정하며, 상·하한액 적용`,
    source: "국민연금공단, 건강보험공단, 근로복지공단",
    sourceUrl: "https://www.nps.or.kr",
    lastUpdated: "2024-01-01",
    keywords: ["4대보험", "국민연금", "건강보험", "고용보험", "산재보험", "보험료율"]
  },
  {
    id: "insurance-002",
    category: "4대보험",
    subcategory: "사업주 의무",
    question: "법인 설립 시 4대보험 가입은 어떻게 하나요?",
    answer: `법인 설립 후 4대보험 가입 절차:

1. 사업장 성립신고 (사업 개시일로부터 14일 이내)
   - 국민연금, 건강보험: 공단에 신고
   - 고용보험, 산재보험: 근로복지공단에 신고

2. 피보험자 자격취득 신고 (입사일로부터 14일 이내)
   - 4대보험 정보연계센터에서 일괄 신고 가능

3. 필요 서류:
   - 사업자등록증 사본
   - 법인등기부등본
   - 근로계약서 또는 임금대장

※ 1인 법인도 대표이사의 4대보험 가입 의무 있음 (고용·산재 제외)`,
    source: "4대사회보험 정보연계센터",
    sourceUrl: "https://www.4insure.or.kr",
    lastUpdated: "2024-01-01",
    keywords: ["4대보험", "가입", "신고", "법인", "사업장"]
  },

  // ========== 법인 설립 관련 ==========
  {
    id: "establish-001",
    category: "법인설립",
    subcategory: "자본금",
    question: "법인 설립 시 최소 자본금은 얼마인가요?",
    answer: `법인 설립 최소 자본금:
- 상법상 최소 자본금 규정 폐지 (2009년 이후)
- 현재 1원 이상으로 법인 설립 가능

그러나 실무상 고려사항:
1. 인허가 업종: 자본금 요건이 있는 경우 있음
   - 건설업: 업종별 5억원 ~ 30억원
   - 여행업: 1억원 ~ 10억원
   - 등록 금융업: 자본금 요건 있음

2. 대출/신용 측면:
   - 자본금이 너무 적으면 거래처 신용도에 영향
   - 은행 대출 시 불리할 수 있음

※ 일반적으로 1,000만원 ~ 5,000만원으로 설립하는 경우 많음`,
    source: "상법 제329조, 중소벤처기업부",
    sourceUrl: "https://www.startbiz.go.kr",
    lastUpdated: "2024-01-01",
    keywords: ["법인설립", "자본금", "최소자본금", "상법"]
  },
  {
    id: "establish-002",
    category: "법인설립",
    subcategory: "설립절차",
    question: "법인 설립 절차는 어떻게 되나요?",
    answer: `주식회사 설립 절차:

1. 정관 작성 및 공증 (발기인 전원 서명)
2. 주식 인수 및 주금 납입
3. 이사, 감사 선임 (발기인회/창립총회)
4. 설립등기 신청 (관할 등기소)
5. 사업자등록 신청 (관할 세무서)

소요기간: 약 2주 ~ 1개월

필요 서류:
- 정관
- 발기인 인감증명서, 주민등록등본
- 주금납입증명서
- 임원 취임승낙서
- 등기신청서

※ 온라인 법인설립시스템(startbiz.go.kr) 이용 시 간편하게 진행 가능`,
    source: "대법원 인터넷등기소, 중소벤처기업부",
    sourceUrl: "https://www.startbiz.go.kr",
    lastUpdated: "2024-01-01",
    keywords: ["법인설립", "절차", "주식회사", "등기", "정관"]
  },

  // ========== 세무조사 관련 ==========
  {
    id: "tax-audit-001",
    category: "세무조사",
    subcategory: "조사유형",
    question: "세무조사 유형에는 어떤 것이 있나요?",
    answer: `세무조사 유형:

1. 정기조사
   - 신고내용 확인 목적의 정기적 조사
   - 업종, 규모 등을 고려하여 선정
   - 통상 4년 이상 무조사 법인 대상

2. 비정기조사 (수시조사)
   - 탈세 혐의 정보 또는 제보가 있는 경우
   - 신고내용에 탈루 혐의가 있는 경우
   - 납세자 요청에 의한 조사

3. 부분조사 vs 전면조사
   - 부분조사: 특정 항목만 조사
   - 전면조사: 전체 세목, 전 기간 조사

조사 기간: 원칙적으로 20일 이내 (연장 가능)`,
    source: "국세청, 국세기본법 제81조의4",
    sourceUrl: "https://www.nts.go.kr",
    lastUpdated: "2024-01-01",
    keywords: ["세무조사", "정기조사", "비정기조사", "조사기간"]
  },

  // ========== 부가가치세 관련 ==========
  {
    id: "vat-001",
    category: "부가가치세",
    subcategory: "세율",
    question: "부가가치세율은 얼마인가요?",
    answer: `부가가치세율:
- 표준세율: 10%
- 영세율: 0% (수출, 외화획득 재화·용역 등)

과세 유형:
1. 과세사업자: 일반과세자, 간이과세자
2. 면세사업자: 기초생활필수품, 의료, 교육 등

신고·납부:
- 예정신고: 1기(4월 25일), 2기(10월 25일)
- 확정신고: 1기(7월 25일), 2기(다음해 1월 25일)

※ 법인사업자는 모두 일반과세자로 분류`,
    source: "국세청, 부가가치세법 제30조",
    sourceUrl: "https://www.nts.go.kr",
    lastUpdated: "2024-01-01",
    keywords: ["부가가치세", "VAT", "세율", "영세율", "면세"]
  },

  // ========== 배당 관련 ==========
  {
    id: "dividend-001",
    category: "배당",
    subcategory: "배당소득세",
    question: "배당소득세는 어떻게 과세되나요?",
    answer: `배당소득세 과세 방법:

1. 원천징수
   - 배당금 지급 시 15.4% 원천징수 (소득세 14% + 지방소득세 1.4%)

2. 종합과세 vs 분리과세
   - 금융소득 2,000만원 초과: 종합과세 (6~45%)
   - 금융소득 2,000만원 이하: 분리과세 (15.4%)

3. Gross-up 제도 (이중과세 조정)
   - 법인에서 이미 법인세 납부한 소득에서 배당
   - 배당소득 × 11% 추가하여 과세표준 산정
   - 산출세액에서 해당 금액 세액공제

※ 대주주(지분 1% 이상 또는 시가 10억원 이상) 배당은 20%(3억 초과 25%) 원천징수`,
    source: "국세청, 소득세법 제17조, 제56조",
    sourceUrl: "https://www.nts.go.kr",
    lastUpdated: "2024-01-01",
    keywords: ["배당", "배당소득세", "원천징수", "종합과세", "분리과세"]
  },

  // ========== 자금조달 관련 ==========
  {
    id: "funding-001",
    category: "자금조달",
    subcategory: "가지급금",
    question: "가지급금이란 무엇이고 세무상 불이익은?",
    answer: `가지급금 개념 및 세무상 불이익:

가지급금이란:
- 회사가 대표이사, 임직원 등에게 업무와 무관하게 대여한 금전
- 장부상 가지급금, 대여금, 미수금 등으로 표시

세무상 불이익:
1. 인정이자 계산 (법인세법)
   - 가지급금에 대해 당좌대출이자율(4.6%)로 인정이자 계산
   - 실제 이자 수령액과의 차액은 익금 산입

2. 대표이사 상여처분
   - 업무무관 가지급금은 대표자 상여로 의제
   - 소득세, 4대보험료 추가 부담

3. 가산세
   - 과소신고가산세, 납부지연가산세 등

해소 방법:
- 실제 상환, 퇴직금 상계, 배당 활용 등`,
    source: "국세청, 법인세법 시행령 제89조",
    sourceUrl: "https://www.nts.go.kr",
    lastUpdated: "2024-01-01",
    keywords: ["가지급금", "인정이자", "상여처분", "세무리스크"]
  },

  // ========== 중소기업 세제혜택 ==========
  {
    id: "sme-001",
    category: "중소기업",
    subcategory: "세제혜택",
    question: "중소기업이 받을 수 있는 세제혜택은?",
    answer: `중소기업 주요 세제혜택:

1. 법인세 세율 특례
   - 과세표준 2억원 이하: 9% (일반 9%)
   - 2억원 초과분 경감세율 적용 가능

2. 투자 관련
   - 중소기업 투자세액공제 (3~12%)
   - 고용증대 세액공제
   - R&D 세액공제 (25%)

3. 결손금 공제
   - 이월결손금 15년간 공제 가능
   - 소급공제 1년 가능

4. 접대비 한도
   - 기본한도 1,800만원 (일반기업 1,200만원)

5. 최저한세 면제
   - 최저한세율 7% (일반 10%)

※ 중소기업기본법 상 요건 충족 필요 (매출액, 자산, 독립성 등)`,
    source: "국세청, 조세특례제한법, 중소기업기본법",
    sourceUrl: "https://www.nts.go.kr",
    lastUpdated: "2024-01-01",
    keywords: ["중소기업", "세제혜택", "투자공제", "세액공제"]
  }
]

/**
 * 키워드 기반으로 관련 지식을 검색합니다.
 */
export function searchKnowledge(query: string, limit: number = 5): KnowledgeEntry[] {
  const queryLower = query.toLowerCase()
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 1)

  // 각 지식 항목에 대해 관련도 점수 계산
  const scored = consultingKnowledge.map(entry => {
    let score = 0

    // 질문과의 유사도
    if (entry.question.toLowerCase().includes(queryLower)) {
      score += 10
    }

    // 키워드 매칭
    for (const keyword of entry.keywords) {
      if (queryLower.includes(keyword.toLowerCase())) {
        score += 5
      }
      for (const word of queryWords) {
        if (keyword.toLowerCase().includes(word)) {
          score += 2
        }
      }
    }

    // 카테고리 매칭
    if (queryLower.includes(entry.category.toLowerCase())) {
      score += 3
    }

    // 답변 내용에 쿼리 단어 포함 여부
    for (const word of queryWords) {
      if (entry.answer.toLowerCase().includes(word)) {
        score += 1
      }
    }

    return { entry, score }
  })

  // 점수 높은 순으로 정렬 후 상위 N개 반환
  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.entry)
}

/**
 * 카테고리 목록 반환
 */
export function getCategories(): string[] {
  const categories = new Set(consultingKnowledge.map(k => k.category))
  return Array.from(categories)
}

/**
 * 특정 카테고리의 지식 반환
 */
export function getKnowledgeByCategory(category: string): KnowledgeEntry[] {
  return consultingKnowledge.filter(k => k.category === category)
}
