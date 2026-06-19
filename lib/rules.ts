import type { AnalysisRule, LogCategory, Severity } from "@/types/logAnalysis";

// =============================================================================
// Rule engine data. Each rule is pure data: the analyzer (lib/analyzer.ts) only
// iterates and scores. To support a new failure mode, add a rule here — no code
// change required.
// =============================================================================

export const ALL_CATEGORIES: LogCategory[] = [
  "Spring Boot",
  "Node.js / Express",
  "Docker",
  "Docker Compose",
  "Nginx",
  "MySQL",
  "Redis",
  "Git / GitHub Actions",
  "Linux / Ubuntu",
  "Network / Port",
  "Unknown",
];

/**
 * Default diagnostic/fix commands per category. Shown in the command tab even
 * when no specific rule attaches its own commands.
 */
export const COMMON_COMMANDS: Partial<
  Record<LogCategory, { command: string; description: string }[]>
> = {
  "Spring Boot": [
    { command: "lsof -i :8080", description: "Find the process holding port 8080" },
    { command: "sudo lsof -i :8080", description: "Same, with elevated privileges" },
    { command: "kill -9 <PID>", description: "Force-kill the process holding the port" },
    { command: "./gradlew bootRun", description: "Start the Spring Boot app (Gradle)" },
  ],
  "Node.js / Express": [
    { command: "lsof -i :3000", description: "Find the process holding port 3000" },
    { command: "kill -9 <PID>", description: "Force-kill the process holding the port" },
    { command: "npm run dev", description: "Start the dev server" },
    { command: "npm ci", description: "Clean, reproducible dependency install" },
  ],
  Docker: [
    { command: "docker ps", description: "List running containers" },
    { command: "docker ps -a", description: "List all containers, including exited" },
    { command: "docker logs <container>", description: "Show a container's logs" },
    { command: "docker inspect <container>", description: "Inspect container config & state" },
  ],
  "Docker Compose": [
    { command: "docker compose logs -f", description: "Follow logs for all services" },
    { command: "docker compose down", description: "Stop and remove the stack" },
    { command: "docker compose up -d --build", description: "Rebuild and start in background" },
    { command: "docker compose ps", description: "List compose services and state" },
  ],
  Nginx: [
    { command: "sudo nginx -t", description: "Test the Nginx configuration syntax" },
    { command: "sudo systemctl status nginx", description: "Check the Nginx service status" },
    { command: "sudo systemctl reload nginx", description: "Reload config without downtime" },
    { command: "sudo tail -f /var/log/nginx/error.log", description: "Follow the error log" },
    { command: "curl -I http://localhost", description: "Probe the front-end endpoint" },
    { command: "curl http://127.0.0.1:8080", description: "Probe the upstream backend directly" },
  ],
  MySQL: [
    { command: "sudo systemctl status mysql", description: "Check the MySQL service status" },
    { command: "mysql -u root -p", description: "Open a MySQL shell as root" },
    { command: "docker logs mysql", description: "Read logs of a MySQL container" },
    { command: "telnet 127.0.0.1 3306", description: "Test TCP reachability of port 3306" },
  ],
  Redis: [
    { command: "redis-cli ping", description: "Check whether Redis answers (expects PONG)" },
    { command: "redis-cli -a <password> ping", description: "Ping an auth-protected Redis" },
    { command: "sudo systemctl status redis", description: "Check the Redis service status" },
    { command: "telnet 127.0.0.1 6379", description: "Test TCP reachability of port 6379" },
  ],
  "Git / GitHub Actions": [
    { command: "git status", description: "Show working tree status" },
    { command: "git log --oneline -5", description: "Show the last 5 commits" },
    { command: "git remote -v", description: "Show configured remotes" },
    { command: "git pull --rebase", description: "Update branch, replaying local commits" },
    { command: "git diff", description: "Show unstaged changes" },
  ],
  "Linux / Ubuntu": [
    { command: "df -h", description: "Show disk usage (look for 100% full)" },
    { command: "free -h", description: "Show memory usage" },
    { command: "systemctl status <service>", description: "Check a service's status" },
    { command: "journalctl -u <service> -xe", description: "Read a service's detailed logs" },
    { command: "sudo apt update", description: "Refresh package lists" },
  ],
  "Network / Port": [
    { command: "lsof -i :<port>", description: "Find the process holding a port" },
    { command: "ss -tulpn", description: "List listening sockets and their PIDs" },
    { command: "curl -v http://127.0.0.1:<port>", description: "Verbosely probe a local port" },
  ],
};

const rule = (r: AnalysisRule): AnalysisRule => r;

export const RULES: AnalysisRule[] = [
  // ---- Spring Boot ----------------------------------------------------------
  rule({
    id: "spring-bean-creation",
    category: "Spring Boot",
    keywords: [
      "UnsatisfiedDependencyException",
      "BeanCreationException",
      "Error creating bean",
      "ApplicationContext",
    ],
    regexPatterns: [/BeanCreation\w*Exception/i, /UnsatisfiedDependencyException/i],
    severity: "critical",
    title: "Spring Bean creation failed",
    description:
      "The Spring application context failed to start because a bean could not be created or its dependencies could not be satisfied.",
    possibleCauses: [
      "A Spring bean failed to be created (Bean creation failure).",
      "A dependency required by the bean (e.g. JwtTokenProvider) is missing.",
      "A required value such as JWT_SECRET is missing from application.yml or .env.",
      "A @Component / @Service / @Repository annotation is missing on the target class.",
      "A constructor-injected bean is not registered in the context.",
    ],
    suggestedCommands: [
      { command: "./gradlew bootRun --stacktrace", description: "Run with a full stack trace" },
      { command: "grep -R \"JWT_SECRET\" src/ .env application.yml", description: "Check the secret is wired" },
    ],
    recommendedSteps: [
      "Read the 'Caused by' chain to find the first failing bean.",
      "Confirm the failing class has a stereotype annotation (@Component/@Service).",
      "Verify all constructor dependencies are themselves registered beans.",
      "Confirm required config values (e.g. JWT_SECRET) exist in application.yml / .env.",
      "Restart the app and re-read the log.",
    ],
  }),
  rule({
    id: "spring-datasource",
    category: "Spring Boot",
    keywords: [
      "Failed to configure a DataSource",
      "HikariPool",
      "Cannot determine embedded database driver",
    ],
    regexPatterns: [/Failed to configure a DataSource/i, /HikariPool-\d+/i],
    severity: "critical",
    title: "DataSource / DB connection pool failure",
    description:
      "Spring could not configure the database connection pool. The DB URL, credentials, or driver may be wrong, or the database is unreachable.",
    possibleCauses: [
      "spring.datasource.url / username / password is missing or wrong.",
      "The database server is not running or not reachable.",
      "The JDBC driver dependency is missing from the build.",
      "The database name in the URL does not exist yet.",
    ],
    suggestedCommands: [
      { command: "sudo systemctl status mysql", description: "Is the DB up?" },
      { command: "telnet 127.0.0.1 3306", description: "Is the DB port reachable?" },
    ],
    recommendedSteps: [
      "Verify the datasource URL/credentials in application.yml.",
      "Confirm the database server is running and reachable.",
      "Confirm the JDBC driver is on the classpath.",
      "Restart the app and re-read the log.",
    ],
  }),
  rule({
    id: "spring-tomcat",
    category: "Spring Boot",
    keywords: ["Tomcat", "o.s.boot.web.embedded.tomcat", "Tomcat started on port"],
    regexPatterns: [/Tomcat (started|initialized)/i],
    severity: "low",
    title: "Embedded Tomcat lifecycle",
    description: "Embedded Tomcat startup/lifecycle messages from Spring Boot.",
    possibleCauses: ["Informational — usually a normal startup message unless paired with an error."],
    suggestedCommands: [],
    recommendedSteps: ["Check for an accompanying error or port conflict below this line."],
  }),

  // ---- Port conflict (shared Spring/Node/Network) ---------------------------
  rule({
    id: "port-in-use-8080",
    category: "Network / Port",
    keywords: ["Port 8080 was already in use", "already in use", "Web server failed to start"],
    regexPatterns: [/Port\s+\d+\s+was already in use/i, /address already in use/i],
    severity: "high",
    title: "Port already in use",
    description:
      "The application could not bind its port because another process is already listening on it.",
    possibleCauses: [
      "Another process already occupies the port (e.g. 8080).",
      "A previous server instance did not shut down cleanly.",
      "A Docker container or local process is holding the port.",
    ],
    suggestedCommands: [
      { command: "lsof -i :8080", description: "Find the process on 8080" },
      { command: "kill -9 <PID>", description: "Free the port" },
    ],
    recommendedSteps: [
      "Find which process owns the port (lsof / ss).",
      "Stop or kill the stale process, or change your app's port.",
      "Check for a leftover Docker container holding the port.",
      "Restart the app.",
    ],
  }),
  rule({
    id: "node-eaddrinuse",
    category: "Node.js / Express",
    keywords: ["EADDRINUSE", "listen EADDRINUSE"],
    regexPatterns: [/EADDRINUSE/],
    severity: "high",
    title: "Node port already in use (EADDRINUSE)",
    description: "Node could not bind the port because it is already in use.",
    possibleCauses: [
      "Another Node process is already listening on the same port.",
      "A previous `npm run dev` did not exit.",
      "A container maps the same host port.",
    ],
    suggestedCommands: [
      { command: "lsof -i :3000", description: "Find the process on 3000" },
      { command: "kill -9 <PID>", description: "Free the port" },
    ],
    recommendedSteps: [
      "Identify the process holding the port.",
      "Kill it or change PORT.",
      "Re-run npm run dev.",
    ],
  }),

  // ---- Node.js --------------------------------------------------------------
  rule({
    id: "node-module-not-found",
    category: "Node.js / Express",
    keywords: ["Cannot find module", "MODULE_NOT_FOUND"],
    regexPatterns: [/Cannot find module ['"]?[^'"\n]+['"]?/i, /Error: Cannot find module/i],
    severity: "medium",
    title: "Module not found",
    description: "Node could not resolve a required module.",
    possibleCauses: [
      "Dependencies are not installed (node_modules missing).",
      "An import path is wrong or the file was renamed/deleted.",
      "package.json lists the dependency but it was never installed.",
    ],
    suggestedCommands: [
      { command: "npm install", description: "Install dependencies" },
      { command: "npm ci", description: "Clean reproducible install" },
      { command: "rm -rf node_modules package-lock.json && npm install", description: "Reset deps" },
    ],
    recommendedSteps: [
      "Confirm node_modules exists; run npm install / npm ci.",
      "Verify the import path matches the actual file.",
      "Re-run the app.",
    ],
  }),
  rule({
    id: "node-type-reference-error",
    category: "Node.js / Express",
    keywords: ["TypeError", "ReferenceError", "is not a function", "is not defined", "npm ERR"],
    regexPatterns: [/TypeError:/, /ReferenceError:/, /npm ERR!/],
    severity: "medium",
    title: "JavaScript runtime / npm error",
    description: "A runtime TypeError/ReferenceError or an npm error was thrown.",
    possibleCauses: [
      "A variable or function is undefined / out of scope.",
      "An object property was accessed on null or undefined.",
      "An npm script failed (build or install).",
    ],
    suggestedCommands: [
      { command: "npm run dev", description: "Reproduce with the dev server" },
      { command: "npm run build", description: "Reproduce a build-time error" },
    ],
    recommendedSteps: [
      "Read the stack trace top frame for the file and line.",
      "Check the referenced variable/function exists and is in scope.",
      "Re-run and confirm.",
    ],
  }),
  rule({
    id: "econnrefused-generic",
    category: "Network / Port",
    keywords: ["ECONNREFUSED", "Connection refused"],
    regexPatterns: [/ECONNREFUSED(\s+[\d.]+:\d+)?/, /Connection refused/i],
    severity: "high",
    title: "Connection refused",
    description:
      "A TCP connection was actively refused — the target host:port has nothing listening.",
    possibleCauses: [
      "The target service (DB, Redis, backend) is not running.",
      "The host or port is wrong.",
      "A firewall or container network is blocking the connection.",
    ],
    suggestedCommands: [
      { command: "curl -v http://127.0.0.1:<port>", description: "Probe the target" },
      { command: "ss -tulpn", description: "See what is actually listening" },
    ],
    recommendedSteps: [
      "Confirm the target service is running.",
      "Verify host/port match the service's bind address.",
      "Check container networking / firewall rules.",
    ],
  }),

  // ---- Docker ---------------------------------------------------------------
  rule({
    id: "docker-daemon",
    category: "Docker",
    keywords: ["Cannot connect to the Docker daemon", "Is the docker daemon running"],
    regexPatterns: [/Cannot connect to the Docker daemon/i],
    severity: "critical",
    title: "Docker daemon unavailable",
    description: "The Docker CLI could not reach the Docker daemon.",
    possibleCauses: [
      "The Docker daemon / Docker Desktop is not running.",
      "The current user lacks permission to access the Docker socket.",
    ],
    suggestedCommands: [
      { command: "sudo systemctl start docker", description: "Start the daemon (Linux)" },
      { command: "docker info", description: "Confirm the daemon responds" },
    ],
    recommendedSteps: [
      "Start Docker (systemctl start docker / open Docker Desktop).",
      "Add your user to the docker group if it is a permission issue.",
      "Retry the command.",
    ],
  }),
  rule({
    id: "docker-container-exited",
    category: "Docker",
    keywords: ["container exited", "Exited (", "unhealthy", "no such service"],
    regexPatterns: [/Exited \(\d+\)/i, /container .* exited/i, /unhealthy/i],
    severity: "high",
    title: "Container exited / unhealthy",
    description: "A container stopped unexpectedly or failed its health check.",
    possibleCauses: [
      "The container's main process crashed on startup.",
      "A required env var or mounted file is missing.",
      "The healthcheck endpoint never became ready.",
    ],
    suggestedCommands: [
      { command: "docker ps -a", description: "See exit codes" },
      { command: "docker logs <container>", description: "Read why it exited" },
      { command: "docker inspect <container>", description: "Check config & health" },
    ],
    recommendedSteps: [
      "Read the container logs for the crash reason.",
      "Verify env vars and mounted files.",
      "Fix and `docker compose up -d --build`.",
    ],
  }),
  rule({
    id: "docker-bind-permission",
    category: "Docker",
    keywords: ["bind: address already in use", "permission denied", "docker: Error"],
    regexPatterns: [/bind: address already in use/i, /docker: Error/i],
    severity: "high",
    title: "Docker bind / permission error",
    description: "Docker failed to bind a port or was denied permission.",
    possibleCauses: [
      "The host port is already in use by another process/container.",
      "Permission denied on a socket, volume, or device.",
    ],
    suggestedCommands: [
      { command: "docker ps", description: "Find a container using the port" },
      { command: "lsof -i :<port>", description: "Find any process using the port" },
    ],
    recommendedSteps: [
      "Free the conflicting port or remap it in the compose file.",
      "Fix volume/socket permissions.",
      "Recreate the container.",
    ],
  }),

  // ---- Nginx ----------------------------------------------------------------
  rule({
    id: "nginx-upstream-refused",
    category: "Nginx",
    keywords: ["connect() failed", "upstream", "while connecting to upstream", "502 Bad Gateway"],
    regexPatterns: [/connect\(\) failed \(\d+: [^)]+\) while connecting to upstream/i, /502 Bad Gateway/i],
    severity: "high",
    title: "Nginx upstream connection failed (502)",
    description:
      "Nginx tried to proxy to a backend (upstream) but the connection failed — typically a 502 Bad Gateway.",
    possibleCauses: [
      "Nginx proxied to the backend, but the backend is not running.",
      "The upstream port is wrong.",
      "The Spring/Node server is not listening on 8080 or 3000.",
      "The container's internal port differs from the published port mapping.",
    ],
    suggestedCommands: [
      { command: "curl http://127.0.0.1:8080", description: "Is the backend up?" },
      { command: "sudo tail -f /var/log/nginx/error.log", description: "Watch upstream errors" },
      { command: "sudo nginx -t", description: "Validate proxy config" },
    ],
    recommendedSteps: [
      "Confirm the backend is actually running and listening.",
      "Check the upstream host:port in the Nginx config.",
      "Verify Docker internal vs published port mapping.",
      "Reload Nginx and re-test with curl.",
    ],
  }),
  rule({
    id: "nginx-emerg",
    category: "Nginx",
    keywords: ["nginx: [emerg]", "SSL certificate problem", "403 Forbidden", "404 Not Found"],
    regexPatterns: [/nginx: \[emerg\]/i, /SSL certificate problem/i],
    severity: "high",
    title: "Nginx config / TLS / access error",
    description:
      "Nginx emitted an emergency config error, a TLS certificate problem, or an access error (403/404).",
    possibleCauses: [
      "A syntax error or duplicate directive in the Nginx config.",
      "A missing or expired SSL certificate / key path.",
      "Wrong root/permissions causing 403/404.",
    ],
    suggestedCommands: [
      { command: "sudo nginx -t", description: "Pinpoint the config error" },
      { command: "sudo systemctl reload nginx", description: "Apply a fixed config" },
    ],
    recommendedSteps: [
      "Run nginx -t and fix the reported file:line.",
      "Verify cert/key paths and permissions.",
      "Reload Nginx.",
    ],
  }),

  // ---- MySQL ----------------------------------------------------------------
  rule({
    id: "mysql-access-denied",
    category: "MySQL",
    keywords: ["Access denied for user", "Using password"],
    regexPatterns: [/Access denied for user '[^']*'@'[^']*'/i],
    severity: "high",
    title: "MySQL access denied",
    description: "MySQL rejected the credentials for the given user/host.",
    possibleCauses: [
      "Wrong username or password.",
      "The user is not allowed from this host.",
      "The password env var is empty or mismatched.",
    ],
    suggestedCommands: [
      { command: "mysql -u root -p", description: "Verify credentials manually" },
      { command: "docker logs mysql", description: "Check container init logs" },
    ],
    recommendedSteps: [
      "Confirm username/password match the DB grants.",
      "Check the user's allowed host (% vs localhost).",
      "Verify the app's DB env vars.",
    ],
  }),
  rule({
    id: "mysql-link-failure",
    category: "MySQL",
    keywords: [
      "Communications link failure",
      "Unknown database",
      "Table",
      "doesn't exist",
      "Connection refused",
    ],
    regexPatterns: [/Communications link failure/i, /Unknown database/i, /Table '[^']+' doesn't exist/i],
    severity: "high",
    title: "MySQL connection / schema error",
    description:
      "The app reached MySQL but the connection dropped, or the database/table does not exist.",
    possibleCauses: [
      "MySQL is not running or not reachable on the configured host/port.",
      "The target database has not been created.",
      "Migrations have not run, so a table is missing.",
    ],
    suggestedCommands: [
      { command: "sudo systemctl status mysql", description: "Is MySQL up?" },
      { command: "telnet 127.0.0.1 3306", description: "Is the port reachable?" },
    ],
    recommendedSteps: [
      "Confirm MySQL is running and reachable.",
      "Create the database / run migrations.",
      "Re-test the connection.",
    ],
  }),

  // ---- Redis ----------------------------------------------------------------
  rule({
    id: "redis-connection",
    category: "Redis",
    keywords: [
      "Redis connection failed",
      "NOAUTH Authentication required",
      "ECONNREFUSED 127.0.0.1:6379",
      "WRONGPASS",
    ],
    regexPatterns: [/NOAUTH Authentication required/i, /ECONNREFUSED\s+127\.0\.0\.1:6379/i, /Redis connection/i],
    severity: "high",
    title: "Redis connection / auth failure",
    description: "The client could not connect to Redis or failed authentication.",
    possibleCauses: [
      "Redis is not running or not reachable on 6379.",
      "Redis requires a password (NOAUTH) and the client sent none.",
      "The configured Redis password is wrong (WRONGPASS).",
    ],
    suggestedCommands: [
      { command: "redis-cli ping", description: "Is Redis answering?" },
      { command: "redis-cli -a <password> ping", description: "Auth and ping" },
    ],
    recommendedSteps: [
      "Confirm Redis is running on the expected host:port.",
      "Provide the correct password (requirepass / AUTH).",
      "Re-test with redis-cli.",
    ],
  }),

  // ---- Git / GitHub Actions -------------------------------------------------
  rule({
    id: "gha-build-failed",
    category: "Git / GitHub Actions",
    keywords: ["workflow failed", "npm ci", "build failed", "exit code 1", "Process completed with exit code"],
    regexPatterns: [/Process completed with exit code [1-9]\d*/i, /build failed/i],
    severity: "medium",
    title: "GitHub Actions / CI build failed",
    description: "A CI job failed with a non-zero exit code.",
    possibleCauses: [
      "A build or test step failed (exit code 1).",
      "`npm ci` failed because the lockfile is out of sync.",
      "A permission issue on a protected resource/token.",
    ],
    suggestedCommands: [
      { command: "npm ci", description: "Reproduce the CI install locally" },
      { command: "npm run build", description: "Reproduce the CI build" },
    ],
    recommendedSteps: [
      "Open the failed step's log and find the first error.",
      "Reproduce locally with npm ci && npm run build.",
      "Fix, commit, and re-run the workflow.",
    ],
  }),

  // ---- Linux ----------------------------------------------------------------
  rule({
    id: "linux-no-space",
    category: "Linux / Ubuntu",
    keywords: ["No space left on device", "ENOSPC"],
    regexPatterns: [/No space left on device/i, /ENOSPC/],
    severity: "critical",
    title: "Disk full (No space left on device)",
    description: "The filesystem is full; writes are failing.",
    possibleCauses: [
      "A partition is at 100% usage.",
      "Logs, Docker images, or build artifacts filled the disk.",
    ],
    suggestedCommands: [
      { command: "df -h", description: "Find the full partition" },
      { command: "docker system prune -af", description: "Reclaim Docker space (careful)" },
    ],
    recommendedSteps: [
      "Run df -h to find the full mount.",
      "Delete large logs / unused Docker images.",
      "Retry the operation.",
    ],
  }),
  rule({
    id: "linux-generic",
    category: "Linux / Ubuntu",
    keywords: ["command not found", "apt failed", "systemctl failed", "Permission denied", "Failed to start"],
    regexPatterns: [/command not found/i, /Failed to start .* service/i],
    severity: "medium",
    title: "Linux service / shell error",
    description: "A shell command failed, a package operation failed, or a systemd service failed to start.",
    possibleCauses: [
      "The command/binary is not installed or not on PATH.",
      "A package install (apt) failed.",
      "A systemd unit failed to start.",
      "Permission denied on a file or operation.",
    ],
    suggestedCommands: [
      { command: "systemctl status <service>", description: "Check the failing service" },
      { command: "journalctl -u <service> -xe", description: "Read detailed service logs" },
      { command: "sudo apt update", description: "Refresh package lists" },
    ],
    recommendedSteps: [
      "Identify the failing command/service.",
      "Check it is installed and you have permission.",
      "Read journalctl for the root cause.",
    ],
  }),
];

/**
 * Severity keyword heuristics, applied to individual error lines when no rule
 * provides a stronger signal. Higher in the list = checked first.
 */
export const SEVERITY_KEYWORDS: { severity: Severity; keywords: string[] }[] = [
  {
    severity: "critical",
    keywords: [
      "application startup failed",
      "application run failed",
      "database unavailable",
      "docker daemon",
      "no space left on device",
      "fatal",
      "context initialization",
    ],
  },
  {
    severity: "high",
    keywords: [
      "connection refused",
      "already in use",
      "502 bad gateway",
      "communications link failure",
      "access denied",
      "noauth",
      "exited (",
      "cannot connect",
    ],
  },
  {
    severity: "medium",
    keywords: ["typeerror", "referenceerror", "npm err", "build failed", "exit code 1", "cannot find module"],
  },
  {
    severity: "low",
    keywords: ["warn", "warning", "not found", "validation", "deprecated"],
  },
];
