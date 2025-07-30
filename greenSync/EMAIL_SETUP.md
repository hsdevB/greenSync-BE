# 이메일 인증 설정 가이드

## 1. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# 이메일 인증 설정
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# 기타 설정들...
DB_HOST=localhost
DB_PORT=3306
DB_NAME=greensync
DB_USER=root
DB_PASSWORD=your-password
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=development
```

## 2. Gmail 앱 비밀번호 설정

1. Gmail 계정에서 2단계 인증을 활성화하세요
2. Google 계정 설정 → 보안 → 앱 비밀번호로 이동
3. "앱 선택" → "기타" → 앱 이름 입력 (예: "GreenSync")
4. 생성된 16자리 앱 비밀번호를 `EMAIL_PASSWORD`에 설정

## 3. 이메일 인증 기능

### 발송된 이메일 인증코드
- 6자리 숫자 코드
- 10분간 유효
- 최대 5회 시도 가능
- 만료되거나 시도 횟수 초과시 재발송 필요

### API 엔드포인트

#### 이메일 인증코드 발송
```
POST /signup/send-email-code
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### 이메일 인증코드 확인
```
POST /signup/verify-email-code
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}
```

## 4. 보안 고려사항

현재 구현은 메모리 기반 코드 저장소를 사용합니다. 프로덕션 환경에서는 다음을 권장합니다:

- Redis나 데이터베이스를 사용한 코드 저장
- IP 기반 요청 제한
- 더 강력한 인증코드 생성 (문자+숫자 조합)
- 이메일 템플릿의 보안 강화

## 5. 주기적 정리

만료된 인증코드를 정리하기 위해 주기적으로 다음 메서드를 호출하세요:

```javascript
// 매 10분마다 실행
setInterval(() => {
  UserService.cleanupExpiredCodes();
}, 10 * 60 * 1000);
``` 