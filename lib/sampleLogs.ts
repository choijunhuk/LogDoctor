// Realistic sample logs for the "예시 로그 불러오기" feature.

export interface SampleLog {
  id: string;
  label: string;
  log: string;
}

export const SAMPLE_LOGS: SampleLog[] = [
  {
    id: "spring-bean",
    label: "Spring Boot BeanCreationException 예시",
    log: `2024-06-20 10:12:31.044  INFO 14922 --- [           main] com.example.DemoApplication              : Starting DemoApplication
2024-06-20 10:12:33.512  WARN 14922 --- [           main] ConfigServletWebServerApplicationContext : Exception encountered during context initialization - cancelling refresh attempt
org.springframework.beans.factory.UnsatisfiedDependencyException: Error creating bean with name 'securityConfig': Unsatisfied dependency expressed through field 'jwtTokenProvider'
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.doCreateBean(AbstractAutowireCapableBeanFactory.java:659)
Caused by: org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'jwtTokenProvider' defined in file [JwtTokenProvider.class]
Caused by: java.lang.IllegalArgumentException: JWT secret must not be null. Set JWT_SECRET in application.yml or .env
	at com.example.security.JwtTokenProvider.<init>(JwtTokenProvider.java:34)
2024-06-20 10:12:33.640 ERROR 14922 --- [           main] o.s.boot.SpringApplication               : Application run failed`,
  },
  {
    id: "nginx-502",
    label: "Nginx 502 Bad Gateway 예시",
    log: `2024/06/20 10:30:11 [error] 2451#2451: *17 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.0.4, server: api.example.com, request: "GET /api/health HTTP/1.1", upstream: "http://127.0.0.1:8080/api/health", host: "api.example.com"
2024/06/20 10:30:11 [error] 2451#2451: *17 no live upstreams while connecting to upstream
10.0.0.4 - - [20/Jun/2024:10:30:11 +0900] "GET /api/health HTTP/1.1" 502 157 "-" "curl/8.4.0"
2024/06/20 10:30:14 [warn] 2451#2451: *18 upstream server temporarily disabled while connecting to upstream`,
  },
  {
    id: "docker-exited",
    label: "Docker container exited 예시",
    log: `$ docker compose up -d
[+] Running 2/2
 ✔ Container app-db-1   Started
 ✔ Container app-api-1  Started
$ docker ps -a
CONTAINER ID   IMAGE        COMMAND                  STATUS                     PORTS     NAMES
9f2c1a4b7e8d   app-api      "java -jar app.jar"      Exited (1) 3 seconds ago             app-api-1
$ docker logs app-api-1
Error: Failed to configure a DataSource: 'url' attribute is not specified and no embedded datasource could be configured.
Caused by: Communications link failure: The last packet sent successfully to the server was 0 milliseconds ago.
Connection refused (Connection refused)
container app-api-1 exited with code 1`,
  },
  {
    id: "node-eaddrinuse",
    label: "Node.js EADDRINUSE 예시",
    log: `> api@1.0.0 dev
> node server.js

node:events:495
      throw er; // Unhandled 'error' event
      ^
Error: listen EADDRINUSE: address already in use :::3000
    at Server.setupListenHandle [as _listen2] (node:net:1872:16)
    at listenInCluster (node:net:1920:12)
    at Server.listen (node:net:2008:7)
Emitted 'error' event on Server instance at:
    at emitErrorNT (node:net:1899:8)
npm ERR! code ELIFECYCLE
npm ERR! errno 1`,
  },
  {
    id: "mysql-access-denied",
    label: "MySQL Access denied 예시",
    log: `2024-06-20T10:40:02.118Z mysql-connector ERROR Access denied for user 'app'@'10.0.0.7' (using password: YES)
2024-06-20T10:40:02.119Z app ERROR Communications link failure
2024-06-20T10:40:02.120Z app ERROR Unable to obtain connection: jdbc:mysql://db:3306/appdb?user=app&password=secret123
HikariPool-1 - Exception during pool initialization.
java.sql.SQLException: Access denied for user 'app'@'10.0.0.7' (using password: YES)`,
  },
  {
    id: "gha-build-failed",
    label: "GitHub Actions build failed 예시",
    log: `Run npm ci
npm ERR! code EUSAGE
npm ERR! The \`npm ci\` command can only install with an existing package-lock.json
Run npm run build
> build
> next build
Failed to compile.
./app/page.tsx:14:7
Type error: Cannot find name 'analyzeLogg'.
Error: Process completed with exit code 1.
##[error]Process completed with exit code 1.
workflow failed`,
  },
];
