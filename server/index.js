import 'dotenv/config'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import multer from 'multer'
import { requireAuth, requireEditor } from './auth.js'
import { Author, Category, Post, Tag, User } from './models.js'

const app = express()
const port = Number(process.env.PORT) || 5000
const root = path.dirname(fileURLToPath(import.meta.url))
const uploadDirectory = path.join(root, 'uploads')
const categoryNames = [
  'Software Development',
  'Artificial Intelligence & Machine Learning',
  'Web and Mobile App Development',
  'Technology & Innovation',
  'Cybersecurity',
  'Cloud Computing',
  'Industry Insights',
]
const modelMap = { categories: Category, tags: Tag, authors: Author }
const singularMap = { categories: 'category', tags: 'tag', authors: 'author' }

if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
  console.error('MONGODB_URI and JWT_SECRET are required. Copy .env.example to .env and configure them.')
  process.exit(1)
}

fs.mkdirSync(uploadDirectory, { recursive: true })
app.disable('x-powered-by')
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'", 'https://www.googletagmanager.com'],
      frameSrc: ["'self'", 'https://www.youtube-nocookie.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      connectSrc: ["'self'", 'http://localhost:5000', 'https://www.google-analytics.com', 'https://analytics.google.com'],
    },
  },
}))
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '2mb' }))
app.use('/uploads', express.static(uploadDirectory, { maxAge: '7d', immutable: true }))

function makeSlug(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function articleFields(body, previous = {}) {
  const status = ['draft', 'published', 'scheduled'].includes(body.status) ? body.status : (previous.status || 'draft')
  const scheduledAt = status === 'scheduled' && body.scheduledAt ? new Date(body.scheduledAt) : null
  if (status === 'scheduled' && !scheduledAt) {
    const error = new Error('Choose a publication date to schedule this article.')
    error.status = 400
    throw error
  }
  if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
    const error = new Error('Please provide a valid publication date.')
    error.status = 400
    throw error
  }
  const title = body.title ?? previous.title
  const values = {
    title,
    slug: makeSlug(body.slug || title || ''),
    excerpt: body.excerpt ?? previous.excerpt,
    body: body.body ?? previous.body,
    category: body.category ?? previous.category,
    author: body.author ?? previous.author,
    image: body.image ?? previous.image ?? '',
    tags: Array.isArray(body.tags) ? body.tags : previous.tags || [],
    status,
    featured: body.featured ?? previous.featured ?? false,
    scheduledAt: scheduledAt || null,
    publishedAt: status === 'published' && !scheduledAt
      ? (previous.status === 'published' && previous.publishedAt ? previous.publishedAt : new Date())
      : (status === 'scheduled' ? null : previous.publishedAt || null),
    seoTitle: body.seoTitle ?? previous.seoTitle ?? '',
    metaDescription: body.metaDescription ?? previous.metaDescription ?? '',
  }
  if (scheduledAt) values.status = 'scheduled'
  return values
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many sign-in attempts. Try again in 15 minutes.' },
})

app.get('/api/health', (_request, response) => response.json({ status: 'ok' }))
app.get('/robots.txt', (_request, response) => {
  const siteUrl = process.env.SITE_URL || 'http://localhost:5173'
  response.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${siteUrl}/sitemap.xml\n`)
})
app.get('/sitemap.xml', async (_request, response, next) => {
  try {
    const siteUrl = process.env.SITE_URL || 'http://localhost:5173'
    const posts = await Post.find({ status: 'published', publishedAt: { $lte: new Date() } }).select('slug updatedAt').lean()
    const urls = [
      `<url><loc>${siteUrl}/</loc></url>`,
      `<url><loc>${siteUrl}/blog</loc></url>`,
      ...posts.map((post) => `<url><loc>${siteUrl}/blog/${encodeURIComponent(post.slug)}</loc><lastmod>${new Date(post.updatedAt).toISOString()}</lastmod></url>`),
    ]
    response.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`)
  } catch (error) {
    next(error)
  }
})

app.post('/api/auth/login', loginLimiter, async (request, response, next) => {
  try {
    const email = String(request.body.email || '').trim().toLowerCase()
    const password = String(request.body.password || '')
    const user = await User.findOne({ email })
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return response.status(401).json({ message: 'Email or password is incorrect.' })
    }
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '8h' })
    response.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (error) {
    next(error)
  }
})

app.get('/api/posts', (request, response, next) => {
  if (request.query.all === '1') return requireAuth(request, response, next)
  next()
}, async (request, response, next) => {
  try {
    const filter = request.query.all === '1'
      ? {}
      : { status: 'published', publishedAt: { $lte: new Date() } }
    const category = String(request.query.category || '')
    const query = String(request.query.q || '').trim()
    if (category) filter.category = category
    if (query) filter.$text = { $search: query }
    const page = Math.max(1, Number(request.query.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(request.query.limit) || 12))
    const posts = await Post.find(filter)
      .sort({ featured: -1, publishedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
    const total = await Post.countDocuments(filter)
    response.json({ posts, page, pages: Math.ceil(total / limit), total })
  } catch (error) {
    next(error)
  }
})

app.get('/api/posts/:slug', async (request, response, next) => {
  try {
    const post = await Post.findOne({
      slug: request.params.slug,
      status: 'published',
      publishedAt: { $lte: new Date() },
    }).lean()
    if (!post) return response.status(404).json({ message: 'Article not found.' })
    const [previous, nextPost] = await Promise.all([
      Post.findOne({ status: 'published', publishedAt: { $lt: post.publishedAt } }).sort({ publishedAt: -1 }).select('title slug').lean(),
      Post.findOne({ status: 'published', publishedAt: { $gt: post.publishedAt } }).sort({ publishedAt: 1 }).select('title slug').lean(),
    ])
    response.json({ post, previous, next: nextPost })
  } catch (error) {
    next(error)
  }
})

app.post('/api/posts', requireAuth, requireEditor, async (request, response, next) => {
  try {
    const post = await Post.create(articleFields(request.body))
    response.status(201).json({ post })
  } catch (error) {
    next(error)
  }
})

app.patch('/api/posts/:id', requireAuth, requireEditor, async (request, response, next) => {
  try {
    const current = await Post.findById(request.params.id)
    if (!current) return response.status(404).json({ message: 'Article not found.' })
    Object.assign(current, articleFields(request.body, current.toObject()))
    await current.save()
    response.json({ post: current })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/posts/:id', requireAuth, requireEditor, async (request, response, next) => {
  try {
    const deleted = await Post.findByIdAndDelete(request.params.id)
    if (!deleted) return response.status(404).json({ message: 'Article not found.' })
    response.status(204).end()
  } catch (error) {
    next(error)
  }
})

const imageTypes = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' }
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (_request, file, callback) => callback(null, `${crypto.randomUUID()}${imageTypes[file.mimetype] || ''}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!imageTypes[file.mimetype]) {
      const error = new Error('Upload a JPG, PNG, WebP, or GIF image.')
      error.status = 400
      return callback(error)
    }
    callback(null, true)
  },
})
app.post('/api/uploads', requireAuth, requireEditor, upload.single('image'), (request, response) => {
  if (!request.file) return response.status(400).json({ message: 'Choose an image to upload.' })
  response.status(201).json({ url: `/uploads/${request.file.filename}` })
})

for (const [resource, Model] of Object.entries(modelMap)) {
  app.get(`/api/${resource}`, async (_request, response, next) => {
    try {
      const items = await Model.find().sort({ name: 1 }).lean()
      response.json({ [resource]: items })
    } catch (error) {
      next(error)
    }
  })

  app.post(`/api/${resource}`, requireAuth, requireEditor, async (request, response, next) => {
    try {
      const values = { ...request.body }
      if (Model !== Author) values.slug = makeSlug(values.name || '')
      const item = await Model.create(values)
      response.status(201).json({ [singularMap[resource]]: item })
    } catch (error) {
      next(error)
    }
  })

  app.patch(`/api/${resource}/:id`, requireAuth, requireEditor, async (request, response, next) => {
    try {
      const values = { ...request.body }
      if (Model !== Author && values.name) values.slug = makeSlug(values.name)
      const item = await Model.findByIdAndUpdate(request.params.id, values, { new: true, runValidators: true })
      if (!item) return response.status(404).json({ message: `${singularMap[resource]} not found.` })
      response.json({ [singularMap[resource]]: item })
    } catch (error) {
      next(error)
    }
  })

  app.delete(`/api/${resource}/:id`, requireAuth, requireEditor, async (request, response, next) => {
    try {
      const item = await Model.findByIdAndDelete(request.params.id)
      if (!item) return response.status(404).json({ message: `${singularMap[resource]} not found.` })
      response.status(204).end()
    } catch (error) {
      next(error)
    }
  })
}

const clientBuild = path.resolve(root, '../dist')
if (fs.existsSync(clientBuild)) {
  app.use(express.static(clientBuild))
  app.get(/.*/, (request, response, next) => {
    if (request.path.startsWith('/api/') || request.path.startsWith('/uploads/')) return next()
    response.sendFile(path.join(clientBuild, 'index.html'))
  })
}

app.use((error, _request, response, _next) => {
  console.error(error)
  if (error.code === 11000) return response.status(409).json({ message: 'That name or URL slug is already in use.' })
  if (error.name === 'ValidationError') return response.status(400).json({ message: error.message })
  if (error.name === 'CastError') return response.status(400).json({ message: 'Invalid record identifier.' })
  if (error instanceof multer.MulterError) return response.status(400).json({ message: error.code === 'LIMIT_FILE_SIZE' ? 'Images must be 5 MB or smaller.' : error.message })
  response.status(error.status || 500).json({ message: error.status ? error.message : 'Something went wrong. Check the server logs.' })
})

async function initialize() {
  await mongoose.connect(process.env.MONGODB_URI)
  await Promise.all(categoryNames.map((name) => Category.updateOne(
    { name },
    { $setOnInsert: { name, slug: makeSlug(name), description: '' } },
    { upsert: true },
  )))

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const email = process.env.ADMIN_EMAIL.trim().toLowerCase()
    const existing = await User.findOne({ email })
    if (!existing) {
      const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12)
      await User.create({ name: process.env.ADMIN_NAME || 'Northstar Editor', email, passwordHash, role: 'admin' })
      console.info(`Created initial admin account for ${email}`)
    }
  }

  const scheduler = setInterval(async () => {
    try {
      const now = new Date()
      await Post.updateMany(
        { status: 'scheduled', scheduledAt: { $lte: now } },
        [{ $set: { status: 'published', publishedAt: '$scheduledAt' } }],
        { updatePipeline: true },
      )
    } catch (error) {
      console.error('Could not publish scheduled articles:', error)
    }
  }, 60_000)
  scheduler.unref()

  app.listen(port, () => console.info(`Northstar API listening on http://localhost:${port}`))
}

initialize().catch((error) => {
  console.error('Could not start the Northstar API:', error)
  process.exit(1)
})
