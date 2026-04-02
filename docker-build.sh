docker build -t simple-arch-notification -f services/notification/Dockerfile .
docker build -t simple-arch-auth -f services/auth-service/Dockerfile .
docker build -t simple-arch-webserver -f services/webserver/Dockerfile . 
docker build -t simple-arch-consumer -f services/consumer/Dockerfile . 