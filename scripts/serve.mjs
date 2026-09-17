// Minimal static file server for the built dist/ folder (smoke testing).
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..', 'dist')
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
}

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0])
    if (p === '/') p = '/index.html'
    let file = join(root, p)
    let body
    try {
      body = await readFile(file)
    } catch {
      body = await readFile(join(root, 'index.html')) // SPA fallback
      file = 'index.html'
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' })
    res.end(body)
  } catch (e) {
    res.writeHead(500)
    res.end(String(e))
  }
})

const PORT = Number(process.argv[2]) || 8080
server.listen(PORT, () => console.log(`serving dist on ${PORT}`))
