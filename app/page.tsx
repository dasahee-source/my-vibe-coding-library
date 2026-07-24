"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Project = {
  id: string;
  title: string;
  summary: string;
  category: string;
  level: "입문" | "초급" | "도전";
  prompt: string;
  lesson: string;
  demoUrl: string;
  githubUrl: string;
  status?: "완성" | "제작 중" | "아이디어";
  favorite: boolean;
  createdAt: string;
};

const STORAGE_KEY = "my-vibe-coding-library-v1";
const categories = ["전체", "게임", "생활", "재미", "학습", "도구"];

const sampleProjects: Project[] = [
  {
    id: "card-games",
    title: "카드게임 8종 세트",
    summary: "워부터 블랙잭과 홀덤 포커까지 한 화면에서 즐기는 브라우저 카드게임 모음",
    category: "게임",
    level: "초급",
    prompt:
      "외부 이미지 없이 SVG 카드로 워, 하이로우, 메모리, 원카드, 블랙잭, 홀덤 포커, 카드운세, 오늘의 운세를 한 화면에서 실행할 수 있게 만들어줘.",
    lesson: "셔플과 확률, 상태 관리, 카드 규칙 분기, 포커 조합 판정",
    demoUrl: "card-games/",
    githubUrl: "https://github.com/dasahee-source/my-vibe-coding-library/tree/main/card-games",
    status: "완성",
    favorite: false,
    createdAt: "2026-07-25",
  },
  {
    id: "omok",
    title: "오목",
    summary: "15×15 바둑판에서 AI 또는 친구와 다섯 개의 돌을 먼저 잇는 전통 보드게임",
    category: "게임",
    level: "초급",
    prompt:
      "HTML, CSS, JavaScript로 15×15 오목판을 만들고 AI 대전과 2인 대전, 난이도 선택, 승리 판정과 다시 시작 기능을 구현해줘.",
    lesson: "보드 상태 관리, 승리 조건 탐색, 미니맥스 기반 AI",
    demoUrl: "omok.html",
    githubUrl: "https://github.com/dasahee-source/my-vibe-coding-library",
    status: "완성",
    favorite: false,
    createdAt: "2026-07-25",
  },
  {
    id: "dice-game",
    title: "주사위 놀이",
    summary: "버튼을 누르면 두 개의 주사위를 굴리고 합계를 보여주는 작은 게임",
    category: "게임",
    level: "입문",
    prompt:
      "HTML, CSS, JavaScript만 사용해 주사위 두 개를 굴리는 웹게임을 만들어줘. 굴리기 버튼, 주사위 눈, 합계와 다시 하기 기능을 넣고 모바일에서도 잘 보이게 해줘.",
    lesson: "버튼 클릭 이벤트와 무작위 숫자 만들기",
    demoUrl: "",
    githubUrl: "",
    favorite: true,
    createdAt: "2026-07-23",
  },
  {
    id: "lotto-picker",
    title: "로또 번호 추첨기",
    summary: "겹치지 않는 숫자 6개를 뽑아 색상 공으로 보여주는 추첨 도구",
    category: "재미",
    level: "입문",
    prompt:
      "1부터 45까지 중복 없이 숫자 6개를 뽑는 로또 번호 추첨기를 만들어줘. 번호를 오름차순으로 정렬하고 구간마다 공 색상을 다르게 보여줘.",
    lesson: "배열, 중복 제거, 정렬의 기본",
    demoUrl: "",
    githubUrl: "",
    favorite: false,
    createdAt: "2026-07-23",
  },
  {
    id: "daily-fortune",
    title: "오늘의 운세",
    summary: "이름을 입력하면 가벼운 오늘의 메시지와 행운의 색을 보여주는 웹앱",
    category: "재미",
    level: "초급",
    prompt:
      "이름을 입력하고 버튼을 누르면 오늘의 운세, 행운의 색, 추천 행동을 무작위로 보여주는 밝고 재미있는 웹페이지를 만들어줘. 실제 점술이 아닌 놀이용임을 표시해줘.",
    lesson: "폼 입력값과 조건부 화면 표시",
    demoUrl: "",
    githubUrl: "",
    favorite: false,
    createdAt: "2026-07-23",
  },
  {
    id: "travel-list",
    title: "여행 준비 체크리스트",
    summary: "여행 전 필요한 물건을 확인하고 진행률을 볼 수 있는 체크리스트",
    category: "생활",
    level: "초급",
    prompt:
      "여행 준비물을 카테고리별로 확인하는 체크리스트를 만들어줘. 항목 추가, 완료 체크, 진행률 표시와 브라우저 저장 기능을 넣어줘.",
    lesson: "목록 상태 관리와 브라우저 저장",
    demoUrl: "",
    githubUrl: "",
    favorite: true,
    createdAt: "2026-07-23",
  },
  {
    id: "quiz-maker",
    title: "상식 퀴즈",
    summary: "문제를 한 개씩 풀고 마지막에 점수를 확인하는 간단한 퀴즈",
    category: "학습",
    level: "도전",
    prompt:
      "객관식 상식 퀴즈 5문제를 한 문제씩 보여주는 웹앱을 만들어줘. 정답 피드백, 다음 문제, 최종 점수와 다시 풀기 기능을 넣어줘.",
    lesson: "여러 화면 상태와 점수 계산",
    demoUrl: "",
    githubUrl: "",
    favorite: false,
    createdAt: "2026-07-23",
  },
  {
    id: "focus-timer",
    title: "집중 타이머",
    summary: "25분 집중과 5분 휴식을 반복하도록 돕는 단순한 타이머",
    category: "도구",
    level: "도전",
    prompt:
      "25분 집중, 5분 휴식을 선택할 수 있는 타이머를 만들어줘. 시작, 일시정지, 초기화 버튼과 시간이 끝났을 때 알림 문구를 넣어줘.",
    lesson: "시간 처리와 시작·정지 상태 관리",
    demoUrl: "",
    githubUrl: "",
    favorite: false,
    createdAt: "2026-07-23",
  },
  {
    id: "portfolio-hub-plan",
    title: "바이브코딩 작품 허브",
    summary: "수업에서 만든 모든 프로그램을 한 메인 페이지에 모아 포트폴리오처럼 보여주는 운영 방법",
    category: "학습",
    level: "입문",
    prompt:
      "내가 수업에서 만든 바이브코딩 프로그램들을 한눈에 볼 수 있는 메인 페이지를 구성해줘. 각 프로그램은 별도 GitHub 저장소와 GitHub Pages 주소를 사용하고, 메인 페이지 카드에는 프로젝트명, 설명, 제작 프롬프트, 웹앱 실행 링크, GitHub 링크를 넣어줘.",
    lesson: "프로그램별 독립 배포와 메인 포트폴리오 연결",
    demoUrl: "https://dasahee-source.github.io/my-vibe-coding-library/",
    githubUrl: "https://github.com/dasahee-source/my-vibe-coding-library",
    favorite: true,
    createdAt: "2026-07-24",
  },
  {
    id: "dart-wheel",
    title: "다트 돌리기",
    summary: "원하는 후보를 입력하고 원판을 돌려 한 가지를 무작위로 선택하는 게임",
    category: "게임",
    level: "입문",
    prompt: "후보를 줄마다 입력하면 색상 원판에 자동 배치하고, 버튼을 누르면 회전 애니메이션 뒤 무작위 결과를 보여주는 반응형 웹게임을 만들어줘.",
    lesson: "배열 입력, 무작위 선택, CSS 회전 애니메이션",
    demoUrl: "games/dart/",
    githubUrl: "https://github.com/dasahee-source/my-vibe-coding-library",
    status: "완성",
    favorite: false,
    createdAt: "2026-07-24",
  },
  {
    id: "ladder-game",
    title: "사다리타기",
    summary: "2~8명의 참가자와 결과를 입력하고 사다리 경로를 따라 결과를 확인하는 게임",
    category: "게임",
    level: "도전",
    prompt: "2명부터 8명까지 인원수를 정하고 참가자 이름과 결과를 입력할 수 있는 사다리타기 게임을 만들어줘. 사다리는 무작위 생성하고 선택한 경로를 색으로 표시해줘.",
    lesson: "Canvas 좌표, 무작위 사다리 생성, 경로 추적",
    demoUrl: "games/ladder/",
    githubUrl: "https://github.com/dasahee-source/my-vibe-coding-library",
    status: "완성",
    favorite: false,
    createdAt: "2026-07-24",
  },
  {
    id: "rock-paper-scissors",
    title: "가위바위보",
    summary: "컴퓨터와 가위바위보를 겨루고 승리·무승부·패배 전적을 확인하는 게임",
    category: "게임",
    level: "입문",
    prompt: "가위, 바위, 보 버튼 중 하나를 고르면 컴퓨터가 무작위로 선택하고 승패를 판정하는 웹게임을 만들어줘. 누적 전적과 초기화 기능도 넣어줘.",
    lesson: "조건문, 무작위 선택, 점수 상태 관리",
    demoUrl: "games/rps/",
    githubUrl: "https://github.com/dasahee-source/my-vibe-coding-library",
    status: "완성",
    favorite: false,
    createdAt: "2026-07-24",
  },
  {
    id: "number-guess",
    title: "숫자 맞히기",
    summary: "난이도를 선택하고 높다·낮다 힌트로 숨겨진 숫자를 맞히는 게임",
    category: "게임",
    level: "입문",
    prompt: "1부터 50, 100, 500 중 난이도를 선택하고 숨겨진 숫자를 맞히는 게임을 만들어줘. 높고 낮음 힌트, 시도 횟수, 다시 하기 기능을 넣어줘.",
    lesson: "입력값 검증, 비교 조건문, 게임 초기화",
    demoUrl: "games/guess/",
    githubUrl: "https://github.com/dasahee-source/my-vibe-coding-library",
    status: "완성",
    favorite: false,
    createdAt: "2026-07-24",
  },
  {
    id: "memory-cards",
    title: "기억력 카드 맞추기",
    summary: "뒤집힌 카드의 위치를 기억해 같은 그림 두 장을 모두 찾아내는 게임",
    category: "게임",
    level: "초급",
    prompt: "그림 8쌍을 무작위로 섞어 4×4로 보여주는 기억력 카드 게임을 만들어줘. 두 장씩 뒤집고 일치 여부를 확인하며 이동 횟수와 완료 메시지를 표시해줘.",
    lesson: "배열 섞기, 카드 상태, 지연 처리",
    demoUrl: "games/memory/",
    githubUrl: "https://github.com/dasahee-source/my-vibe-coding-library",
    status: "완성",
    favorite: false,
    createdAt: "2026-07-24",
  },
  {
    id: "reaction-test",
    title: "반응속도 테스트",
    summary: "화면이 초록색으로 변하는 순간 클릭해 밀리초 단위 반응속도를 측정하는 게임",
    category: "게임",
    level: "초급",
    prompt: "무작위 대기 시간 뒤 화면이 초록색으로 바뀌면 클릭하는 반응속도 테스트를 만들어줘. 너무 일찍 누른 경우 안내하고 최고 기록을 브라우저에 저장해줘.",
    lesson: "타이머, 시간 측정, 브라우저 저장",
    demoUrl: "games/reaction/",
    githubUrl: "https://github.com/dasahee-source/my-vibe-coding-library",
    status: "완성",
    favorite: false,
    createdAt: "2026-07-24",
  },
];

const emptyProject: Omit<Project, "id" | "favorite" | "createdAt"> = {
  title: "",
  summary: "",
  category: "게임",
  level: "입문",
  prompt: "",
  lesson: "",
  demoUrl: "",
  githubUrl: "",
  status: "제작 중",
};

function isSafeUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>(sampleProjects);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("전체");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detail, setDetail] = useState<Project | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProject);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const savedProjects = JSON.parse(saved) as Project[];
        const savedIds = new Set(savedProjects.map((project) => project.id));
        const newSamples = sampleProjects.filter((project) => !savedIds.has(project.id));
        setProjects([...newSamples, ...savedProjects]);
      }
    } catch {
      setMessage("저장된 자료를 읽지 못해 기본 예시를 불러왔어요.");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 1800);
    return () => window.clearTimeout(timer);
  }, [message]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesCategory = category === "전체" || project.category === category;
      const matchesFavorite = !favoriteOnly || project.favorite;
      const haystack = `${project.title} ${project.summary} ${project.prompt} ${project.lesson}`.toLowerCase();
      return matchesCategory && matchesFavorite && (!keyword || haystack.includes(keyword));
    });
  }, [projects, search, category, favoriteOnly]);

  const featuredProject =
    projects.find((project) => project.favorite && project.demoUrl) ??
    projects.find((project) => project.demoUrl) ??
    projects[0];

  function openCreate() {
    setEditingId(null);
    setForm(emptyProject);
    setModalOpen(true);
  }

  function openEdit(project: Project) {
    setEditingId(project.id);
    setForm({
      title: project.title,
      summary: project.summary,
      category: project.category,
      level: project.level,
      prompt: project.prompt,
      lesson: project.lesson,
      demoUrl: project.demoUrl,
      githubUrl: project.githubUrl,
      status: project.status ?? (project.demoUrl ? "완성" : "아이디어"),
    });
    setDetail(null);
    setModalOpen(true);
  }

  function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSafeUrl(form.demoUrl) || !isSafeUrl(form.githubUrl)) {
      setMessage("웹주소는 http:// 또는 https://로 시작해 주세요.");
      return;
    }

    if (editingId) {
      setProjects((current) =>
        current.map((project) => (project.id === editingId ? { ...project, ...form } : project)),
      );
      setMessage("프로젝트를 수정했어요.");
    } else {
      const project: Project = {
        ...form,
        id: crypto.randomUUID(),
        favorite: false,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setProjects((current) => [project, ...current]);
      setMessage("새 프로젝트를 차곡차곡 넣었어요.");
    }
    setModalOpen(false);
  }

  function removeProject(id: string) {
    if (!window.confirm("이 프로젝트를 도서관에서 삭제할까요?")) return;
    setProjects((current) => current.filter((project) => project.id !== id));
    setDetail(null);
    setMessage("프로젝트를 삭제했어요.");
  }

  function toggleFavorite(id: string) {
    setProjects((current) =>
      current.map((project) =>
        project.id === id ? { ...project, favorite: !project.favorite } : project,
      ),
    );
  }

  async function copyPrompt(prompt: string) {
    await navigator.clipboard.writeText(prompt);
    setMessage("제작 프롬프트를 복사했어요.");
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(projects, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `vibe-coding-library-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("백업 파일을 내려받았어요.");
  }

  function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) throw new Error("invalid");
        setProjects(parsed);
        setMessage("백업 파일을 불러왔어요.");
      } catch {
        setMessage("올바른 도서관 백업 파일이 아니에요.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="나의 바이브코딩 도서관 홈">
          <span className="brand-mark">V</span>
          <span>나의 바이브코딩 도서관</span>
        </a>
        <nav className="top-actions" aria-label="자료 관리">
          <button className="button button-quiet" onClick={exportData}>내보내기</button>
          <button className="button button-quiet" onClick={() => fileInputRef.current?.click()}>
            가져오기
          </button>
          <input
            ref={fileInputRef}
            className="sr-only"
            type="file"
            accept="application/json"
            onChange={importData}
          />
          <button className="button button-primary" onClick={openCreate}>＋ 새 프로그램</button>
        </nav>
      </header>

      <section className="hero" id="top">
        <div>
          <p className="eyebrow">MY VIBE CODING LIBRARY</p>
          <h1>만든 프로그램을 한눈에,<br /><span>나만의 서가.</span></h1>
          <p className="hero-copy">
            수업에서 완성한 웹앱을 실행하고, 코드와 제작 과정을 다시 꺼내 보세요.
            작은 실습들이 모여 나만의 바이브코딩 포트폴리오가 됩니다.
          </p>
        </div>
        <div className="hero-note" aria-label="도서관 현황">
          <span className="tape" aria-hidden="true" />
          <strong>{projects.length}</strong>
          <span>개의 프로그램을<br />기록했어요</span>
          <small>JSON 백업으로 집에서도 이어서 작업하세요.</small>
        </div>
      </section>

      {featuredProject && (
        <section className="featured" aria-labelledby="featured-title">
          <div className="featured-copy">
            <p className="section-kicker">FEATURED PROGRAM</p>
            <span className="status-badge">
              {featuredProject.status ?? (featuredProject.demoUrl ? "완성" : "아이디어")}
            </span>
            <h2 id="featured-title">{featuredProject.title}</h2>
            <p>{featuredProject.summary}</p>
            <div className="featured-actions">
              {featuredProject.demoUrl && (
                <a className="button button-primary" href={featuredProject.demoUrl} target="_blank" rel="noreferrer">
                  프로그램 실행 ↗
                </a>
              )}
              {featuredProject.githubUrl && (
                <a className="button button-quiet" href={featuredProject.githubUrl} target="_blank" rel="noreferrer">
                  GitHub 코드
                </a>
              )}
              <button className="button button-quiet" onClick={() => setDetail(featuredProject)}>
                제작 과정 보기
              </button>
            </div>
          </div>
          <div className="featured-visual" aria-hidden="true">
            <span className="featured-window-bar">● ● ●</span>
            <strong>{featuredProject.title}</strong>
            <small>{featuredProject.category} · {featuredProject.level}</small>
          </div>
        </section>
      )}

      <section className="library" aria-labelledby="library-title">
        <div className="section-heading">
          <div>
            <p className="section-kicker">PROJECT SHELF</p>
            <h2 id="library-title">내 프로그램 컬렉션</h2>
          </div>
          <p>{filtered.length}개의 프로그램</p>
        </div>

        <div className="toolbar">
          <label className="search">
            <span aria-hidden="true">⌕</span>
            <span className="sr-only">프로그램 검색</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="프로그램, 제작 프롬프트, 배운 점 검색"
            />
          </label>
          <button
            className={`favorite-filter ${favoriteOnly ? "active" : ""}`}
            aria-pressed={favoriteOnly}
            onClick={() => setFavoriteOnly((value) => !value)}
          >
            ★ 즐겨찾기
          </button>
        </div>

        <div className="chips" aria-label="카테고리">
          {categories.map((item) => (
            <button
              key={item}
              className={category === item ? "active" : ""}
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {filtered.length ? (
          <div className="project-grid">
            {filtered.map((project, index) => (
              <article className={`project-card accent-${index % 3}`} key={project.id}>
                <div className="bookmark" aria-hidden="true" />
                <div className="card-meta">
                  <span>{project.category}</span>
                  <span>{project.level}</span>
                  <span className="status-chip">{project.status ?? (project.demoUrl ? "완성" : "아이디어")}</span>
                  <button
                    className={`star ${project.favorite ? "active" : ""}`}
                    aria-label={`${project.title} ${project.favorite ? "즐겨찾기 해제" : "즐겨찾기"}`}
                    onClick={() => toggleFavorite(project.id)}
                  >
                    {project.favorite ? "★" : "☆"}
                  </button>
                </div>
                <h3>{project.title}</h3>
                <p>{project.summary}</p>
                <div className="lesson">
                  <span>이번에 배운 것</span>
                  <strong>{project.lesson}</strong>
                </div>
                <div className="card-actions">
                  {project.demoUrl ? (
                    <a className="button button-primary" href={project.demoUrl} target="_blank" rel="noreferrer">
                      프로그램 실행
                    </a>
                  ) : (
                    <button className="button button-primary" onClick={() => setDetail(project)}>
                      제작 과정 보기
                    </button>
                  )}
                  {project.githubUrl && (
                    <a className="button button-quiet" href={project.githubUrl} target="_blank" rel="noreferrer">
                      GitHub
                    </a>
                  )}
                  {project.demoUrl && (
                    <button className="button button-quiet" onClick={() => setDetail(project)}>
                      상세
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty">
            <span>✦</span>
            <h3>아직 이 서가가 비어 있어요.</h3>
            <p>검색어를 바꾸거나 새 프로그램을 기록해 보세요.</p>
            <button className="button button-primary" onClick={openCreate}>새 프로그램 추가</button>
          </div>
        )}
      </section>

      <section className="backup-tip">
        <span className="tip-icon">↗</span>
        <div>
          <strong>수업이 끝나기 전에 꼭 백업하세요.</strong>
          <p>‘내보내기’로 JSON 파일을 저장하면 다른 PC에서도 ‘가져오기’로 내 도서관을 이어 쓸 수 있어요.</p>
        </div>
        <button className="button button-primary" onClick={exportData}>내 도서관 백업</button>
      </section>

      <footer>
        <p>작은 아이디어를 직접 만들고, 기록하고, 다시 꺼내 쓰세요.</p>
        <span>나의 바이브코딩 도서관</span>
      </footer>

      {modalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setModalOpen(false)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-form-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <p className="section-kicker">NEW RECORD</p>
                <h2 id="project-form-title">{editingId ? "프로그램 수정" : "새 프로그램 기록"}</h2>
              </div>
              <button className="close" aria-label="닫기" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <form onSubmit={saveProject}>
              <label>프로그램명<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
              <label>한 줄 설명<input required value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></label>
              <div className="form-row form-row-three">
                <label>카테고리
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {categories.slice(1).map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label>난이도
                  <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as Project["level"] })}>
                    <option>입문</option><option>초급</option><option>도전</option>
                  </select>
                </label>
                <label>진행 상태
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Project["status"] })}>
                    <option>아이디어</option><option>제작 중</option><option>완성</option>
                  </select>
                </label>
              </div>
              <label>제작 프롬프트<textarea required rows={5} value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} /></label>
              <label>이번에 배운 것<input required value={form.lesson} onChange={(e) => setForm({ ...form, lesson: e.target.value })} /></label>
              <div className="form-row">
                <label>완성 웹주소 <span>(선택)</span><input type="url" placeholder="https://..." value={form.demoUrl} onChange={(e) => setForm({ ...form, demoUrl: e.target.value })} /></label>
                <label>GitHub 주소 <span>(선택)</span><input type="url" placeholder="https://github.com/..." value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} /></label>
              </div>
              <div className="modal-actions">
                <button type="button" className="button button-quiet" onClick={() => setModalOpen(false)}>취소</button>
                <button className="button button-primary">{editingId ? "수정 내용 저장" : "컬렉션에 추가"}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {detail && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setDetail(null)}>
          <section
            className="modal detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <p className="section-kicker">
                  {detail.category} · {detail.level} · {detail.status ?? (detail.demoUrl ? "완성" : "아이디어")}
                </p>
                <h2 id="detail-title">{detail.title}</h2>
              </div>
              <button className="close" aria-label="닫기" onClick={() => setDetail(null)}>×</button>
            </div>
            <p className="detail-summary">{detail.summary}</p>
            <div className="program-links">
              {detail.demoUrl && <a className="button button-primary" href={detail.demoUrl} target="_blank" rel="noreferrer">프로그램 실행 ↗</a>}
              {detail.githubUrl && <a className="button button-quiet" href={detail.githubUrl} target="_blank" rel="noreferrer">GitHub 코드</a>}
            </div>
            <div className="prompt-box">
              <span>제작 프롬프트</span>
              <p>{detail.prompt}</p>
              <button className="button button-primary" onClick={() => copyPrompt(detail.prompt)}>프롬프트 복사</button>
            </div>
            <div className="detail-lesson"><span>이번에 배운 것</span><strong>{detail.lesson}</strong></div>
            <div className="link-actions">
              {!detail.demoUrl && !detail.githubUrl && <p>완성 웹주소와 GitHub 주소는 수정 화면에서 추가할 수 있어요.</p>}
            </div>
            <div className="modal-actions split">
              <button className="button button-danger" onClick={() => removeProject(detail.id)}>삭제</button>
              <button className="button button-quiet" onClick={() => openEdit(detail)}>수정</button>
            </div>
          </section>
        </div>
      )}

      {message && <div className="toast" role="status">{message}</div>}
    </main>
  );
}
