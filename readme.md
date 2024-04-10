# start
```
git clone https://github.com/LinX9581/ai-api-template.git
cd ai-api-template
cat>.env<<EOF
db_host=172.16.200.6
db_user=docker
db_password=00000000
port_test = 4006
port_dev = 4007
port_prod = 3006

GEMINI_API_KEY = 
OPENAI_API_KEY = 
GROQ_API_KEY = 
CLAUDE_API_KEY = 

EOF
yarn install
npm start
```

## test

* model
chatgpt4 chatgpt3 groq claude gemini

```
curl --location 'http://127.0.0.1:3008/ai/chatgpt4' \
--header 'Content-Type: application/json' \
--data '{
  "prompt":"你現在是貓 句尾都要加喵喵",
  "content": "你是誰"
}'
```

## Docker
* build image
```
docker build -t ai-api-test:1.0 . --no-cache
```
* image to container
```
cd /ai-api-test
docker run -itd -v ./.env:/usr/src/app/.env --name ai-api-test -p 3006:3006 ai-api-test:1.0
```
* ssh to container
```
docker exec -it ai-api-test bash
```
* get container realtime logs
```
docker logs --follow ai-api-test
```
* image push to docker hub
```
docker login
docker tag ai-api-test:1.0 linx9581/ai-api-test:1.0
docker push linx9581/ai-api-test:1.0
```
## push image to artifactory registry
```
gcloud auth activate-service-account --key-file project-name.json
gcloud config set project project-name
gcloud auth configure-docker asia-docker.pkg.dev

gcloud artifacts repositories create nodejs-repo --repository-format=docker --location=asia --description="Docker repository"
docker build -t asia-docker.pkg.dev/project-name/nodejs-repo/ai-api-test:4.6 . --no-cache
docker push asia-docker.pkg.dev/project-name/nodejs-repo/ai-api-test:4.6

```
## push to cloud run
gcloud run deploy my-service5 --image=asia-docker.pkg.dev/project-name/nodejs-repo/ai-api-test:4.6 --region=asia-east1 --platform=managed --allow-unauthenticated --memory=512Mi --cpu=1 --max-instances=3 --timeout=10m --concurrency=1 --set-env-vars=db_user=dev,db_password=00000000

敏感資料應該放 secret manager

## Build Private Registry
```
docker run -d -p 3008:5000 -v /docker/registry:/var/lib/registry --name registry registry:2
cat>/etc/docker/daemon.json<<EOF
{ "insecure-registries":["IP:3008"] }
EOF
systemctl restart docker

docker tag ai-api-test IP:3008/ai-api-test:1.1
docker push IP:3008/ai-api-test:1.1
docker pull IP:3008/ai-api-test:1.1

curl -X GET IP:3008/v2/_catalog
curl -X GET IP:3008/v2/mytomcat/tags/list

docker run -d -p 3009:8080 --name registry-web --link registry -e REGISTRY_URL=http://IP:3008/v2 hyper/docker-registry-web
```