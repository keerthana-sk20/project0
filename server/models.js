import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'editor'], default: 'admin' },
  },
  { timestamps: true },
)

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, required: true, maxlength: 320 },
    body: { type: String, required: true },
    category: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    image: { type: String, default: '' },
    tags: [{ type: String, trim: true }],
    status: { type: String, enum: ['draft', 'published', 'scheduled'], default: 'draft' },
    featured: { type: Boolean, default: false },
    scheduledAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    seoTitle: { type: String, maxlength: 70, default: '' },
    metaDescription: { type: String, maxlength: 180, default: '' },
  },
  { timestamps: true },
)
postSchema.index({ title: 'text', excerpt: 'text', body: 'text', tags: 'text' })

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, maxlength: 240, default: '' },
  },
  { timestamps: true },
)

const tagSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, lowercase: true },
  },
  { timestamps: true },
)

const authorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    bio: { type: String, maxlength: 500, default: '' },
    email: { type: String, lowercase: true, trim: true, default: '' },
  },
  { timestamps: true },
)

export const User = mongoose.model('User', userSchema)
export const Post = mongoose.model('Post', postSchema)
export const Category = mongoose.model('Category', categorySchema)
export const Tag = mongoose.model('Tag', tagSchema)
export const Author = mongoose.model('Author', authorSchema)
