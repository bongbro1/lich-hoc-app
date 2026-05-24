xem log doccker
docker logs -f tnut-ictu-api

thay đổi api
git pull
docker-compose down
docker-compose up -d --build


deploy apk
npx expo run:android --variant release
hoặc
eas build -p android --profile preview   (online)