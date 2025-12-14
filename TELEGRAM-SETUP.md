# Telegram 봇 연동 가이드

비주얼 레포트 신청 시 관리자에게 Telegram 알림을 보내는 기능입니다.

## 1단계: Telegram 봇 생성

### 1.1 BotFather로 봇 생성

1. Telegram 앱 열기
2. 검색창에 `@BotFather` 입력하여 BotFather 찾기
3. 대화 시작 후 `/newbot` 입력
4. 봇 이름 입력 (예: `Corporate AI Advisor Notifications`)
5. 봇 유저네임 입력 (예: `corporate_ai_advisor_bot`)
   - 반드시 `bot`으로 끝나야 함
6. **API Token 저장** (예: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 1.2 봇과 대화 시작

1. BotFather가 제공한 링크 클릭하여 봇으로 이동
2. `/start` 명령어 입력하여 봇 활성화

## 2단계: Chat ID 확인

### 방법 1: getUpdates API 사용 (추천)

1. 봇에게 아무 메시지나 보내기 (예: "테스트")
2. 브라우저에서 다음 URL 접속:
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
   예시:
   ```
   https://api.telegram.org/bot123456789:ABCdefGHIjklMNOpqrsTUVwxyz/getUpdates
   ```

3. JSON 응답에서 Chat ID 찾기:
   ```json
   {
     "ok": true,
     "result": [
       {
         "update_id": 123456789,
         "message": {
           "message_id": 1,
           "from": {
             "id": 987654321,  // ← 이게 Chat ID
             "is_bot": false,
             "first_name": "Your Name"
           },
           "chat": {
             "id": 987654321,  // ← 이게 Chat ID
             "first_name": "Your Name",
             "type": "private"
           },
           "date": 1234567890,
           "text": "테스트"
         }
       }
     ]
   }
   ```

4. `"chat":{"id":987654321}` 값을 Chat ID로 저장

### 방법 2: userinfobot 사용

1. Telegram에서 `@userinfobot` 검색
2. `/start` 입력
3. 봇이 Chat ID를 알려줌

## 3단계: 환경 변수 설정

### 로컬 개발 환경 (.env.local)

`.env.local` 파일에 다음 추가:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=987654321
```

**주의사항:**
- `TELEGRAM_BOT_TOKEN`: BotFather에서 받은 토큰 전체
- `TELEGRAM_CHAT_ID`: 숫자만 입력 (따옴표 없음)
- `.env.local` 파일은 `.gitignore`에 포함되어 있어 GitHub에 올라가지 않음

### 프로덕션 환경 (Vercel)

1. **Vercel Dashboard** 접속: https://vercel.com
2. 프로젝트 선택
3. **Settings** 탭 클릭
4. 왼쪽 메뉴에서 **Environment Variables** 클릭
5. 두 개의 환경 변수 추가:

   **첫 번째 변수:**
   - Key: `TELEGRAM_BOT_TOKEN`
   - Value: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
   - Environment: Production, Preview, Development 모두 체크

   **두 번째 변수:**
   - Key: `TELEGRAM_CHAT_ID`
   - Value: `987654321`
   - Environment: Production, Preview, Development 모두 체크

6. **Save** 클릭
7. **재배포 필요**: 환경 변수 변경 후 자동 재배포되지 않으므로, Deployments 탭에서 최신 배포를 Redeploy

## 4단계: 테스트

### 로컬 테스트

1. 개발 서버 재시작:
   ```bash
   # Ctrl+C로 중지 후
   npm run dev
   ```

2. 브라우저에서 관리자로 로그인

3. 브라우저 개발자 도구 (F12) 열기

4. Console에서 테스트 API 호출:
   ```javascript
   fetch('/api/admin/test-telegram', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' }
   })
   .then(r => r.json())
   .then(console.log)
   ```

5. Telegram에서 테스트 메시지 확인:
   ```
   ✅ 테스트 알림

   Telegram 봇이 정상적으로 연동되었습니다!

   ⏰ 2025. 12. 14. 오후 3:30:00
   ```

### 실제 기능 테스트

1. 일반 사용자로 로그인
2. 프로젝트 생성 및 분석 완료
3. Analysis 페이지에서 "비주얼 레포트 생성" 클릭
4. order-report 페이지에서 "신청하기 (이용권 -1 차감)" 클릭
5. Telegram에서 알림 확인:
   ```
   🔔 비주얼 레포트 신청 알림

   👤 사용자: 홍길동 (user@example.com)
   🏢 회사명: 테스트 회사
   🏭 업종: IT
   📋 프로젝트 ID: abc123

   ⏰ 신청 시간: 2025. 12. 14. 오후 3:30:00

   👉 관리자 패널에서 확인하세요!
   ```

## 5단계: 문제 해결

### "Telegram notification skipped" 로그가 나타남

- 환경 변수가 설정되지 않은 상태
- `.env.local` 파일 확인
- 개발 서버 재시작

### "Telegram API error: Unauthorized"

- `TELEGRAM_BOT_TOKEN`이 잘못됨
- BotFather에서 토큰 다시 확인
- 토큰 앞뒤 공백 제거

### "Telegram API error: Bad Request: chat not found"

- `TELEGRAM_CHAT_ID`가 잘못됨
- getUpdates API로 다시 확인
- 봇에게 `/start` 명령어를 보냈는지 확인

### 알림이 전혀 오지 않음

1. 환경 변수 확인:
   ```bash
   # .env.local 파일 확인
   cat .env.local | grep TELEGRAM
   ```

2. 서버 로그 확인:
   ```
   # 개발 서버 터미널에서
   # "Telegram notification" 관련 로그 찾기
   ```

3. 네트워크 방화벽 확인:
   - `api.telegram.org`로의 HTTPS 연결이 차단되지 않았는지 확인

## 알림 형식

### 비주얼 레포트 신청 알림

```
🔔 비주얼 레포트 신청 알림

👤 사용자: [이름] ([이메일])
🏢 회사명: [회사명]
🏭 업종: [업종]
📋 프로젝트 ID: [ID]

⏰ 신청 시간: [날짜 시간]

👉 관리자 패널에서 확인하세요!
```

## 선택사항: 그룹 채팅으로 알림 받기

여러 관리자가 함께 알림을 받으려면:

1. Telegram에서 그룹 생성
2. 봇을 그룹에 초대
3. 그룹에서 `/start` 입력
4. 그룹 Chat ID 확인:
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
   - 그룹 Chat ID는 음수 (예: -123456789)

5. 환경 변수 업데이트:
   ```env
   TELEGRAM_CHAT_ID=-123456789
   ```

## 보안 주의사항

⚠️ **절대 하지 말아야 할 것:**
- GitHub에 봇 토큰 업로드
- 클라이언트 코드에서 봇 토큰 사용
- 공개 저장소에 Chat ID 노출

✅ **권장 사항:**
- 환경 변수만 사용
- `.env.local`은 `.gitignore`에 포함
- 프로덕션 환경 변수는 Vercel에서만 관리
- 주기적으로 봇 토큰 재생성 (BotFather의 `/token` 명령어)

## 추가 기능

향후 추가 가능한 기능:
- 프로젝트 완료 시 알림
- 에러 발생 시 알림
- 일일 통계 요약 알림
- Telegram에서 직접 프로젝트 상태 확인

이러한 기능은 `src/lib/telegram.ts`에 함수를 추가하면 됩니다.
