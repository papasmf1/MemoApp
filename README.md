# 웹 메모장 (Web Notepad)

> 브라우저에서 바로 작성하고 자동 저장되는 스마트하고 가벼운 온라인 메모장

---

## 🚀 주요 기능

- **P0 핵심 기능**
  - **원클릭 생성**: `+ 새 메모` 버튼 및 `Cmd / Ctrl + N` 단축키로 즉시 생성
  - **무버튼 자동 저장**: 500ms 디바운스 자동 저장 및 실시간 상태 표시 (`저장 중...` ↔ `저장됨`)
  - **정렬 & 목록**: 최근 수정순, 생성일순, 제목순(가나다) 정렬
  - **실시간 검색**: 제목, 본문, 태그 키워드 실시간 필터링 (`Cmd / Ctrl + K`)
  - **삭제 & 이동**: 원클릭 메모 삭제 (휴지통으로 안전하게 이동)

- **P1 중요 기능**
  - **사용자 인증 & 격리**: Supabase Auth (이메일/비밀번호) 및 사용자별 데이터 격리 (RLS 적용)
  - **게스트 모드**: 별도 설정 없이도 브라우저 `localStorage`를 통해 즉시 100% 동작
  - **태그 분류**: 다중 태그 추가 및 사이드바 태그 필터링
  - **상단 고정 (Pin)**: 중요 메모를 상단 `📌 고정된 메모` 섹션에 고정 (`Cmd / Ctrl + P`)
  - **휴지통 (Trash)**: 삭제 메모 개별 복구, 영구 삭제, 전체 휴지통 비우기
  - **다크 모드**: 라이트 / 다크 / 시스템 설정 테마 토글

- **P2 확장 기능**
  - **마크다운 서식 & 프리뷰**: 서식 툴바 지원 + 편집 / 분할(Split) / 미리보기(Preview) 3단 뷰
  - **읽기 전용 링크 공유**: 고유 토큰 기반 읽기 전용 공유 링크 발급 및 회수 (`/share/[token]`)
  - **파일 내보내기**: `.md` (마크다운) 또는 `.txt` (텍스트) 파일 즉시 다운로드
  - **단축키 안내**: `?` 키를 눌러 단축키 목록 조회

---

## 🛠️ 기술 스택

- **프레임워크**: Next.js 16 (App Router, React 19)
- **언어**: TypeScript 5 (Strict Mode)
- **스타일링**: Tailwind CSS v4, `next-themes`
- **UI 및 알림**: `lucide-react`, `sonner` (Toast)
- **마크다운 파서**: `marked`
- **데이터베이스 / 인증**: Supabase (PostgreSQL + Auth + RLS) & LocalStorage (게스트 모드)

---

## 📦 시작하기

### 1. 패키지 설치
```bash
npm install
```

### 2. 환경 변수 설정 (선택 사항: Supabase 클라우드 동기화 사용 시)
`.env.example` 파일을 복사하여 `.env.local`을 생성하고 본인의 Supabase 키를 입력합니다:
```bash
cp .env.example .env.local
```
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Supabase 프로젝트의 SQL Editor에서 `supabase/schema.sql` 내용을 실행하여 테이블과 RLS 정책을 생성합니다.

*환경 변수를 설정하지 않아도 브라우저 로컬 저장소(localStorage)로 모든 기능이 즉시 작동합니다.*

### 3. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속합니다.
