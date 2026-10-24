// pages/explain-command.js — offline flag dictionary + tokenizer.
// Pure parsing, educational only: syntax explanations, never execution.

const COMMANDS = {
  nmap: {
    blurb: 'Network/port scanner (practitioner tool).',
    flags: {
      '-sS': 'TCP SYN scan (half-open): never completes connections, harder to log.',
      '-sV': 'Service/version detection: probes open ports to fingerprint software.',
      '-sC': 'Run the default script set (safe ones) against targets.',
      '-p-': 'All 65 535 ports (equivalent to -p 1-65535).',
      '-p': 'Port specification: single (-p 80), list (-p 80,443), range (-p 1-1000).',
      '-A': 'Aggressive scan: OS detection, version detection, script scanning + traceroute.',
      '-O': 'OS detection via TCP/IP fingerprinting.',
      '-Pn': 'Treat all hosts as online — skip the ping check (useful when ICMP is blocked).',
      '-T4': 'Timing template 0-5; 4 is "aggressive", faster but noisier.',
    },
  },
  nc: {
    blurb: 'netcat — the TCP/IP swiss army knife.',
    flags: {
      '-lvp': 'Listen, verbose, specific port (then the port number).',
      '-l': 'Listen mode: wait for incoming connections instead of dialing out.',
      '-v': 'Verbose.',
      '-p': 'Bind to a specific source port.',
      '-e': 'Execute a program on connect (classic reverse shell — handle with care).',
    },
  },
  curl: {
    blurb: 'HTTP(S) client / URL transfer tool.',
    flags: {
      '-X': 'HTTP method to use (GET, POST, DELETE…).',
      '-H': 'Add a header, e.g. -H "Authorization: Bearer token".',
      '-d': 'Request body: -d @file or -d "k=v" (implies POST).',
      '-o': 'Write output to the following file name.',
      '-I': 'HEAD request: response headers only.',
      '-k': 'Skip TLS certificate verification (dev only — fakes MITM-able).',
      '-L': 'Follow redirects (3xx).',
    },
  },
  chmod: {
    blurb: 'Change file permissions.',
    special(token) {
      if (/^[0-7]{3,4}$/.test(token)) {
        let out = 'Octal permission bits — ';
        for (const c of token) {
          const n = Number(c);
          out += `${n & 4 ? 'r' : '-'}${n & 2 ? 'w' : '-'}${n & 1 ? 'x' : '-'} `;
        }
        return `${out}(owner group other · 4=read, 2=write, 1=execute)`;
      }
      if (/^[ugoa]*[+\-=][rwxXs]+([,+][ugoa]*[+\-=][rwxXs]+)*$/.test(token)) {
        return `Symbolic mode: user/group/other (+/-) read/write/execute — "${token}".`;
      }
      return null;
    },
  },
  ssh: {
    blurb: 'Secure shell remote login.',
    flags: {
      '-i': 'Identity file (private key) for authentication.',
      '-p': 'Remote port (lowercase p here — scp uses uppercase -P!).',
      '-L': 'Local port forward: localPort:host:hostPort.',
      '-R': 'Remote port forward: expose a local service on the remote host.',
    },
  },
  grep: {
    blurb: 'Search text with patterns.',
    flags: {
      '-r': 'Recurse through directories.',
      '-i': 'Case-insensitive match.',
      '-n': 'Show line numbers.',
      '-E': 'Extended regex (grep -E = egrep).',
      '-v': 'Invert: show non-matching lines.',
    },
  },
  sudo: { blurb: 'Run as root. Verify every argument before pressing enter.', flags: {} },
  tar: {
    blurb: 'Tar archives / backups.',
    flags: {
      '-x': 'Extract an archive.',
      '-c': 'Create an archive.',
      '-z': 'gzip filter (e.g. -zxf file.tar.gz).',
      '-v': 'Verbose: list each file.',
      '-f': 'Archive FILE name (must be followed by the file path).',
    },
  },
  git: {
    blurb: 'Version control.',
    flags: {
      '--hard': '"reset --hard": discard all working-tree changes — destructive.',
      '--force': 'Overwrite protections — can destroy history or rewrite remote refs.',
      '--depth': 'Shallow clone truncation.',
    },
  },
  kill: {
    blurb: 'Signal a process.',
    flags: {
      '-9': 'SIGKILL — immediate, uncatchable termination; try plain TERM first.',
      '-15': 'SIGTERM — polite ask to exit (the default signal).',
      '-l': 'List all signal names.',
    },
  },
};

const GENERIC = {
  '-v': 'Verbose output.', '--verbose': 'Verbose output.', '-vv': 'Even more verbose.',
  '-h': 'Help or human-readable sizes (command dependent).', '--help': 'Show help.',
  '-f': 'Force the action (use with care).', '-y': 'Assume yes — skips confirmation prompts.',
  '-r': 'Recursive.', '--no-pager': 'Skip pager output.', '--version': 'Print version and exit.',
};

const stripPath = (t) => t.split('/').pop();

function explain(cmdText) {
  const tokens = cmdText.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  const bin = stripPath(tokens[0]);
  const tool = COMMANDS[bin];
  const rows = [{ token: bin, note: tool ? tool.blurb : `Command "${bin}" — see "man ${bin}" for its manual.` }];

  for (const tok of tokens.slice(1)) {
    let note = null;
    if (tok.startsWith('-')) {
      if (tool?.flags) {
        const keys = Object.keys(tool.flags).sort((a, b) => b.length - a.length);
        const match = keys.find((k) => tok === k || tok.startsWith(k));
        note = match ? tool.flags[match] : null;
      }
      note = note ?? GENERIC[tok] ?? GENERIC[tok.split('=')[0]] ??
        `Flag "${tok}" is not recognized — check "man ${bin}" or explainshell.com.`;
    } else if (tool?.special) {
      const made = tool.special(tok);
      note = made ?? 'Plain argument (target, path or value).';
    } else {
      note = 'Plain argument (target, path or value).';
    }
    rows.push({ token: tok, note });
  }
  return rows;
}

const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const input = document.querySelector('[data-cmd]');
const box = document.querySelector('[data-explanation]');

function render() {
  const rows = explain(input.value);
  if (!rows.length) {
    box.innerHTML = '<p class="muted small">Type a command above, e.g. <code>nmap -sS -T4 -p 22 10.0.0.5</code>.</p>';
    return;
  }
  box.innerHTML = `
    <table>
      <thead><tr><th>Token</th><th>What it does</th></tr></thead>
      <tbody>${rows.map((r) => `<tr><td class="mono">${escapeHtml(r.token)}</td><td>${escapeHtml(r.note)}</td></tr>`).join('')}</tbody>
    </table>`;
}

input?.addEventListener('input', render);
render();
