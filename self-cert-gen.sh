openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=IT/ST=Italy/L=Naples/O=Dev/OU=Localhost/CN=localhost"
cat cert.pem key.pem > localhost.pem
rm cert.pem key.pem