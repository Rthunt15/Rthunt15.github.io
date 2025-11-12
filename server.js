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

app.get('/', (req, res) => res.send('Secret Santa submission server is running.'));

app.listen(PORT, () => console.log('Server listening on port', PORT));
