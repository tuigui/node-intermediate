export const HTTP_STATUS = {
  OK: 200, // 호출에 성공했을 때
  CREATED: 201, // 생성에 성공했을 때
  BAD_REQUEST: 400, // 사용자가 잘못 했을 때 (예: 입력 값을 빠뜨렸을 때)
  UNAUTHORIZED: 401, // 인증 실패 unauthenciated (예: 비밀번호가 틀렸을 때)
  FORBIDDEN: 403, // 인가 실패 unauthorized (예: 접근 권한이 없을 때)
  CONFLICT: 409, // 충돌이 발생했을 때 (예: 이메일 중복)
  INTERNAL_SERVER_ERROR: 500, // 예상치 못한 에러가 발생했을 때
};
