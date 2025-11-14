// Simple Express server to accept Secret Santa submissions and save anonymized text files.
// Usage: node server.js

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({limit: '200kb'}));

// Serve static files from repository root so the form can be tested from the same origin
app.use(express.static(path.join(__dirname)));

const outDir = path.join(__dirname, 'submissions');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, {recursive: true});

function randString(len = 8) {
  return crypto.randomBytes(Math.ceil(len/2)).toString('hex').slice(0,len);
}

app.post('/api/secretsanta', (req, res) => {
  try {
    const payload = req.body || {};
    // Build file content similar to client-side version
    const lines = [];
    lines.push('Secret Santa Request Form');
    lines.push('========================');
    lines.push('');
    lines.push('Name: ' + (payload.Name || ''));
    if (payload.ClothingSize) lines.push('Clothing size: ' + payload.ClothingSize);
    lines.push('');
    lines.push('Preferences:');
    const prefs = payload.Preferences || {};
    for (const k of Object.keys(prefs)) lines.push(' - ' + k + ': ' + prefs[k]);
    lines.push('');
    lines.push('Favorites / Helpful info:');
    const fav = payload.Favorites || {};
    for (const k of Object.keys(fav)) if (fav[k]) lines.push(' - ' + k + ': ' + fav[k]);
    lines.push('');
    lines.push('Allergies: ' + (payload.Allergies || 'None listed'));
    lines.push('Specific dislikes: ' + (payload.SpecificDislikes || 'None listed'));
    lines.push('');
    lines.push('Submitted: ' + (payload.SubmittedAt || new Date().toISOString()));

    const content = lines.join('\n');
    const filename = 'secretsanta_' + randString(12) + '.txt';
    const filePath = path.join(outDir, filename);

    fs.writeFile(filePath, content, {encoding: 'utf8'}, (err) => {
      if (err) {
        console.error('Failed to write submission', err);
        return res.status(500).json({ok:false, error: 'write_failed'});
      }
      console.log('Saved submission:', filename);
      // intentionally do not return the filename to the client to preserve anonymity
      res.json({ok:true});
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ok:false, error:'server_error'});
  }
});

// Create randomized assignments: POST { recipients: ["Name1","Name2",...] }
// Returns { ok: true, assignments: { "Name1": "/submissions/assigned/<file>" ... }}
app.post('/api/assign', (req, res) => {
  try {
    const recipients = Array.isArray(req.body.recipients) ? req.body.recipients.map(s=>String(s).trim()).filter(Boolean) : [];
    if (!recipients.length) return res.status(400).json({ok:false, error:'no_recipients'});

    // Read submissions
    const files = fs.readdirSync(outDir).filter(f => f.endsWith('.txt'));
    if (files.length < recipients.length) return res.status(400).json({ok:false, error:'not_enough_submissions', submissions: files.length});

    // Read each file and extract submitter name (look for line starting with 'Name:')
    const subs = files.map(fname => {
      const full = path.join(outDir, fname);
      const txt = fs.readFileSync(full, 'utf8');
      const m = txt.match(/^Name:\s*(.*)$/m);
      const submitter = m ? m[1].trim() : null;
      return { fname, full, submitter };
    });

    // We'll try to find a derangement: assign subs to recipients so submitter != recipient
    // Approach: shuffle subs and try up to maxAttempts
    function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } }

    const maxAttempts = 5000;
    let attempt = 0;
    let chosen = null;
    const pool = subs.slice();

    while(attempt < maxAttempts){
      attempt++;
      shuffle(pool);
      const pick = pool.slice(0, recipients.length);
      let ok = true;
      for (let i=0;i<recipients.length;i++){
        const r = recipients[i];
        const s = pick[i];
        if (s.submitter && r && s.submitter.toLowerCase() === r.toLowerCase()){ ok=false; break; }
      }
      if (ok){ chosen = pick; break; }
    }

    if (!chosen) return res.status(500).json({ok:false, error:'no_valid_assignment'});

    // Create assigned directory
    const assignedDir = path.join(outDir, 'assigned');
    if (!fs.existsSync(assignedDir)) fs.mkdirSync(assignedDir, {recursive:true});

    const assignments = {};
    for (let i=0;i<recipients.length;i++){
      const recipient = recipients[i];
      const sub = chosen[i];
      // copy file to assigned with new random filename
      const newName = 'assigned_' + randString(12) + '.txt';
      const newPath = path.join(assignedDir, newName);
      fs.copyFileSync(sub.full, newPath);
      // Provide a relative URL to the assigned file (server serves static files)
      assignments[recipient] = '/submissions/assigned/' + newName;
    }

    return res.json({ok:true, assignments});
  } catch (err) {
    console.error('assign error', err);
    return res.status(500).json({ok:false, error:'server_error'});
  }
});

app.get('/', (req, res) => res.send('Secret Santa submission server is running.'));

app.listen(PORT, () => console.log('Server listening on port', PORT));
