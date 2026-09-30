import { createSign } from 'node:crypto';
import { createReadStream, readFileSync as readTextFileSync } from 'node:fs';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDirectory = path.join(root, 'server', 'data');
const communityFile = path.join(dataDirectory, 'community.json');
const refreshInterval = 60_000;
const folderVariables = {
  'talking-head': 'GOOGLE_DRIVE_FOLDER_TALKING_HEAD',
  reels: 'GOOGLE_DRIVE_FOLDER_REELS',
  branding: 'GOOGLE_DRIVE_FOLDER_BRANDING',
  'video-editing': 'GOOGLE_DRIVE_FOLDER_VIDEO_EDITING',
  'socail-media-post': 'GOOGLE_DRIVE_FOLDER_SOCIAL_MEDIA',
};
const rootFolderVariable = 'GOOGLE_DRIVE_ROOT_FOLDER';
const driveFolderMimeType = 'application/vnd.google-apps.folder';

function loadDotEnv() {
  const envPath = path.join(root, '.env');
  try {
    const lines = readFileSync(envPath);
    for (const line of lines.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match || match[1] in process.env) continue;
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[match[1]] = value.replaceAll('\\n', '\n');
    }
  } catch {
    // .env is optional; the preview portfolio still works without it.
  }
}

function readFileSync(filePath) {
  // Kept synchronous so environment settings exist before the HTTP server starts.
  return readTextFileSync(filePath, 'utf8');
}

loadDotEnv();
const port = Number(process.env.PORT || 3002);

function getServiceAccount() {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
  if (keyPath) {
    try {
      const resolved = path.resolve(root, keyPath);
      return JSON.parse(readFileSync(resolved));
    } catch {
      // Allow explicit email/key variables to be used when there is no JSON file.
    }
  }
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replaceAll('\\n', '\n');
  return email && privateKey ? { client_email: email, private_key: privateKey } : null;
}

function extractFolderId(value = '') {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/(?:\/folders\/|[?&]id=)([a-zA-Z0-9_-]+)/);
  return match?.[1] || trimmed;
}

function driveIsConfigured() {
  const hasRootFolder = Boolean(extractFolderId(process.env[rootFolderVariable]));
  const hasSectionFolder = Object.values(folderVariables).some((key) => extractFolderId(process.env[key]));
  return hasRootFolder || hasSectionFolder;
}

function hasDriveCredentials() {
  const account = getServiceAccount();
  return Boolean(account?.client_email && account?.private_key);
}

let tokenCache = null;

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

async function getDriveToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.value;

  const account = getServiceAccount();
  if (!account?.client_email || !account?.private_key) throw new Error('Google service-account credentials are missing.');

  const now = Math.floor(Date.now() / 1000);
  const assertionHeader = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const assertionBody = base64url(JSON.stringify({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${assertionHeader}.${assertionBody}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  const assertion = `${unsigned}.${signer.sign(account.private_key, 'base64url')}`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) throw new Error(`Google token request failed (${response.status}).`);
  const token = await response.json();
  tokenCache = { value: token.access_token, expiresAt: Date.now() + token.expires_in * 1000 };
  return tokenCache.value;
}

async function driveFetch(url, options = {}) {
  const token = await getDriveToken();
  const response = await fetch(url, {
    ...options,
    headers: { ...options.headers, authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Google Drive request failed (${response.status}).`);
  return response;
}

async function listFolder(section, folderId) {
  const files = [];
  let pageToken = '';
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      pageSize: '1000',
      orderBy: 'createdTime desc',
      fields: 'nextPageToken,files(id,name,mimeType,thumbnailLink,webViewLink,createdTime,modifiedTime,size,imageMediaMetadata,videoMediaMetadata)',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    });
    if (pageToken) params.set('pageToken', pageToken);
    const response = await driveFetch(`https://www.googleapis.com/drive/v3/files?${params}`);
    const payload = await response.json();
    files.push(...(payload.files || []));
    pageToken = payload.nextPageToken || '';
  } while (pageToken);

  return files
    .filter((file) => file.mimeType?.startsWith('video/') || file.mimeType?.startsWith('image/'))
    .map((file) => ({
      id: file.id,
      name: file.name,
      type: file.mimeType.startsWith('video/') ? 'video' : 'image',
      mimeType: file.mimeType,
      createdAt: file.createdTime,
      modifiedAt: file.modifiedTime,
      size: Number(file.size || 0),
      width: file.imageMediaMetadata?.width || null,
      height: file.imageMediaMetadata?.height || null,
      duration: file.videoMediaMetadata?.durationMillis ? Number(file.videoMediaMetadata.durationMillis) / 1000 : null,
      contentUrl: `/api/files/${encodeURIComponent(file.id)}/content`,
      thumbnailUrl: file.thumbnailLink ? `/api/files/${encodeURIComponent(file.id)}/thumbnail` : null,
      section,
    }));
}

function decodeDrivePageString(value) {
  let result = '';
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character !== '\\' || index + 1 >= value.length) {
      result += character;
      continue;
    }

    const escape = value[++index];
    if (escape === 'x' && /^[\da-f]{2}$/i.test(value.slice(index + 1, index + 3))) {
      result += String.fromCharCode(parseInt(value.slice(index + 1, index + 3), 16));
      index += 2;
    } else if (escape === 'u' && /^[\da-f]{4}$/i.test(value.slice(index + 1, index + 5))) {
      result += String.fromCharCode(parseInt(value.slice(index + 1, index + 5), 16));
      index += 4;
    } else {
      result += ({ n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', '0': '\0' })[escape] ?? escape;
    }
  }
  return result;
}

async function listPublicFolder(folderId) {
  const response = await fetch(`https://drive.google.com/drive/folders/${encodeURIComponent(folderId)}`, {
    headers: { accept: 'text/html' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Google Drive folder request failed (${response.status}).`);
  const page = await response.text();
  const match = page.match(/window\['_DRIVE_ivd'\]\s*=\s*'((?:\\.|[^'])*)'/);
  if (!match) throw new Error('Google Drive did not return a readable shared folder listing. Check that the folder is shared with anyone who has the link.');

  const payload = JSON.parse(decodeDrivePageString(match[1]));
  return (payload?.[0] || []).filter(Array.isArray).map((entry) => ({
    id: String(entry[0] || ''),
    parents: Array.isArray(entry[1]) ? entry[1] : [],
    name: String(entry[2] || ''),
    mimeType: String(entry[3] || ''),
    createdTime: entry[9] ? new Date(Number(entry[9])).toISOString() : null,
    modifiedTime: entry[10] ? new Date(Number(entry[10])).toISOString() : null,
    size: Number(entry[13] || 0),
  })).filter((file) => file.id && file.name);
}

function publicMediaRecord(section, file) {
  if (!file.mimeType.startsWith('video/') && !file.mimeType.startsWith('image/')) return null;
  return {
    id: file.id,
    name: file.name,
    type: file.mimeType.startsWith('video/') ? 'video' : 'image',
    mimeType: file.mimeType,
    createdAt: file.createdTime,
    modifiedAt: file.modifiedTime,
    size: file.size,
    width: null,
    height: null,
    duration: null,
    contentUrl: `/api/files/${encodeURIComponent(file.id)}/content`,
    thumbnailUrl: `/api/files/${encodeURIComponent(file.id)}/thumbnail`,
    section,
  };
}

function sectionFromFolderName(name) {
  const normalized = name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');
  if (normalized.includes('talkinghead')) return 'talking-head';
  if (normalized.includes('reel')) return 'reels';
  if (normalized.includes('branding') || normalized.includes('logo')) return 'branding';
  if (normalized.includes('videoedit')) return 'video-editing';
  if (normalized.includes('socialmedia')) return 'socail-media-post';
  return null;
}

async function listFolderForMode(section, folderId, usePublicDrive) {
  if (!folderId) return [];
  if (!usePublicDrive) return listFolder(section, folderId);
  const files = await listPublicFolder(folderId);
  return files
    .map((file) => publicMediaRecord(section, file))
    .filter(Boolean)
    .sort((a, b) => Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0));
}

async function listSectionsFromRoot(rootFolderId, usePublicDrive) {
  const rootEntries = usePublicDrive
    ? await listPublicFolder(rootFolderId)
    : await (async () => {
      const files = [];
      let pageToken = '';
      do {
        const params = new URLSearchParams({
          q: `'${rootFolderId}' in parents and trashed = false`,
          pageSize: '1000',
          orderBy: 'name',
          fields: 'nextPageToken,files(id,name,mimeType)',
          supportsAllDrives: 'true',
          includeItemsFromAllDrives: 'true',
        });
        if (pageToken) params.set('pageToken', pageToken);
        const response = await driveFetch(`https://www.googleapis.com/drive/v3/files?${params}`);
        const payload = await response.json();
        files.push(...(payload.files || []));
        pageToken = payload.nextPageToken || '';
      } while (pageToken);
      return files;
    })();

  const childFolders = rootEntries.filter((entry) => entry.mimeType === driveFolderMimeType);
  const discovered = await Promise.all(childFolders.map(async (folder) => {
    const section = sectionFromFolderName(folder.name);
    if (!section) return null;
    return [section, await listFolderForMode(section, folder.id, usePublicDrive)];
  }));
  return Object.fromEntries(discovered.filter(Boolean));
}

let mediaCache = { sections: {}, refreshedAt: 0, error: null };
let refreshPromise = null;

async function refreshDriveMedia(force = false) {
  if (!driveIsConfigured()) return { configured: false, sections: {}, refreshedAt: null, error: null };
  if (!force && mediaCache.refreshedAt && Date.now() - mediaCache.refreshedAt < refreshInterval) {
    return { configured: true, ...mediaCache };
  }
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const sections = {};
    try {
      const usePublicDrive = !hasDriveCredentials();
      const rootFolderId = extractFolderId(process.env[rootFolderVariable]);
      if (rootFolderId) {
        Object.assign(sections, await listSectionsFromRoot(rootFolderId, usePublicDrive));
      } else {
        for (const [slug, variable] of Object.entries(folderVariables)) {
          const id = extractFolderId(process.env[variable]);
          if (id) sections[slug] = await listFolderForMode(slug, id, usePublicDrive);
        }
      }
      mediaCache = { sections, refreshedAt: Date.now(), error: null };
      return { configured: true, ...mediaCache };
    } catch (error) {
      if (mediaCache.refreshedAt) {
        mediaCache.error = error.message;
        return { configured: true, ...mediaCache };
      }
      mediaCache = { sections: {}, refreshedAt: 0, error: error.message };
      return { configured: true, ...mediaCache };
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

async function loadCommunity() {
  try {
    return JSON.parse(await readFile(communityFile, 'utf8'));
  } catch {
    return {};
  }
}

let community = await loadCommunity();
let writeQueue = Promise.resolve();

function saveCommunity() {
  writeQueue = writeQueue.catch(() => {}).then(async () => {
    await mkdir(dataDirectory, { recursive: true });
    const temporary = `${communityFile}.tmp`;
    await writeFile(temporary, JSON.stringify(community, null, 2), 'utf8');
    await rename(temporary, communityFile);
  });
  return writeQueue;
}

function safeKey(value) {
  return String(value || '').slice(0, 240).replace(/[^a-zA-Z0-9_:.\-]/g, '_');
}

function getRecord(id, viewerId = '') {
  const stored = community[id] || { likes: [], comments: [] };
  return {
    likeCount: stored.likes.length,
    liked: viewerId ? stored.likes.includes(viewerId) : false,
    comments: stored.comments,
  };
}

async function readJson(request) {
  let content = '';
  for await (const chunk of request) {
    content += chunk;
    if (content.length > 64_000) throw new Error('Request body is too large.');
  }
  return content ? JSON.parse(content) : {};
}

function json(response, status, body) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  response.end(JSON.stringify(body));
}

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

async function serveStatic(request, response, pathname) {
  const dist = path.join(root, 'dist');
  const requestedPath = pathname === '/' ? '/index.html' : decodeURIComponent(pathname);
  const resolved = path.resolve(dist, `.${requestedPath}`);
  if (!resolved.startsWith(`${dist}${path.sep}`) && resolved !== path.join(dist, 'index.html')) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  let target = resolved;
  try {
    if (!(await stat(target)).isFile()) target = path.join(dist, 'index.html');
  } catch {
    target = path.join(dist, 'index.html');
  }

  try {
    const info = await stat(target);
    response.writeHead(200, {
      'content-type': mimeTypes[path.extname(target)] || 'application/octet-stream',
      'content-length': info.size,
      'cache-control': target.endsWith('index.html') ? 'no-cache' : 'public, max-age=3600',
    });
    if (request.method === 'HEAD') response.end();
    else createReadStream(target).pipe(response);
  } catch {
    response.writeHead(404).end('Not found');
  }
}

async function handleFileProxy(request, response, pathname) {
  const match = pathname.match(/^\/api\/files\/([^/]+)\/(content|thumbnail)$/);
  if (!match) return false;
  if (!driveIsConfigured()) {
    json(response, 503, { error: 'Google Drive is not connected yet.' });
    return true;
  }

  const fileId = decodeURIComponent(match[1]);
  const view = match[2];
  const currentMedia = await refreshDriveMedia(false);
  const isPortfolioFile = Object.values(currentMedia.sections).some((files) => files.some((file) => file.id === fileId));
  if (!isPortfolioFile) {
    json(response, 404, { error: 'Media file not found in the connected portfolio folders.' });
    return true;
  }
  const headers = {};
  if (request.headers.range) headers.range = request.headers.range;

  try {
    let upstream;
    if (!hasDriveCredentials()) {
      const url = view === 'thumbnail'
        ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1200`
        : `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;
      upstream = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
    } else if (view === 'thumbnail') {
      const metadataResponse = await driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=thumbnailLink,mimeType&supportsAllDrives=true`);
      const metadata = await metadataResponse.json();
      if (metadata.thumbnailLink) {
        const token = await getDriveToken();
        upstream = await fetch(metadata.thumbnailLink, { headers: { authorization: `Bearer ${token}` } });
        if (!upstream.ok) upstream = null;
      }
    }
    if (!upstream) {
      upstream = await driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`, { headers });
    }
    if (!upstream.ok) throw new Error(`Google Drive media request failed (${upstream.status}).`);
    const responseHeaders = {
      'cache-control': 'public, max-age=300',
      'content-type': upstream.headers.get('content-type') || 'application/octet-stream',
      'accept-ranges': upstream.headers.get('accept-ranges') || 'bytes',
      'x-content-type-options': 'nosniff',
    };
    for (const header of ['content-length', 'content-range']) {
      const value = upstream.headers.get(header);
      if (value) responseHeaders[header] = value;
    }
    response.writeHead(upstream.status, responseHeaders);
    if (request.method === 'HEAD' || !upstream.body) response.end();
    else Readable.fromWeb(upstream.body).pipe(response);
  } catch (error) {
    json(response, 502, { error: error.message });
  }
  return true;
}

const server = createServer(async (request, response) => {
  const parsed = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  const pathname = parsed.pathname;

  if (pathname === '/api/health' && request.method === 'GET') {
    json(response, 200, { ok: true, driveConfigured: driveIsConfigured() });
    return;
  }

  if (pathname === '/api/media' && request.method === 'GET') {
    const result = await refreshDriveMedia(parsed.searchParams.get('refresh') === '1');
    json(response, 200, result);
    return;
  }

  if (pathname === '/api/community' && request.method === 'GET') {
    const ids = (parsed.searchParams.get('ids') || '').split(',').map(safeKey).filter(Boolean).slice(0, 300);
    const viewerId = safeKey(parsed.searchParams.get('viewerId'));
    const records = Object.fromEntries(ids.map((id) => [id, getRecord(id, viewerId)]));
    json(response, 200, { records });
    return;
  }

  if (pathname === '/api/community/bulk' && request.method === 'POST') {
    let body;
    try {
      body = await readJson(request);
    } catch {
      json(response, 400, { error: 'Invalid request.' });
      return;
    }
    const ids = Array.isArray(body.ids) ? body.ids.map(safeKey).filter(Boolean).slice(0, 5000) : [];
    const viewerId = safeKey(body.viewerId);
    const records = Object.fromEntries(ids.map((id) => [id, getRecord(id, viewerId)]));
    json(response, 200, { records });
    return;
  }

  const communityMatch = pathname.match(/^\/api\/community\/([^/]+)\/(likes|comments)$/);
  if (communityMatch && request.method === 'POST') {
    let body;
    try {
      body = await readJson(request);
    } catch {
      json(response, 400, { error: 'Invalid request.' });
      return;
    }
    const id = safeKey(decodeURIComponent(communityMatch[1]));
    if (!id) {
      json(response, 400, { error: 'A media item is required.' });
      return;
    }
    const stored = community[id] || { likes: [], comments: [] };

    if (communityMatch[2] === 'likes') {
      const viewerId = safeKey(body.viewerId);
      if (!viewerId) {
        json(response, 400, { error: 'A viewer ID is required.' });
        return;
      }
      stored.likes = stored.likes.filter((like) => like !== viewerId);
      if (body.liked !== false) stored.likes.push(viewerId);
      community[id] = stored;
      await saveCommunity();
      json(response, 200, { record: getRecord(id, viewerId) });
      return;
    }

    const name = String(body.name || 'Guest').trim().slice(0, 50) || 'Guest';
    const text = String(body.text || '').trim().slice(0, 1000);
    if (!text) {
      json(response, 400, { error: 'Write a comment first.' });
      return;
    }
    stored.comments.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      text,
      createdAt: new Date().toISOString(),
    });
    community[id] = stored;
    await saveCommunity();
    json(response, 201, { record: getRecord(id, safeKey(body.viewerId)) });
    return;
  }

  if (pathname.startsWith('/api/files/')) {
    const handled = await handleFileProxy(request, response, pathname);
    if (handled) return;
  }

  if (pathname.startsWith('/api/')) {
    json(response, 404, { error: 'API route not found.' });
    return;
  }

  await serveStatic(request, response, pathname);
});

if (driveIsConfigured()) {
  refreshDriveMedia(true);
  setInterval(() => refreshDriveMedia(true), refreshInterval).unref();
}

server.listen(port, '0.0.0.0', () => {
  console.log(`Portfolio API listening on http://localhost:${port}`);
  if (!driveIsConfigured()) console.log('Google Drive is not configured; the site will show reference previews.');
});
