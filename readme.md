# start
```
git clone https://github.com/LinX9581/nodejs-template.git
cd nodejs-template
cat>.env<<EOF
db_host=172.16.200.6
db_user=docker
db_password=00000000
port_test = 4006
port_dev = 4007
port_prod = 3005
EOF
yarn install
npm start
```
* basic env
express ejs mysql babel global-config docker gitlabci

## Docker
* build image
```
docker build -t nodejs-template:1.0 . --no-cache
```
* image to container
```
cd /nodejs-template
docker run -itd -v ./.env:/usr/src/app/.env --name nodejs-template -p 3005:3005 nodejs-template:1.0
```
* ssh to container
```
docker exec -it nodejs-template bash
```
* get container realtime logs
```
docker logs --follow nodejs-template
```
* image push to docker hub
```
docker login
docker tag nodejs-template:1.0 linx9581/nodejs-template:1.0
docker push linx9581/nodejs-template:1.0
```
## push image to artifactory registry
```
gcloud auth activate-service-account --key-file project-name.json
gcloud config set project project-name
gcloud auth configure-docker asia-docker.pkg.dev

gcloud artifacts repositories create nodejs-repo --repository-format=docker --location=asia --description="Docker repository"
docker build -t asia-docker.pkg.dev/project-name/nodejs-repo/nodejs-template:4.6 . --no-cache
docker push asia-docker.pkg.dev/project-name/nodejs-repo/nodejs-template:4.6

```
## push to cloud run
gcloud run deploy my-service5 --image=asia-docker.pkg.dev/project-name/nodejs-repo/nodejs-template:4.6 --region=asia-east1 --platform=managed --allow-unauthenticated --memory=512Mi --cpu=1 --max-instances=3 --timeout=10m --concurrency=1 --set-env-vars=db_user=dev,db_password=00000000

敏感資料應該放 secret manager

## Build Private Registry
```
docker run -d -p 3008:5000 -v /docker/registry:/var/lib/registry --name registry registry:2
cat>/etc/docker/daemon.json<<EOF
{ "insecure-registries":["IP:3008"] }
EOF
systemctl restart docker

docker tag nodejs-template IP:3008/nodejs-template:1.1
docker push IP:3008/nodejs-template:1.1
docker pull IP:3008/nodejs-template:1.1

curl -X GET IP:3008/v2/_catalog
curl -X GET IP:3008/v2/mytomcat/tags/list

docker run -d -p 3009:8080 --name registry-web --link registry -e REGISTRY_URL=http://IP:3008/v2 hyper/docker-registry-web
```