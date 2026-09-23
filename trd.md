# 웹 메모장 앱 — Technical Requirements Document (TRD)

- 문서 버전: v1.0
- 작성일: 2026-09-23
- 작성자: papasmf1
- 상태: Draft (구현 전 설계 단계)
- 관련 문서: `prd.md`

> 본 문서는 구현을 포함하지 않으며, `prd.md`의 요구사항을 만족하기 위한 기술 설계와 결정 사항을 정의한다.

---

## 1. 기술 스택 개요

현재 저장소(`board-app`)에 이미 구성된 스택을 그대로 재사용하는 것을 전제로 한다.

| 영역 | 선택 기술 | 비고 |
|------|-----------|------|
| 프레임워크 | Next.js 16 (App Router) | `node_modules/next/dist/docs/` 기준 최신 API 확인 필요. 레거시 Pages Router 관례 사용 금지. |
| 언어 | TypeScript 5 | strict 모드 유지. |
| UI 컴포넌트 | shadcn/ui + Radix UI (`radix-ui`, `@base-ui/react`) | 기존 프로젝트와 동일한 디자인 시스템 사용. |
| 스타일링 | Tailwind CSS v4 (`@tailwindcss/postcss`) | 다크모드는 `next-themes` 활용. |
| 아이콘 | lucide-react | |
| 상태/알림 | sonner (토스트) | 저장 성공/실패, 삭제 확인 등 피드백에 사용. |
| 백엔드 / DB | Supabase (PostgreSQL + Auth + Row Level Security) | 기존 게시판 앱과 동일한 Supabase 프로젝트를 공유할지, 별도 프로젝트로 분리할지는 §9 결정 필요. |
| 배포 | Vercel (가정) | 기존 프로젝트 배포 방식을 따름. |

> 참고: React 19 / Next.js 16 환경이므로 Server Components, Server Actions 등 최신 패턴을 우선 검토하되, 실제 사용 전 `node_modules/next/dist/docs/`에서 현재 버전의 정확한 API와 규칙을 재확인한다 (`AGENTS.md` 지침).

---

## 2. 아키텍처 개요

### 2.1 상위 아키텍처

```
[Browser: Next.js App Router (RSC + Client Components)]
        │  (Server Actions / Route Handlers)
        ▼
[Next.js Server Runtime]
        │  supabase-js (server client, service/anon key)
        ▼
[Supabase]
  ├─ PostgreSQL (notes, tags, note_tags, users)
  ├─ Auth (email/password, 세션 관리)
  └─ Row Level Security (사용자별 데이터 격리)
```

### 2.2 렌더링 전략
- 메모 목록/상세: 초기 데이터는 Server Component에서 조회(SSR)하여 최초 로딩 성능 확보.
- 편집기(자동 저장, 실시간 검색 입력 등 상호작용이 많은 영역)는 Client Component로 분리.
- 데이터 변경(생성/수정/삭제/태그 변경)은 Server Actions 또는 Route Handler(`app/api/...`) 경유. 기존 프로젝트에 `src/app/api/posts` 패턴이 있으므로 동일한 컨벤션(`src/app/api/notes`)을 따르는 것을 기본안으로 한다.

### 2.3 비로그인(게스트) 모드 처리 (PRD §9 연동)
- 옵션 A: 게스트 메모는 전적으로 `localStorage`에 저장하고 서버에 전송하지 않음.
- 옵션 B: 게스트도 익명 세션(Supabase Anonymous Sign-in)을 발급하여 서버에 저장.
- 본 문서는 **옵션 A를 기본안**으로 제안한다(구현 단순성, 개인정보 최소 수집). 최종 결정은 PRD §9에서 확정 후 본 문서 갱신.

---

## 3. 데이터 모델

### 3.1 ERD 개요

```
users (Supabase Auth 관리)
  └─< notes
         └─< note_tags >─ tags
```

### 3.2 테이블 정의

**notes**

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK, default `gen_random_uuid()` | |
| user_id | uuid | FK → `auth.users.id`, not null | 소유자 |
| title | text | not null, default `''` | 메모 제목 |
| content | text | not null, default `''` | 본문 (최대 길이는 애플리케이션 레벨에서 제한, 예: 100,000자) |
| is_pinned | boolean | not null, default `false` | 고정 여부 |
| deleted_at | timestamptz | nullable | null이면 활성, 값이 있으면 휴지통 상태 |
| created_at | timestamptz | not null, default `now()` | |
| updated_at | timestamptz | not null, default `now()` | 자동 저장 시 갱신 |

**tags**

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | |
| user_id | uuid | FK → `auth.users.id`, not null | 태그도 사용자 스코프 |
| name | text | not null | |
| (unique) | | `(user_id, name)` unique | 사용자별 태그명 중복 방지 |

**note_tags** (다대다 조인 테이블)

| 컬럼 | 타입 | 제약 |
|------|------|------|
| note_id | uuid | FK → `notes.id`, on delete cascade |
| tag_id | uuid | FK → `tags.id`, on delete cascade |
| (PK) | | `(note_id, tag_id)` |

### 3.3 인덱스 설계
- `notes(user_id, deleted_at, updated_at desc)` — 목록 조회(활성 메모, 최근 수정순) 최적화.
- `notes(user_id, is_pinned)` — 고정 메모 우선 조회.
- 검색용: PostgreSQL Full Text Search 컬럼(`tsvector`) 또는 `pg_trgm` 기반 `ILIKE` 인덱스 중 선택 필요(§9).

### 3.4 Row Level Security (RLS) 정책 (설계 원칙)
- 모든 테이블에 RLS 활성화.
- `notes`, `tags`: `user_id = auth.uid()`인 행만 select/insert/update/delete 허용.
- `note_tags`: 조인된 `notes.user_id`가 `auth.uid()`와 일치하는 경우만 허용.

---

## 4. API 설계

기존 `src/app/api/posts` 컨벤션을 참고하여 `src/app/api/notes` 하위에 구성하는 것을 기본안으로 한다. (Server Actions로 대체 가능 — §9 결정 필요.)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/notes` | 활성 메모 목록 조회 (쿼리: `q`(검색어), `tag`, `sort`) |
| POST | `/api/notes` | 새 메모 생성 |
| GET | `/api/notes/[id]` | 메모 상세 조회 |
| PATCH | `/api/notes/[id]` | 메모 수정 (제목/본문/고정 상태, 자동 저장 포함) |
| DELETE | `/api/notes/[id]` | 메모 소프트 삭제 (`deleted_at` 세팅) |
| GET | `/api/notes/trash` | 휴지통 목록 조회 |
| POST | `/api/notes/[id]/restore` | 휴지통에서 복구 |
| DELETE | `/api/notes/[id]/purge` | 영구 삭제 |
| GET | `/api/tags` | 태그 목록 조회 |
| POST | `/api/notes/[id]/tags` | 메모에 태그 연결/해제 |
| POST | `/api/notes/[id]/share` | 공유 링크 생성 (P2) |

### 4.1 응답 포맷 규칙
- 성공: `{ data: ... }`
- 실패: `{ error: { code: string, message: string } }`
- 상태 코드는 표준 HTTP semantics 준수 (400/401/403/404/409/500).

### 4.2 자동 저장(Autosave) 설계
- 클라이언트: 입력 이벤트에 디바운스(500ms~1000ms) 적용 후 PATCH 요청.
- 동시성 제어: `updated_at` 기반 낙관적 잠금(optimistic concurrency) 고려 — 클라이언트가 마지막으로 읽은 `updated_at`을 함께 전송, 서버는 불일치 시 409 반환.
- 네트워크 실패 시: 클라이언트 로컬 큐에 임시 보관 후 재시도, sonner 토스트로 사용자에게 알림.

---

## 5. 프론트엔드 설계

### 5.1 폴더 구조 제안 (App Router 기준)

```
src/app/
  (notes)/
    page.tsx                 // 메모 목록 (데스크톱: 목록+상세, 모바일: 목록만)
    [id]/page.tsx             // 메모 상세/편집
    trash/page.tsx            // 휴지통
  api/
    notes/route.ts
    notes/[id]/route.ts
    notes/[id]/restore/route.ts
    notes/[id]/purge/route.ts
    notes/trash/route.ts
    tags/route.ts
  layout.tsx
src/components/
  notes/
    note-list.tsx
    note-list-item.tsx
    note-editor.tsx
    note-search-bar.tsx
    tag-filter.tsx
  ui/ (shadcn 컴포넌트)
src/lib/
  supabase/
    client.ts                 // 브라우저용 클라이언트
    server.ts                 // 서버 컴포넌트/라우트 핸들러용 클라이언트
  notes/
    queries.ts                 // 데이터 조회 함수
    mutations.ts                // 생성/수정/삭제 함수
    types.ts
```

> 실제 구현 시 `node_modules/next/dist/docs/`에서 App Router의 최신 라우팅/데이터 패칭 컨벤션을 재확인해야 한다.

### 5.2 상태 관리
- 서버 상태(메모 목록/상세)는 별도 전역 상태 라이브러리 없이 Server Component + 캐시 무효화(재검증) 방식을 기본으로 한다.
- 클라이언트 로컬 UI 상태(검색어 입력, 편집 중 임시 텍스트, 저장 상태 표시)는 컴포넌트 로컬 상태(`useState`)로 충분.
- 게스트 모드(로컬 저장)는 `localStorage` 접근을 캡슐화한 전용 훅/모듈로 분리.

### 5.3 검색 구현 방안
- 클라이언트: 입력값 디바운스(200~300ms) 후 서버에 쿼리 파라미터로 전달.
- 서버: PostgreSQL `ILIKE` 또는 Full Text Search(`tsvector` + `to_tsquery`) 사용. 메모 수가 적은 초기 단계는 `ILIKE`로 충분하며, 데이터 증가 시 FTS로 전환 가능하도록 설계.

### 5.4 반응형 레이아웃
- Tailwind breakpoint 기준: `md`(768px) 미만은 1-패널(목록 ↔ 상세 라우트 전환), 이상은 2-패널(마스터-디테일).
- 상세 라우트(`/[id]`)는 모바일에서도 동일하게 동작(딥링크 가능).

### 5.5 접근성/UX 세부 사항
- 저장 상태 표시는 `aria-live="polite"` 영역으로 스크린리더에 전달.
- 목록/편집 패널 간 키보드 포커스 이동 순서 정의 필요.
- 삭제 등 파괴적 액션은 `AlertDialog`(shadcn) 컴포넌트로 확인 절차 강제.

---

## 6. 인증 및 보안

### 6.1 인증
- Supabase Auth의 이메일/비밀번호 로그인 사용.
- 세션은 Supabase의 쿠키 기반 세션 관리(`@supabase/ssr` 또는 동등 패턴) 활용 — App Router의 서버/클라이언트 컴포넌트 양쪽에서 세션 일관성 유지 필요.
- 비로그인 사용자의 라우트 접근 정책: `/notes` 등 핵심 화면은 게스트도 접근 가능(로컬 모드), 로그인 필요 기능(동기화, 태그 서버 저장 등)은 로그인 유도 UI 표시.

### 6.2 인가 (Authorization)
- 모든 데이터 접근은 Supabase RLS를 1차 방어선으로 사용.
- API Route Handler에서도 세션의 `user_id`와 요청 리소스의 소유자를 이중으로 검증(Defense in depth).

### 6.3 보안 고려사항
- XSS 방지: 본문에 마크다운 렌더링(P2) 적용 시 반드시 안전한 sanitizer(예: DOMPurify 또는 신뢰할 수 있는 마크다운 렌더러의 안전 모드)를 사용.
- CSRF: Server Actions/Route Handler는 Supabase 세션 쿠키 기반이므로 SameSite 쿠키 설정 및 Next.js의 기본 보호 메커니즘 확인.
- Rate Limiting: 메모 생성/자동저장 API에 대한 과도한 요청 방지 정책 검토(예: Supabase Edge Function 또는 미들웨어 레벨).
- 입력 검증: 제목/본문 길이 제한, 태그명 길이 제한 등을 서버 측에서도 강제.

---

## 7. 성능 설계

| 항목 | 전략 |
|------|------|
| 초기 로딩 | 목록 페이지는 Server Component에서 첫 화면 데이터 SSR, 이후 상호작용은 클라이언트에서 처리. |
| 목록 페이지네이션 | 무한 스크롤 또는 커서 기반 페이지네이션 (초기 로드 시 최근 20~30개만 조회). |
| 자동 저장 부하 | 디바운스 + 변경분(diff) 감지로 불필요한 요청 최소화. |
| 이미지/에셋 | Next.js `Image` 컴포넌트 사용(추후 이미지 첨부 기능 추가 시). |
| DB 쿼리 | 위 §3.3 인덱스 설계 반영, N+1 방지를 위해 태그 조회 시 조인 쿼리 사용. |

---

## 8. 테스트 전략

| 레벨 | 대상 | 도구(제안) |
|------|------|-----------|
| 단위 테스트 | 유틸 함수(디바운스, 날짜 포맷, 검색 필터 로직) | Vitest 또는 Jest |
| 컴포넌트 테스트 | NoteEditor, NoteList 등 주요 컴포넌트 렌더링/상호작용 | React Testing Library |
| API 테스트 | Route Handler의 CRUD 동작, RLS 정책 검증 | Vitest + Supabase 로컬 인스턴스 또는 테스트 프로젝트 |
| E2E 테스트 | 메모 생성 → 자동 저장 → 검색 → 삭제 → 복구 전체 흐름 | Playwright |
| 접근성 테스트 | 키보드 내비게이션, 스크린리더 라벨 | axe-core 등 자동화 도구 + 수동 점검 |

> 테스트 프레임워크는 현재 `package.json`에 미설치 상태이므로, 실제 구현 단계에서 도구 선정 및 설치가 필요하다.

---

## 9. 열린 기술적 결정 사항 (Open Technical Decisions)

1. **API 방식**: Route Handler(`app/api/notes/...`) vs. Server Actions 중 어느 것을 표준으로 채택할지 — 기존 `src/app/api/posts` 컨벤션과의 일관성을 고려해 결정 필요.
2. **Supabase 프로젝트 공유 여부**: 기존 게시판(`board-app`)과 동일 Supabase 프로젝트/스키마를 공유할지, 별도 프로젝트로 분리할지.
3. **게스트 모드 저장소**: `localStorage` 전용(옵션 A) vs. 익명 인증(옵션 B) — PRD §9와 연동하여 확정.
4. **검색 엔진 고도화 시점**: `ILIKE` → PostgreSQL FTS 전환 기준(예: 사용자당 메모 수 1,000개 이상)을 사전에 정의할지.
5. **동시 편집/동시성 제어 수준**: 낙관적 잠금(§4.2) 도입 여부 및 충돌 시 UX(덮어쓰기 경고 vs. 자동 병합) 결정.
6. **휴지통 자동 영구 삭제 배치**: Supabase Cron / pg_cron / 외부 스케줄러(Vercel Cron) 중 선택.
7. **공유 링크(P2) 인증 모델**: 공유 링크 접근 시 별도 토큰 기반 공개 read 엔드포인트를 만들지, RLS 예외 정책을 만들지.

---

## 10. 리스크 및 완화 방안

| 리스크 | 영향 | 완화 방안 |
|--------|------|-----------|
| 자동 저장 중 네트워크 단절로 데이터 유실 | 사용자 작업 손실, 신뢰도 하락 | 클라이언트 로컬 임시 버퍼 + 재시도 큐, 명확한 저장 상태 UI |
| Next.js 16 신규 API에 대한 오해로 구버전 패턴 적용 | 빌드 오류, 런타임 버그 | 구현 전 `node_modules/next/dist/docs/` 필수 확인 (AGENTS.md 지침 준수) |
| RLS 정책 누락으로 인한 데이터 유출 | 심각한 보안 사고 | 모든 테이블 RLS 기본값 "거부", 테스트 단계에서 다른 사용자 계정으로 접근 검증 |
| 메모 수 증가 시 검색 성능 저하 | UX 저하 | §9-4 기준에 따른 FTS 전환 계획 사전 수립 |
