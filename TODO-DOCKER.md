# Docker 배포 TODO

## 현재 PC에서 해야할 것

- [ ] Docker Hub 계정 생성 (https://hub.docker.com)
- [ ] Docker Hub 로그인: `docker login`
- [ ] 빌드 & 푸시: `./build-and-push.sh`

## 집 PC에서 해야할 것

- [ ] Docker 설치
- [ ] Ollama 설치 + 모델 다운: `ollama pull qwen2.5-coder:7b`
- [ ] `docker-compose.yml` 파일 복사 (또는 git clone)
- [ ] 이미지 받기: `docker compose pull`
- [ ] 실행: `docker compose up -d`
- [ ] Ollama 실행: `ollama serve`

## 접속

- Frontend: http://localhost
- Backend: http://localhost:3000

## 업데이트 시

```bash
# 개발 PC
./build-and-push.sh

# 집 PC
docker compose pull
docker compose up -d
```
