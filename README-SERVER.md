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

Notes:
- This repo originally contained a static site (GitHub Pages). To use server-side saving you need to host both the static files and this server. GitHub Pages cannot run Node.
- The server writes files under `submissions/` with randomized filenames. The API intentionally does not return the filename to the client.
