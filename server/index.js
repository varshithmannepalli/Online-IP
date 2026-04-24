const path = require('path');
const express = require('express');
const cors = require('cors');
const esbuild = require('esbuild');
const {
  connectToDatabase,
  ensureSeedData,
  listInternships,
  signupUser,
  createApplication,
  getProfile
} = require('./mongoStore');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const rootDir = path.join(__dirname, '..');
const bundlePath = path.join(rootDir, 'bundle.js');
const indexPath = path.join(rootDir, 'index.html');
const stylesPath = path.join(rootDir, 'client', 'src', 'styles.css');

function buildClient() {
  esbuild.buildSync({
    entryPoints: [path.join(rootDir, 'client', 'src', 'main.jsx')],
    bundle: true,
    outfile: bundlePath,
    format: 'iife',
    loader: {
      '.js': 'jsx',
      '.jsx': 'jsx'
    },
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  });
}

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/internships', async (req, res) => {
  try {
    const internships = await listInternships();
    res.json({ internships });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.post('/signup', async (req, res) => {
  try {
    const user = await signupUser(req.body || {});
    res.status(201).json({ user });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.post('/apply', async (req, res) => {
  try {
    const application = await createApplication(req.body || {});
    res.status(201).json({ application });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.get('/profile/:userId', async (req, res) => {
  try {
    const profile = await getProfile(req.params.userId, req.query);
    res.json(profile);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.get('/bundle.js', (req, res) => res.sendFile(bundlePath));
app.get('/client/src/styles.css', (req, res) => res.sendFile(stylesPath));
app.get('/', (req, res) => res.sendFile(indexPath));

async function startServer() {
  try {
    await connectToDatabase(process.env.MONGODB_URI);
    await ensureSeedData();
    buildClient();

    app.listen(port, () => {
      console.log(`Online Internship Platform is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
