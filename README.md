# LogDoctor 🩺

> 서버 에러 로그를 붙여넣으면 **원인 후보**와 **해결 절차**를 정리해주는 개발자용 웹앱.
> 단순 로그 뷰어가 아니라 "에러 원인 분석 보조 도구"입니다.

LogDoctor는 Spring Boot · Node.js · Docker · Nginx · MySQL · Redis · GitHub Actions ·
Linux 서버에서 발생한 에러 로그를 구조화해서 보여주고, 룰 기반으로 원인 후보와 확인/해결
명령어를 추천합니다. 외부 유료 API 없이 **완전히 로컬에서** 동작합니다.

---

## 주요 기능

- **로그 입력** — 큰 textarea, `.log`/`.txt` 파일 업로드, 예시 로그 불러오기, 초기화. 줄 수 ·
  문자 수 · 감지된 에러 개수를 실시간 표시.
- **자동 분류** — 로그를 분석해 Spring Boot / Node.js / Docker / Docker Compose / Nginx /
  MySQL / Redis / Git·GitHub Actions / Linux / Network·Port / Unknown 카테고리로 분류.
- **핵심 에러 추출** — `ERROR`, `Exception`, `Caused by`, `Failed`, `refused`, `already in use`
  등 중요한 라인만 추출하고, 에러 타입 · 추정 라인 번호 · 관련 원문을 함께 표시.
- **원인 후보 분석** — 룰 기반으로 가능한 원인을 추천 (예: `UnsatisfiedDependencyException`
  → Bean 생성 실패 / 의존성 누락 / JWT_SECRET 누락 가능성).
- **해결 명령어 추천** — 카테고리별 확인/해결 명령어를 **복사 버튼**과 함께 제공.
- **Markdown 리포트** — 7개 섹션 구조의 분석 리포트를 생성하고 복사 가능.
- **최근 분석 기록** — localStorage에 최근 10개까지 저장. 제목 자동 생성, 클릭 시 복원, 개별/전체 삭제.
- **민감정보 자동 마스킹** — 비밀번호 · 토큰 · API 키 · `Authorization: Bearer` · DB 접속 문자열을
  화면 표시 **및 저장 전에** 자동으로 `******` 처리.
- **선택적 AI 분석 구조** — `OPENAI_API_KEY` 또는 `GEMINI_API_KEY`가 있을 때만 확장 가능한
  구조만 준비 (MVP는 API 없이 완전 동작).

---

## 사용 기술

- **Next.js 14** (App Router) + **TypeScript** (strict, `any` 지양)
- **Tailwind CSS** (다크 우선 디자인 토큰)
- shadcn/ui 스타일의 직접 구현 컴포넌트 (Card, Button, Badge, Textarea, Tabs, Toast)
- **lucide-react** 아이콘
- 데이터 저장: 브라우저 **localStorage** (DB 없음)

---

## 실행 방법

```bash
npm install
npm run dev
# http://localhost:3000
```

프로덕션 빌드:

```bash
npm run build
npm run start
```

타입 검사 / 린트:

```bash
npm run typecheck
npm run lint
```

> 환경 변수는 필요 없습니다. (선택) AI 연동을 시험하려면 `.env.example`을 참고해
> `OPENAI_API_KEY` 또는 `GEMINI_API_KEY`를 설정하세요. 없으면 룰 기반 분석만 사용합니다.

---

## 폴더 구조

```
LogDoctor/
├─ app/
│  ├─ layout.tsx           # 루트 레이아웃 + ToastProvider
│  ├─ page.tsx             # 메인 페이지 (상태 오케스트레이션)
│  └─ globals.css          # 다크 테마 토큰 + 글로벌 스타일
├─ components/
│  ├─ LogInput.tsx         # 로그 입력 / 파일 업로드 / 통계
│  ├─ AnalysisSummary.tsx  # 분석 요약 카드
│  ├─ ErrorList.tsx        # 핵심 에러 목록
│  ├─ CauseList.tsx        # 원인 후보 + 먼저 확인할 것
│  ├─ CommandList.tsx      # 카테고리별 추천 명령어 (복사 버튼)
│  ├─ MarkdownReport.tsx   # Markdown 리포트 + 복사
│  ├─ RecentAnalyses.tsx   # 최근 분석 기록
│  ├─ SampleLogSelector.tsx# 예시 로그 선택
│  └─ ui/                  # Button, Card, Badge, Textarea, Tabs, Toast, CopyButton
├─ lib/
│  ├─ analyzer.ts          # 룰 매칭 · 에러 추출 · 집계 분석기
│  ├─ rules.ts             # 분석 룰 데이터 + 카테고리별 기본 명령어
│  ├─ maskSensitive.ts     # 민감정보 마스킹
│  ├─ reportGenerator.ts   # Markdown 리포트 생성
│  ├─ storage.ts           # localStorage 기록 (마스킹된 로그만 저장)
│  ├─ sampleLogs.ts        # 예시 로그 6종
│  ├─ aiAnalyzer.ts        # 선택적 AI 분석 구조 (스텁)
│  └─ utils.ts             # cn(), 시간 포맷
└─ types/
   └─ logAnalysis.ts       # 도메인 타입 정의
```

---

## 분석 가능한 로그 종류

| 카테고리 | 감지 예시 |
|---|---|
| Spring Boot | `UnsatisfiedDependencyException`, `BeanCreationException`, `Failed to configure a DataSource`, `HikariPool`, `Port 8080 was already in use` |
| Node.js / Express | `TypeError`, `ReferenceError`, `Cannot find module`, `EADDRINUSE`, `npm ERR!` |
| Docker / Compose | `Cannot connect to the Docker daemon`, `container exited`, `Exited (1)`, `bind: address already in use`, `unhealthy` |
| Nginx | `502 Bad Gateway`, `connect() failed`, `upstream`, `nginx: [emerg]`, `SSL certificate problem` |
| MySQL | `Access denied for user`, `Communications link failure`, `Unknown database`, `Table doesn't exist` |
| Redis | `NOAUTH Authentication required`, `ECONNREFUSED 127.0.0.1:6379`, `WRONGPASS` |
| Git / GitHub Actions | `workflow failed`, `npm ci`, `build failed`, `Process completed with exit code 1` |
| Linux / Ubuntu | `No space left on device`, `command not found`, `Permission denied`, `Failed to start ... service` |
| Network / Port | `Connection refused`, `ECONNREFUSED`, `already in use` |

### 심각도 기준

- **낮음** — warning, not found, validation
- **보통** — TypeError, npm error, build failed
- **높음** — connection refused, port conflict, DB connection fail, 502
- **치명적** — application startup failed, database/docker daemon unavailable, no space left on device

---

## 민감정보 마스킹

로그에는 비밀번호·토큰·API 키가 섞여 있을 수 있습니다. LogDoctor는 화면에 표시하기 **전에**
다음 패턴을 자동으로 `******`로 치환합니다.

- `password=`, `token=`, `api_key=`, `secret=`, `access_key=`, `client_secret=` (`:` / `=` 모두)
- `Authorization: Bearer <...>`
- `jwt <...>`
- 접속 문자열의 비밀번호 — `mysql://user:password@host`, `postgres://user:password@host`,
  `redis://`, `mongodb://` 등

```
password=123456                  → password=******
Authorization: Bearer abcdefg     → Authorization: Bearer ******
mysql://app:secret@db:3306        → mysql://app:******@db:3306
```

> localStorage에 기록을 저장할 때도 **마스킹된 버전만** 저장하므로, 원본 비밀번호는 어디에도
> 남지 않습니다.

---

## 향후 개선 아이디어

- GitHub Issue 자동 생성
- Docker 컨테이너 로그 직접 연결
- 서버 SSH 로그 수집
- AI 기반 정밀 분석 (`lib/aiAnalyzer.ts` 확장)
- 팀별 로그 분석 기록 공유
- Slack / Discord 알림 연동
- Nginx / Spring / Docker 설정 파일 자동 검사
- 에러 해결 성공 여부 기록

---

## 라이선스

내부/학습용 예시 프로젝트입니다. 자유롭게 수정해 사용하세요.
