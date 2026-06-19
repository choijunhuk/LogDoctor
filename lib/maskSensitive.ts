// Redacts secrets (passwords, tokens, API keys, connection strings) BEFORE the
// log is ever rendered or persisted. This is the security boundary of the app:
// raw secrets must never reach React state or localStorage.

export interface MaskResult {
  masked: string;
  /** How many secrets were redacted. */
  count: number;
}

interface Replacer {
  re: RegExp;
  build: (groups: string[]) => string;
}

const REPLACERS: Replacer[] = [
  // key=value or key: value  (password, token, api_key, secret, access_key, client_secret)
  {
    re: /\b(password|passwd|pwd|token|api[_-]?key|secret|access[_-]?key|client[_-]?secret)(\s*[:=]\s*)("?)([^\s"'&,;}]+)/gi,
    build: (g) => `${g[0]}${g[1]}${g[2]}******`,
  },
  // Authorization: Bearer <token>
  {
    re: /(Authorization\s*:\s*Bearer\s+)([A-Za-z0-9._\-]+)/gi,
    build: (g) => `${g[0]}******`,
  },
  // bare "jwt <token>"
  {
    re: /\b(jwt\s+)([A-Za-z0-9._\-]{10,})/gi,
    build: (g) => `${g[0]}******`,
  },
  // connection strings:  scheme://user:password@host
  {
    re: /\b((?:mysql|postgres|postgresql|redis|mongodb|amqp|amqps):\/\/[^:/\s]+:)([^@\s]+)(@)/gi,
    build: (g) => `${g[0]}******${g[2]}`,
  },
];

export function maskSensitive(input: string): MaskResult {
  if (!input) return { masked: "", count: 0 };

  let out = input;
  let count = 0;

  for (const { re, build } of REPLACERS) {
    out = out.replace(re, (...args: string[]) => {
      // args = [fullMatch, g1, g2, ..., offset, fullString]
      const groups = args.slice(1, -2);
      count++;
      return build(groups);
    });
  }

  return { masked: out, count };
}
