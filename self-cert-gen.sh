# 0. ha-proxy cert
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=IT/ST=Italy/L=Naples/O=Dev/OU=Localhost/CN=localhost"
cat cert.pem key.pem > localhost.pem
rm cert.pem key.pem

# 1. CA
openssl genrsa -out ca.key 2048
openssl req -new -x509 -days 365 -key ca.key -out ca.crt -subj "/CN=SimpleArch-CA"

# 2. Server Cert (Notification Service)
openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr -subj "/CN=localhost"
openssl x509 -req -days 365 -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt

# 3. Client Cert (Producer/Consumer)
openssl genrsa -out client.key 2048
openssl req -new -key client.key -out client.csr -subj "/CN=SimpleArch-Client"
openssl x509 -req -days 365 -in client.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out client.crt

cp *.crt *.key localhost.pem ./shared/certs/
cp server.key server.crt ca.crt ./services/notification/certs/
cp client.key client.crt ca.crt ./services/producer/certs
rm *.csr *.crt *.key localhost.pem ca.srl