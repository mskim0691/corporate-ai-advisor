# Supabase 설정 가이드 (단계별)

## 오류 해결

"Bucket not found" 및 "Table does not exist" 오류를 해결하기 위한 단계별 가이드입니다.

## 사전 준비

1. Supabase Dashboard 접속: https://supabase.com/dashboard
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭

---

## Step 1: sample_reports 테이블 생성

SQL Editor에서 다음 코드를 복사하여 실행:

```sql
CREATE TABLE IF NOT EXISTS sample_reports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  image_url TEXT NOT NULL,
  "order" INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS sample_reports_order_idx ON sample_reports("order");

SELECT 'sample_reports table created' as status;
```

**확인**: "sample_reports table created" 메시지가 표시되어야 함

---

## Step 2: Storage 버킷 생성

### 방법 A: UI 사용 (추천)

1. 왼쪽 메뉴에서 **Storage** 클릭
2. **"New bucket"** 버튼 클릭
3. 설정:
   - **Name**: `project-files`
   - **Public bucket**: ✅ **반드시 체크**
4. **"Create bucket"** 클릭

### 방법 B: SQL 사용

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', true)
ON CONFLICT (id) DO NOTHING;

-- 확인
SELECT * FROM storage.buckets WHERE id = 'project-files';
```

**확인**: public 컬럼이 `true`인지 확인

---

## Step 3: Storage RLS 활성화

SQL Editor에서 실행:

```sql
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

---

## Step 4: Storage 정책 생성

SQL Editor에서 **각 정책을 하나씩** 실행:

### 정책 1: 공개 읽기

```sql
CREATE POLICY "Public can read project-files"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-files');
```

### 정책 2: 인증 사용자 업로드

```sql
CREATE POLICY "Authenticated users can upload to project-files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-files'
  AND auth.role() = 'authenticated'
);
```

### 정책 3: 관리자 삭제

```sql
CREATE POLICY "Admins can delete from project-files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-files'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()::text
    AND users.role = 'admin'
  )
);
```

---

## Step 5: sample_reports 테이블 RLS 활성화

```sql
ALTER TABLE sample_reports ENABLE ROW LEVEL SECURITY;
```

---

## Step 6: sample_reports 정책 생성

### 정책 1: 공개 읽기

```sql
CREATE POLICY "Anyone can view sample reports"
ON sample_reports FOR SELECT
USING (true);
```

### 정책 2: 관리자 관리

```sql
CREATE POLICY "Admins can manage sample reports"
ON sample_reports FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()::text AND role = 'admin'
  )
);
```

---

## Step 7: 환경 변수 확인

프로젝트의 `.env.local` 파일을 확인:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...
```

### Service Role Key 찾기:

1. Supabase Dashboard > **Settings** (왼쪽 하단 톱니바퀴)
2. **API** 메뉴 클릭
3. "Project API keys" 섹션에서 **service_role** 키 복사
4. `.env.local`에 붙여넣기

⚠️ **주의**: Service role key는 절대 클라이언트 코드나 GitHub에 노출하면 안 됩니다!

---

## 검증

모든 설정이 완료되었는지 확인:

```sql
-- 1. 테이블 존재 확인
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'sample_reports'
) as table_exists;

-- 2. 버킷 존재 확인
SELECT * FROM storage.buckets WHERE id = 'project-files';

-- 3. RLS 활성화 확인
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'sample_reports';

-- 4. Storage 정책 확인
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%project-files%';

-- 5. sample_reports 정책 확인
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'sample_reports';
```

**기대 결과:**
- table_exists: `true`
- bucket이 존재하고 public = `true`
- rowsecurity: `true`
- Storage 정책 3개 존재
- sample_reports 정책 2개 존재

---

## 테스트

1. **개발 서버 재시작** (환경 변수 변경 시)
   ```bash
   # Ctrl+C로 중지 후
   npm run dev
   ```

2. **애플리케이션 테스트**
   - 로그인 (admin 계정)
   - Admin > 샘플 레포트 관리 페이지로 이동
   - "파일 업로드" 탭 선택
   - 이미지 파일 선택하여 업로드 테스트

---

## 문제 해결

### "Bucket not found"
- Step 2를 다시 확인
- Storage 페이지에서 `project-files` 버킷이 보이는지 확인

### "Access denied" 또는 "Insufficient permissions"
- Step 3-4의 Storage 정책을 다시 확인
- SUPABASE_SERVICE_KEY가 올바른지 확인

### 업로드는 되지만 이미지가 보이지 않음
- 버킷이 **public**으로 설정되었는지 확인
- Storage > project-files > Settings > "Public bucket" 체크

### "syntax error at end of input"
- 각 SQL 문을 **개별적으로** 실행 (전체 파일을 한 번에 실행하지 말 것)
- 세미콜론(;)이 각 문장 끝에 있는지 확인

---

## 참고 파일

- `supabase-setup-step-by-step.sql` - 모든 SQL 명령어 (참고용)
- `supabase-rls-policies.sql` - 전체 RLS 정책 (나중에 사용)

---

## 완료!

모든 설정이 완료되면 샘플 레포트 관리 페이지에서 이미지를 업로드하고 관리할 수 있습니다.
