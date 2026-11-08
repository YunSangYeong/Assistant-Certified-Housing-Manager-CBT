# 검증 기록

2026-11-08 (Asia/Seoul). 작업 디렉터리 `/workspace/Assistant-Certified-Housing-Manager-CBT`.

## 자료 검토

- 작업 시작 시 README만 존재, AGENTS.md 없음, Git 상태 clean, 로컬 work 브랜치와 원격 main 커밋 `5d6c3d70fabfa2e2521a53eac06ce7602d050d3a` 확인.
- 표준 v1.4.0 main `76b990b8720adfa85c22a0a8f699b17094aa357b` 및 references 전체를 읽고 복사. 고정 앱 커밋에서 소스·설정·MIT·workflow·검사 구조 재사용. 전기 문항은 복사하지 않음.
- Q-Net 및 국가법령정보센터 확인 시 각각 `CONNECT tunnel failed, response 403`; 원문 접근·이용 조건·최신 규칙 대조 미완료. 기출/복원 0.
- 40개 민법 개념 설명·선택지 내부 검토, 16 계산 유형 × 60조건 독립 재계산. 외부 전문가 검수/공식 대조 0.
- 기본 문항의 ID와 NFKC·공백 제거·보기 정렬 본문 해시 중복 0. 수치 조건 변형은 같은 유형으로 묶어 공개. 의미 검토 범위는 40개 개념과 16개 계산 유형이며 1,000개의 독립 주제를 확보했다는 뜻이 아님.
- 총 1,000 = 회계 480 + 시설 480 + 민법 40. reviewed(내부) 1,000, pending 0, 목표 부족 0. 개인 가져오기는 수량에 미포함.
- 재생성 SHA256 `3d300c6c56735f5ed5317a37d8b15ff764523868d67b3444ea91ba3a87fb0b71` 동일 확인.

## 로컬 검증

- `npm ci --cache /tmp/housing-npm-cache --no-audit --no-fund`: 종료 0. 최초 기본 캐시는 sandbox 외부 `/home/agent/.npm/_cacache` 쓰기 실패(ENOENT)로 설치가 실패하여 /tmp 캐시로 변경. TLS·integrity 검증 유지.
- `npm test`: 종료 0, 972개 통과. 수치 960개 독립 재계산·정답 번호·단위·동치 보기; 1,000개 스키마/중복/과목 분포; 평균·과락 경계, 기한, 변경·복원, pending 제외, 가져오기, 랜덤 순회·중복 채점 방지 포함.
- `npm run build`: 종료 0. TypeScript 및 Vite production build 통과. 데이터 포함 JS 약 1.29 MB, gzip 약 138 KB로 500 KB 번들 권고 경고가 있음(실패 아님).
- 브라우저: Playwright + 시스템 Chromium, PC와 Pixel 7 모바일 **에뮬레이션**. 실기기·Safari·Firefox 검사 미실행.
- 1차 브라우저 검사에서 저장 실패 경고 및 통계 집계 범위 안내를 금지 배너로 넓게 집계한 검사 2개가 실패. 저장 오류 경고와 통계 안내는 정책상 허용되므로 금지된 비공식·검증 대기·잠정 규칙·기출 미제공 배너로 검사 범위를 바로잡음. 앱 경고를 삭제하거나 면책 배너를 허용하지 않음. 수정 후 해당 PC/모바일 검사 2개 통과(종료 0). 최종 합계 28개 통과, 터치 없는 PC 프로젝트의 터치 전용 2개 의도적 skip, 미해결 실패 0.
- 스크롤은 메뉴 애니메이션 후 `mouse.wheel`과 CDP 실제 `touchStart/move/end`로 입력. `scrollTop` 직접 대입 없음. 390×480, 740×360에서 하단 초기화 실제 선택·취소 후 위로 돌아와 대시보드 선택 확인. 확대 글자와 390×360 높이 변경에서 백업·대시보드 접근 확인. 휠·터치는 별도 검사.
- 두 모드 Space·포커스·미응답/길게 누르기/폼/대화상자/마지막 문제 보호, 답안 변경·새로고침·기한·자동 제출·중복 제출 방지, 해설 비공개/제출 후 표시, 과락 결과, 오답·북마크·통계, JSON/CSV·검수 승인·초기화 확인.

## 배포

**사전 확인에서 첫 차단, 배포 중단.**

- 첫 요청: `gh api repos/YunSangYeong/Assistant-Certified-Housing-Manager-CBT --jq '{full_name,default_branch,archived,permissions,visibility}'`
- 종료 코드 1, 실제 오류: `Get "https://api.github.com/repos/YunSangYeong/Assistant-Certified-Housing-Manager-CBT": Forbidden`
- API 권한/인증/네트워크 중 무엇이 원인인지 응답만으로 확정할 수 없음. 토큰 값을 출력하거나 새 토큰을 요구하지 않음.
- 이 요청을 재시도하지 않음. Pages 조회·main push·workflow dispatch·대체 배포 경로 실행 없음.
- main은 시작 커밋 그대로 두며 구현 보존만을 위한 `codex/housing-cbt-1000` 브랜치를 사용. push 트리거가 main에만 있고 PR도 만들지 않아 이 보존 push는 Pages를 시작하지 않음.
- 이 작업에서 CI/Pages 실행을 시작하지 않았음. 기존 Pages 게시 여부는 조회하지 못해 미확인. 공개 사이트도 확인하지 않음. 예상 URL은 README 참조, 성공 링크가 아님.
- 사용자의 첫 최소 동작: 대상 저장소 Settings → Pages에서 Build and deployment의 Source를 확인. 최초 설정이 필요하면 GitHub Actions 선택. 이는 API 403을 해결했다는 뜻이 아니며, 에이전트는 자동 재시도하지 않음. 이후 마무리는 사용자 진행.

로컬 검사와 원격 브랜치 보존은 배포 성공의 증거가 아닙니다.

PC·모바일 대시보드/시험 스크린샷을 생성해 시각 확인함. 브라우저 에뮬레이션이며 공개 사이트 확인과 구별함.
