import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowUpRight, Check, FilePlus2, ImagePlus, LogOut, Plus, Save, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

const API = '/api'

async function request(path, options = {}, token) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.message || `Request failed (${response.status})`)
  return payload
}

async function loadAllPosts(token) {
  const firstPage = await request('/posts?all=1&limit=50&page=1', {}, token)
  if (firstPage.pages <= 1) return firstPage
  const remaining = await Promise.all(
    Array.from({ length: firstPage.pages - 1 }, (_, index) =>
      request(`/posts?all=1&limit=50&page=${index + 2}`, {}, token),
    ),
  )
  return { ...firstPage, posts: [firstPage, ...remaining].flatMap((page) => page.posts || []) }
}

const emptyPost = {
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  category: 'Software Development',
  author: '',
  image: '',
  seoTitle: '',
  metaDescription: '',
  featured: false,
  status: 'draft',
  scheduledAt: '',
  tags: '',
}

const collections = {
  categories: { title: 'Categories', singular: 'category', fields: ['name', 'description'] },
  tags: { title: 'Tags', singular: 'tag', fields: ['name'] },
  authors: { title: 'Authors', singular: 'author', fields: ['name', 'bio', 'email'] },
}

function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem('northstar-admin-token') || '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [activeTab, setActiveTab] = useState('posts')
  const [posts, setPosts] = useState([])
  const [metadata, setMetadata] = useState({ categories: [], tags: [], authors: [] })
  const [postForm, setPostForm] = useState(emptyPost)
  const [editingId, setEditingId] = useState('')
  const [itemForm, setItemForm] = useState({})
  const [editingItem, setEditingItem] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function loadDashboard(currentToken = token) {
    setBusy(true)
    setError('')
    try {
      const [postData, categoryData, tagData, authorData] = await Promise.all([
        loadAllPosts(currentToken),
        request('/categories', {}, currentToken),
        request('/tags', {}, currentToken),
        request('/authors', {}, currentToken),
      ])
      setPosts(postData.posts || [])
      setMetadata({ categories: categoryData.categories || [], tags: tagData.tags || [], authors: authorData.authors || [] })
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!token) return undefined
    let active = true
    Promise.all([
      loadAllPosts(token),
      request('/categories', {}, token),
      request('/tags', {}, token),
      request('/authors', {}, token),
    ])
      .then(([postData, categoryData, tagData, authorData]) => {
        if (!active) return
        setPosts(postData.posts || [])
        setMetadata({ categories: categoryData.categories || [], tags: tagData.tags || [], authors: authorData.authors || [] })
        setError('')
      })
      .catch((loadError) => {
        if (active) setError(loadError.message)
      })
      .finally(() => {
        if (active) setBusy(false)
      })
    return () => { active = false }
  }, [token])

  async function signIn(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
      sessionStorage.setItem('northstar-admin-token', result.token)
      setToken(result.token)
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setBusy(false)
    }
  }

  function signOut() {
    sessionStorage.removeItem('northstar-admin-token')
    setToken('')
    setPosts([])
    setPassword('')
  }

  async function savePost(event, status = 'draft') {
    event.preventDefault()
    if (!event.currentTarget.form?.reportValidity()) return
    setBusy(true)
    setError('')
    setNotice('')
    const payload = {
      ...postForm,
      tags: postForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      scheduledAt: postForm.scheduledAt || null,
      status,
    }
    try {
      await request(editingId ? `/posts/${editingId}` : '/posts', {
        method: editingId ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      }, token)
      setPostForm(emptyPost)
      setEditingId('')
      setNotice('Your article has been saved.')
      await loadDashboard(token)
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setBusy(false)
    }
  }

  function editPost(post) {
    setEditingId(post._id)
    setPostForm({
      ...emptyPost,
      ...post,
      scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : '',
      tags: (post.tags || []).map((tag) => typeof tag === 'string' ? tag : tag.name).join(', '),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function deletePost(postId) {
    if (!window.confirm('Delete this article permanently?')) return
    try {
      await request(`/posts/${postId}`, { method: 'DELETE' }, token)
      setNotice('Article deleted.')
      await loadDashboard(token)
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  async function uploadImage(file, inline = false) {
    if (!file) return
    const formData = new FormData()
    formData.append('image', file)
    setBusy(true)
    setError('')
    try {
      const result = await request('/uploads', { method: 'POST', body: formData }, token)
      setPostForm((current) => inline
        ? { ...current, body: `${current.body}\n\n![Article image](${result.url})\n\n` }
        : { ...current, image: result.url })
    } catch (uploadError) {
      setError(uploadError.message)
    } finally {
      setBusy(false)
    }
  }

  async function saveMetadata(event) {
    event.preventDefault()
    const collection = activeTab
    const fields = collections[collection].fields
    const body = Object.fromEntries(fields.map((field) => [field, itemForm[field] || '']))
    try {
      await request(editingItem ? `/${collection}/${editingItem}` : `/${collection}`, {
        method: editingItem ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      }, token)
      setItemForm({})
      setEditingItem('')
      setNotice(`${collections[collection].singular} saved.`)
      await loadDashboard(token)
    } catch (saveError) {
      setError(saveError.message)
    }
  }

  async function deleteMetadata(id) {
    if (!window.confirm(`Delete this ${collections[activeTab].singular}?`)) return
    try {
      await request(`/${activeTab}/${id}`, { method: 'DELETE' }, token)
      await loadDashboard(token)
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  if (!token) {
    return (
      <main className="admin-login">
        <div className="admin-login-card">
          <Link to="/" className="back-link"><ArrowLeft size={15} /> Back to journal</Link>
          <span className="admin-symbol">N<span>.</span></span>
          <span className="eyebrow">Northstar / Editorial</span>
          <h1>Good to have<br />you back.</h1>
          <p>Sign in to shape what comes next.</p>
          <form onSubmit={signIn}>
            <label>Email address<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
            <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} <ArrowUpRight size={16} /></button>
          </form>
          {error && <p className="admin-error">{error}</p>}
          <small>Admin access is configured with the server environment variables.</small>
        </div>
      </main>
    )
  }

  return (
    <main className="admin-page">
      <header className="admin-topbar"><div><Link to="/" className="admin-brand"><span className="admin-symbol">N<span>.</span></span><span>Northstar <small>EDITORIAL</small></span></Link></div><div><Link to="/" className="admin-preview">View journal <ArrowUpRight size={14} /></Link><button className="admin-signout" onClick={signOut}><LogOut size={14} /> Sign out</button></div></header>
      <div className="admin-shell">
        <aside className="admin-sidebar"><span className="sidebar-label">Workspace</span><button className={activeTab === 'posts' ? 'selected' : ''} onClick={() => setActiveTab('posts')}>Articles <span>{posts.length}</span></button>{Object.entries(collections).map(([key, config]) => <button key={key} className={activeTab === key ? 'selected' : ''} onClick={() => setActiveTab(key)}>{config.title} <span>{metadata[key].length}</span></button>)}<div className="admin-side-note">A good story is<br />always worth sharing.</div></aside>
        <section className="admin-content">
          <div className="admin-heading"><div><span className="eyebrow">Northstar / Editorial</span><h1>{activeTab === 'posts' ? 'Your stories.' : `Manage ${collections[activeTab].title.toLowerCase()}.`}</h1></div><span className="admin-live"><i /> Workspace</span></div>
          {error && <div className="admin-alert error">{error}<button onClick={() => setError('')}>Dismiss</button></div>}
          {notice && <div className="admin-alert success"><Check size={15} />{notice}<button onClick={() => setNotice('')}>Dismiss</button></div>}
          {activeTab === 'posts' ? (
            <div className="admin-columns">
              <form className="admin-editor" onSubmit={savePost}>
                <div className="admin-form-heading"><div><FilePlus2 size={17} /><strong>{editingId ? 'Edit article' : 'Create a story'}</strong></div>{editingId && <button type="button" onClick={() => { setEditingId(''); setPostForm(emptyPost) }}>Cancel</button>}</div>
                <label>Article title<input value={postForm.title} onChange={(event) => setPostForm({ ...postForm, title: event.target.value })} required /></label>
                <label>URL slug <small>Leave blank to create one from the title.</small><input value={postForm.slug} onChange={(event) => setPostForm({ ...postForm, slug: event.target.value })} placeholder="your-article-url" /></label>
                <label>Short description<textarea rows="2" value={postForm.excerpt} onChange={(event) => setPostForm({ ...postForm, excerpt: event.target.value })} required /></label>
                <div className="admin-form-row"><label>Category<select value={postForm.category} onChange={(event) => setPostForm({ ...postForm, category: event.target.value })}>{metadata.categories.length ? metadata.categories.map((category) => <option key={category._id} value={category.name}>{category.name}</option>) : <option>Software Development</option>}</select></label><label>Author<input value={postForm.author} onChange={(event) => setPostForm({ ...postForm, author: event.target.value })} required /></label></div>
                <label>Article content <small>Markdown supported — headings, links, tables and code blocks.</small><textarea className="admin-body-input" rows="12" value={postForm.body} onChange={(event) => setPostForm({ ...postForm, body: event.target.value })} required /></label>
                <label>Featured image URL<input value={postForm.image} onChange={(event) => setPostForm({ ...postForm, image: event.target.value })} placeholder="https://…" /><span className="upload-button"><ImagePlus size={14} /> Upload image<input type="file" accept="image/*" onChange={(event) => uploadImage(event.target.files?.[0])} /></span></label>
                <label>Image within article <small>Upload an image and add its Markdown embed to the article content.</small><span className="upload-button"><ImagePlus size={14} /> Upload inline image<input type="file" accept="image/*" onChange={(event) => uploadImage(event.target.files?.[0], true)} /></span></label>
                <label>Tags <small>Separate tags with commas.</small><input value={postForm.tags} onChange={(event) => setPostForm({ ...postForm, tags: event.target.value })} /></label>
                <div className="admin-form-row"><label>SEO title<input value={postForm.seoTitle} onChange={(event) => setPostForm({ ...postForm, seoTitle: event.target.value })} /></label><label>Meta description<input value={postForm.metaDescription} onChange={(event) => setPostForm({ ...postForm, metaDescription: event.target.value })} /></label></div>
                <label>Schedule for<input type="datetime-local" value={postForm.scheduledAt} onChange={(event) => setPostForm({ ...postForm, scheduledAt: event.target.value })} /></label>
                <label className="admin-check"><input type="checkbox" checked={postForm.featured} onChange={(event) => setPostForm({ ...postForm, featured: event.target.checked })} /> Feature this story</label>
                <div className="admin-editor-actions"><button type="button" className="admin-save" disabled={busy} onClick={(event) => savePost(event, 'draft')}><Save size={15} />{busy ? 'Saving…' : 'Save draft'}</button><button type="button" className="admin-publish" disabled={busy} onClick={(event) => savePost(event, postForm.scheduledAt ? 'scheduled' : 'published')}>{postForm.scheduledAt ? 'Schedule' : 'Publish'} <ArrowUpRight size={14} /></button></div>
              </form>
              <div className="admin-post-list"><div className="admin-list-heading"><div><span className="eyebrow">The library</span><h2>Recent stories <span>{posts.length}</span></h2></div><button onClick={() => { setEditingId(''); setPostForm(emptyPost) }}><Plus size={15} /> New</button></div>
                {busy && !posts.length ? <p className="admin-empty">Loading stories…</p> : posts.length ? posts.map((post) => <article className="admin-post-item" key={post._id}><div className="admin-post-thumb">{post.image && <img src={post.image.startsWith('http') ? post.image : `${API.replace('/api', '')}${post.image}`} alt="" />}</div><div className="admin-post-info"><span className={`status-tag ${post.status}`}>{post.status}</span><h3>{post.title}</h3><span>{post.category} · {post.author || 'Unassigned'}</span><div className="admin-post-actions"><button onClick={() => editPost(post)}>Edit</button><button onClick={() => deletePost(post._id)} aria-label="Delete article"><Trash2 size={13} /></button></div></div></article>) : <p className="admin-empty">No stories yet. Start with a good one.</p>}
              </div>
            </div>
          ) : (
            <div className="metadata-manager"><form className="metadata-form" onSubmit={saveMetadata}><div className="admin-form-heading"><div><Plus size={17} /><strong>{editingItem ? 'Edit' : 'Add'} {collections[activeTab].singular}</strong></div>{editingItem && <button type="button" onClick={() => { setEditingItem(''); setItemForm({}) }}>Cancel</button>}</div>{collections[activeTab].fields.map((field) => <label key={field}>{field[0].toUpperCase() + field.slice(1)}{field === 'bio' ? <textarea rows="4" value={itemForm[field] || ''} onChange={(event) => setItemForm({ ...itemForm, [field]: event.target.value })} /> : <input type={field === 'email' ? 'email' : 'text'} value={itemForm[field] || ''} onChange={(event) => setItemForm({ ...itemForm, [field]: event.target.value })} required={field === 'name'} />}</label>)}<button className="admin-save" type="submit"><Save size={15} /> Save {collections[activeTab].singular}</button></form>
              <div className="metadata-list">{metadata[activeTab].map((item) => <div key={item._id}><span><strong>{item.name}</strong>{item.description && <small>{item.description}</small>}{item.email && <small>{item.email}</small>}</span><button onClick={() => { setItemForm(item); setEditingItem(item._id) }}>Edit</button><button onClick={() => deleteMetadata(item._id)} aria-label={`Delete ${item.name}`}><Trash2 size={14} /></button></div>)}{!metadata[activeTab].length && <p className="admin-empty">Nothing here yet — add your first {collections[activeTab].singular}.</p>}</div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default Admin
