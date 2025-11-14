Secret Santa server

This small Express server accepts POST requests at /api/secretsanta and saves anonymized text files to the `submissions/` directory.

Quick start (Windows PowerShell):

1. Install dependencies:

```powershell
npm install
```

2. Start the server:

```powershell
npm start
```

3. By default the server listens on port 3000. Open your site in the browser pointing to the server host (for testing run the static site separately or serve with the same host/port and use the form).

Formspree (GitHub Pages)
--------------------------------
If you want to use Formspree to collect submissions while hosting the static site on GitHub Pages (no server required):

1. Create a free Formspree account and add a form. Copy the form endpoint URL (looks like `https://formspree.io/f/abcd1234`).

2. Edit `secretsanta/index.html` and set the `FORM_ENDPOINT` constant near the top of the script to your endpoint URL. Example:

```js
const FORM_ENDPOINT = 'https://formspree.io/f/abcd1234';
```

3. Commit and push your changes to GitHub Pages. The form will POST directly to Formspree and Formspree will store or email submissions based on your Formspree settings.

Notes:
- Formspree may require verifying your email and has free tier limits.
- The client-side code will add an Accept: application/json header and expect a JSON response. If you prefer HTML form POST behavior, tell me and I can change the client to use a standard form submit.

Server notes:
- This repo originally contained a static site (GitHub Pages). To use server-side saving you need to host both the static files and this server. GitHub Pages cannot run Node.
- The server writes files under `submissions/` with randomized filenames. The API intentionally does not return the filename to the client.

Security:
- If you store PII, always use HTTPS and secure storage.
- Avoid putting secrets in client-side code; use server-side environment variables if needed.
