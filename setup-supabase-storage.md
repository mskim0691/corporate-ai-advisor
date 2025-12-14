# Supabase Storage 설정 가이드

## 1. 테이블 생성

Supabase Dashboard > SQL Editor에서 다음 파일의 SQL을 실행하세요:
- `create-sample-reports-table.sql` - sample_reports 테이블 생성

## 2. Storage 버킷 생성

### 방법 1: Supabase Dashboard UI 사용

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **Storage 메뉴로 이동**
   - 왼쪽 사이드바에서 "Storage" 클릭

3. **새 버킷 생성**
   - "Create a new bucket" 또는 "New bucket" 버튼 클릭
   - **Name**: `project-files`
   - **Public bucket**: ✅ **체크** (공개 URL 접근 필요)
   - "Create bucket" 클릭

### 방법 2: SQL로 버킷 생성

Supabase Dashboard > SQL Editor에서 다음 SQL 실행:

```sql
-- project-files 버킷 생성 (공개 버킷)
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', true)
ON CONFLICT (id) DO NOTHING;
```

## 3. Storage RLS 정책 설정

Supabase Dashboard > SQL Editor에서 다음 SQL 실행:

```sql
-- Storage RLS 활성화
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책
CREATE POLICY "Public can read project-files"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-files');

-- 인증된 사용자 업로드 정책
CREATE POLICY "Authenticated users can upload to project-files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-files'
  AND auth.role() = 'authenticated'
);

-- 관리자 삭제 정책
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

## 4. 환경 변수 확인

`.env.local` 파일에 다음 환경 변수가 있는지 확인:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

**Service Role Key 찾는 방법:**
1. Supabase Dashboard > Settings > API
2. "Project API keys" 섹션에서 `service_role` 키 복사
3. ⚠️ 주의: 이 키는 절대 클라이언트에 노출하면 안 됩니다!

## 5. 버킷 확인

다음 SQL로 버킷이 제대로 생성되었는지 확인:

```sql
SELECT * FROM storage.buckets WHERE id = 'project-files';
```

Expected result:
- id: `project-files`
- name: `project-files`
- public: `true`

## 6. 테스트

설정이 완료되면:
1. 애플리케이션 재시작 (개발 서버)
2. Admin > 샘플 레포트 관리 페이지로 이동
3. 파일 업로드 테스트

## 문제 해결

### "Bucket not found" 오류
- Storage에서 `project-files` 버킷이 존재하는지 확인
- 버킷 이름 철자 확인

### "Access denied" 오류
- Storage RLS 정책이 제대로 설정되었는지 확인
- SUPABASE_SERVICE_KEY가 올바른지 확인

### 업로드 후 이미지가 보이지 않음
- 버킷이 public으로 설정되었는지 확인
- 이미지 URL이 올바른지 확인
