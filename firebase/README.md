# LCC POM 알림 활성화 (Spark 무료 요금제)

프로젝트: **lccstats**, 번호: **76567286678**. 사이트는 GitHub Pages에 그대로 둡니다.
FCM은 무료입니다. 공개 저장소의 표준 GitHub Actions와 Firestore 무료 할당량을 사용합니다.
Blaze, Cloud Functions, Cloud Scheduler, 결제 계정 연결은 이 구성에 필요하지 않습니다.
무료 할당량을 초과하면 동작이 제한될 수 있습니다. 실기기 전송은 아래 설정 후 검증해야 합니다.

## 1. Firebase 콘솔: 한 번만 설정

1. Authentication → 시작하기 → 로그인 방법 → **익명(Anonymous)** 사용 설정.
2. Authentication → 설정 → 승인된 도메인에 **cheongpaul.github.io** 추가.
3. Firestore Database → 데이터베이스 만들기 → **Standard / `(default)` / 프로덕션 모드**.
   지역은 가까운 **asia-northeast3 (Seoul)** 등을 선택합니다. 위치는 나중에 바꾸기 어려우므로 확인하세요.
4. Firestore → 규칙에서 이 폴더의 `firestore.rules`를 복사해 게시합니다.
   **이미 다른 앱 데이터/규칙이 있으면 덮어쓰지 말고 필요한 match 블록만 병합하세요.**
   사용자에게는 자기 구독 하나만 읽기/쓰기/삭제가 허용되며 목록 조회와 발송 상태 접근은 차단됩니다.
5. Cloud Messaging의 웹 푸시 공개 키는 이미 사이트에 넣었습니다. 비공개 키를 공유하지 마세요.

## 2. Google Cloud Shell: GitHub 발송 권한 연결

Google Cloud Console에서 `lccstats`를 선택하고 Cloud Shell을 엽니다.
새 디렉터리에서 저장소를 내려받아 스크립트를 먼저 읽고 실행하세요:

```bash
git clone https://github.com/CheongPaul/lcc.git lcc-pom-setup
cd lcc-pom-setup
less firebase/setup-github-oidc.sh
bash firebase/setup-github-oidc.sh
```

이 스크립트는 필요한 API, 전용 서비스 계정, 최소 문서 접근/FCM 전송 역할과 OIDC 연결을 만듭니다.
GitHub 저장소 숫자 ID·소유자 ID·main 브랜치·정확한 발송 workflow를 모두 제한합니다.
발송 계정은 Firestore 문서에 접근하므로 이 프로젝트에서 다른 민감한 앱 데이터와 함께 쓰지 않는 것이 좋습니다.
장기 비밀키를 만들거나 채팅/저장소에 저장할 필요가 없습니다. 권한 오류가 나면 중단하고 오류만 공유하세요.
카드 등록 또는 결제 전환 화면이 나오면 진행하지 말고 확인을 요청하세요.

## 3. GitHub에서 활성화

1. `CheongPaul/lcc` → Settings → Secrets and variables → Actions → **Variables**.
2. Repository variable **POM_PUSH_ENABLED** = **true** 추가.
3. Actions → **Send new match POM notifications** → Run workflow (main).
4. 첫 성공 실행은 현재 완료된 경기들을 기준선으로 저장합니다. 과거 경기는 발송하지 않습니다.
   동시에 `pushPublic/status`를 활성화하므로 이후 사이트에서 구독할 수 있습니다.
5. 아이폰: 홈 화면에 설치한 LCC에서 **POM 알림 받기** → 알림 허용.
   갤럭시: 지원 브라우저/설치 앱에서 같은 버튼을 누릅니다. 해제는 **POM 알림 끄기**.
6. 실제 새 경기의 열 명 기록이 완성된 후 두 번의 workflow가 지나면 기기에서 확인하세요.
   테스트 목적으로 실제 경기 기록을 조작하지 마세요. Firebase 콘솔의 테스트 메시지는 이 data-only 수신 경로와 다릅니다.

## 동작·한계

- 5분 간격 확인, 두 번 연속 동일한 완성 경기 확인 후 발송 (보통 5~10분 + GitHub 지연).
- 모든 선수 탭을 성공적으로 읽어야 처리합니다. 오프라인 스냅샷으로는 발송하지 않습니다.
- POM/입력 검증은 현재 `docs/pom.js`, `power-ranking.js`, `live.js`, `seasons.js`를 재사용합니다.
  파워랭킹이나 POM 계산식은 수정하지 않았습니다. 발송 시점의 POM을 고정하며,
  시즌 데이터가 추가되어 과거 POM 계산 결과가 달라져도 재발송하지 않습니다.
- 첫 기준선 이하의 과거 경기 ID, 수정된 경기, 새 구독자의 과거 경기에는 알림을 보내지 않습니다.
- 구독은 기기별 익명 Firebase 사용자에게 연결됩니다. 이름/이메일/Analytics를 수집하지 않습니다.
  기기 토큰·언어·등록/갱신 시각만 비공개 Firestore에 저장합니다.
- 서버는 기기마다 **발송 요청 최대 한 번**을 우선합니다. 요청 직전 상태 저장 후 중단되거나
  네트워크 응답이 불확실한 경우 중복 방지를 위해 재시도하지 않으므로 알림이 누락될 수 있습니다.
  FCM 수락은 실제 기기 전달 보장이 아닙니다. 오류는 Actions에서 확인하세요.
- 발송 비활성화: GitHub 변수 `POM_PUSH_ENABLED`를 `false`로 바꾸고,
  Firestore `pushPublic/status`의 `enabled`도 `false`로 바꾸세요.
- 공개 저장소에 활동이 60일 없으면 GitHub 예약 workflow가 꺼질 수 있습니다. Actions에서 재활성화하세요.
- Firebase 키/토큰이나 Google 액세스 토큰을 로그에 출력하지 않습니다. GitHub에는 공개 웹 설정만 포함됩니다.

## 로컬 검증

Node 22 이상에서 `node --test tests/pom-notifications.test.mjs` 실행.
테스트는 가짜 네트워크로 발송을 검증하며 실제 알림/Firestore 쓰기를 하지 않습니다.
