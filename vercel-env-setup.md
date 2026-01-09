# Vercel 환경 변수 설정 필요

다음 환경 변수들을 Vercel 대시보드에 추가해야 합니다:

## 필수 환경 변수

### Database
```
DATABASE_URL=postgresql://postgres.tveabsrgnthrlzbjhhjl:Revelation55*aigfc@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:Revelation55*aigfc@db.tveabsrgnthrlzbjhhjl.supabase.co:5432/postgres
```

### NextAuth
```
NEXTAUTH_SECRET=Q4egClxhKQVQWhgEDNvoiuq7mAff7cYyQbiYy0Ch8xE=
NEXTAUTH_URL=https://corporate-ai-advisor.vercel.app
```

### Google Gemini
```
GOOGLE_GEMINI_API_KEY=AIzaSyCv9YK4sgufffTttJgTRb3ryTL94lW1OQw
```

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://tveabsrgnthrlzbjhhjl.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2ZWFic3JnbnRocmx6YmpoaGpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDY3NjE2MiwiZXhwIjoyMDgwMjUyMTYyfQ.sWXzHgifz81rbZ9zyHStex79amxAJrk588nxJVZioqM
```

### App URL
```
NEXT_PUBLIC_APP_URL=https://corporate-ai-advisor.vercel.app
```

### Telegram (Optional)
```
TELEGRAM_BOT_TOKEN=8519375054:AAGPeq9i7EEpFg8iXekp1d-20gw1Fr-ulXE
TELEGRAM_CHAT_ID=7726449140
```

### TossPayments
```
TOSS_CLIENT_KEY=test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm
TOSS_SECRET_KEY=test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6
```

### Cron Job Secret
```
CRON_SECRET=14aiIyjrcpOHZaJHh04ey04sWZMu0Y5Jn/aI8ZcAekk=
```

## 설정 방법

1. Vercel 대시보드 접속: https://vercel.com/mskims-projects-304df09b/corporate-ai-advisor
2. Settings → Environment Variables 메뉴로 이동
3. 위의 환경 변수들을 하나씩 추가
4. Environment: Production, Preview, Development 모두 선택
5. Save 후 재배포

## 중요 참고사항

- `NEXTAUTH_URL`은 반드시 실제 배포된 도메인과 일치해야 합니다
- `DATABASE_URL`은 Supabase Pooler URL을 사용 (pgbouncer=true)
- `DIRECT_URL`은 Direct Connection URL 사용 (migration용)
