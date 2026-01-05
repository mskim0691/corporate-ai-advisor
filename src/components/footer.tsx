import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-4">
          <p>&copy; 2025 AI-GFC. All rights reserved.</p>
        </div>
        <div className="text-center text-sm text-gray-400 space-y-1 mb-4">
          <p>상호명: 이엑스이사일일 | 대표자: 김민수</p>
          <p>사업자번호: 566-57-00450 | 통신판매업 신고번호: 제2021-서울강동-1606호</p>
          <p>주소: 서울특별시 강동구 강동대로55길 39, 101동 603호</p>
          <p>유선번호: 070-8064-8232 | 고객문의: admin@ai-gfc.kr</p>
        </div>
        <div className="text-center text-sm space-x-4">
          <Link href="/legal/terms" className="text-gray-400 hover:text-white transition-colors">
            이용약관
          </Link>
          <span className="text-gray-600">|</span>
          <Link href="/legal/privacy" className="text-gray-400 hover:text-white transition-colors">
            개인정보처리방침
          </Link>
        </div>
      </div>
    </footer>
  )
}
