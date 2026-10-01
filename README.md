# Web Login over HTTPS with Input Validation and XSS Sanitization

A small Node.js/Express web app that shows three basic web-security controls: serving a login page over TLS (HTTPS), validating user input on both the client and the server, and sanitizing user comments to prevent cross-site scripting (XSS).

| | |
|---|---|
| Stack | Node.js, Express |
| Libraries | `express`, `validator`, `xss`, built-in `https` and `fs` |
| Certificate | Self-signed, generated with OpenSSL |
| Port | 3000 |
| Year | 2024 |

## How it fits together

```
┌───────────┐   HTTPS (TLS, self-signed cert)   ┌────────────────────┐
│  Browser  │ ────────────────────────────────► │  Express server    │
│           │ ◄──────────────────────────────── │  (Node.js, :3000)  │
│ - client- │                                   │ - server-side      │
│   side    │                                   │   validation       │
│   checks  │                                   │ - XSS sanitization │
└───────────┘                                   └────────────────────┘
```

| File | Purpose |
|---|---|
| `server_https.js` | Serves the login page over HTTPS using `server.key` and `server.crt` |
| `server.js` | Login validation (`validator`) and comment sanitization (`xss`), served over plain HTTP |
| `index_validation.html` | Login form with client-side validation and sanitization [and a comment box] |

## 1. TLS (HTTPS)

`server_https.js` loads a private key and certificate and creates the server with Node's `https` module, so traffic between the browser and server is encrypted and protected from tampering.

A self-signed certificate like the one used in this project (2048-bit RSA key, SHA-256 signature, valid for 365 days) can be generated with the command below (OpenSSL 1.1.1 or newer). The `subjectAltName` entry is needed because modern browsers ignore the common name alone.

```bash
openssl req -x509 -newkey rsa:2048 -sha256 -nodes \
  -keyout server.key -out server.crt -days 365 \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
```

Certificates expire, so regenerate the pair if the browser reports it as expired.

The certificate is **self-signed**, so browsers show a warning: no trusted authority vouches for the server's identity. The connection is still encrypted, but a self-signed certificate can't prove you reached the right server.

## 2. Input validation

**Client-side** (`index_validation.html`): [describe your rules, e.g. username at least 5 characters, password at least 8 characters with a digit, spaces rejected, harmful characters stripped]. This gives fast feedback, but it can be bypassed by sending requests directly, so it is not a security control on its own.

**Server-side** (`server.js`, using `validator`), which is the check that counts:

- **Username:** alphanumeric only, at least 5 characters
- **Password:** at least 8 characters and at least one digit
- Invalid input is rejected before credentials are checked

## 3. XSS sanitization

Comments submitted to `/submit-comment` are passed through the `xss` library, which strips dangerous markup such as `<script>` tags, before the server returns them.

**Demo:** [describe what happens when you enter `<script>alert('XSS attack!');</script>` as a comment, before and after sanitization. Delete this section if you didn't do it.]

## Threat model

**Assets:** login credentials and user-submitted content.
**Assumed attacker:** someone on the network who can observe traffic, and someone who submits malicious input through the forms.

| Defended against | How |
|---|---|
| Eavesdropping on the connection | TLS in `server_https.js` |
| Malformed or unexpected login input | Client- and server-side validation |
| Script injection through comments | `xss` sanitization on the server |

### Known limitations (not defended against)

- **TLS and validation are in separate files.** `server.js` validates input but serves plain HTTP; `server_https.js` uses TLS but has no validation. They are two demos, not one hardened server.
- **`server_https.js` is a minimal demo.** It echoes the submitted username *and password* back in the response without escaping, which leaks credentials and is a reflected-XSS vector.
- **Hardcoded plaintext credentials** in `server.js` (a demo `admin` account), compared with `===`. There is no password hashing, constant-time comparison, session handling, or rate limiting.
- **Self-signed certificate:** no identity assurance, no revocation or rotation. There is no HTTP-to-HTTPS redirect or HSTS header.
- **Sanitizing input rather than encoding output:** the `xss` filter helps, but context-aware output encoding plus a Content-Security-Policy header is the stronger approach.
- **Unexpected input types:** with `express.urlencoded({ extended: true })`, a request like `username[]=x` passes a non-string to `validator`, which throws and returns a server error. Types should be checked first.

### What I'd improve next

- Merge TLS and validation into a single server, so the login is validated *and* encrypted
- Store hashed passwords (bcrypt or Argon2) and compare them properly instead of a hardcoded plaintext login
- Add security headers with `helmet` (CSP, HSTS) and escape output instead of relying only on input filtering
- Add rate limiting on the login route, and use `extended: false` plus type checks
- Redirect HTTP to HTTPS and use a trusted certificate (for example Let's Encrypt) for anything public

## Running it

```bash
npm install express validator xss
```

1. Generate `server.key` and `server.crt` with the OpenSSL command above (keep them in the project folder).
2. Run `node server_https.js` and open `https://localhost:3000` (accept the browser warning), or run `node server.js` and open `http://localhost:3000`.

> **Never commit `server.key`** or real credentials. Keys are listed in `.gitignore`.

## What I learned

- **Client-side validation is a convenience, not a control.** Anything running in the browser can be bypassed, so the server has to enforce the same rules. That is why the server-side `validator` checks matter more than the JavaScript in the form.
- **TLS protects the connection, not the application.** With HTTPS the credentials were encrypted in transit, yet the starter server still echoed them back unescaped. Encrypting traffic and handling input safely are separate problems, and you need both.
- **A self-signed certificate encrypts but doesn't authenticate.** The browser warning exists because nothing proves the server's identity, and clicking through it is exactly the habit an attacker relies on.
- **XSS is about how data leaves the app.** Filtering comments with `xss` helps, but encoding output and adding a Content-Security-Policy are the sturdier defenses.
- **Writing the threat model changed how I read my own code.** Listing what the project doesn't defend against (hardcoded credentials, no hashing, split TLS and validation files) showed me the gaps more clearly than testing the happy path did.
