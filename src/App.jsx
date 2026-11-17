import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  Clock3,
  Menu,
  Search,
  Share2,
  X,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { articles, categories, formatDate } from './data'
import Admin from './Admin'
import './App.css'

const BlogContext = createContext({ articles, hasMore: false, loadingMore: false, loadMore: async () => {} })
const CategoryContext = createContext(categories)

function useArticles() {
  return useContext(BlogContext)
}

function normalizePost(post) {
  const words = (post.body || '').trim().split(/\s+/).filter(Boolean).length
  return {
    ...post,
    date: formatDate(post.publishedAt || post.createdAt),
    read: `${Math.max(1, Math.ceil(words / 200))} min read`,
  }
}

function useArticleMetadata(article) {
  useEffect(() => {
    if (!article) return undefined
    const previousTitle = document.title
    const metaValues = [
      ['name', 'description', article.metaDescription || article.excerpt],
      ['property', 'og:title', article.seoTitle || article.title],
      ['property', 'og:description', article.metaDescription || article.excerpt],
      ['property', 'og:image', article.image],
      ['property', 'og:type', 'article'],
      ['name', 'twitter:card', 'summary_large_image'],
      ['name', 'twitter:title', article.seoTitle || article.title],
      ['name', 'twitter:description', article.metaDescription || article.excerpt],
    ]
    const previousMeta = metaValues.map(([attribute, name]) => {
      const element = document.head.querySelector(`meta[${attribute}="${name}"]`)
      return { element, content: element?.content }
    })
    const canonical = document.head.querySelector('link[rel="canonical"]')
    const previousCanonical = canonical?.href
    const pageTitle = article.seoTitle || `${article.title} — Northstar Journal`
    document.title = pageTitle
    metaValues.forEach(([attribute, name, content]) => {
      let element = document.head.querySelector(`meta[${attribute}="${name}"]`)
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attribute, name)
        document.head.append(element)
      }
      element.content = content
    })
    let canonicalLink = canonical
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.rel = 'canonical'
      document.head.append(canonicalLink)
    }
    canonicalLink.href = window.location.href
    const structuredData = document.createElement('script')
    structuredData.type = 'application/ld+json'
    structuredData.dataset.articleSchema = 'true'
    structuredData.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: article.title,
      description: article.metaDescription || article.excerpt,
      image: article.image,
      datePublished: new Date(article.publishedAt || article.date).toISOString(),
      author: { '@type': 'Person', name: article.author },
      mainEntityOfPage: window.location.href,
    })
    document.head.append(structuredData)
    return () => {
      document.title = previousTitle
      previousMeta.forEach(({ element, content }, index) => {
        if (element && content !== undefined) element.content = content
        else if (element) element.remove()
        else {
          const [attribute, name] = metaValues[index]
          document.head.querySelector(`meta[${attribute}="${name}"]`)?.remove()
        }
      })
      if (canonical && previousCanonical) canonical.href = previousCanonical
      else if (canonicalLink && !canonical) canonicalLink.remove()
      structuredData.remove()
    }
  }, [article])
}

function Logo() {
  return (
    <Link className="brand" to="/" aria-label="Northstar Journal home">
      <span className="brand-mark">N<span>.</span></span>
      <span className="brand-name">northstar<span> / journal</span></span>
    </Link>
  )
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const closeMenu = () => {
    setMenuOpen(false)
    setSearchOpen(false)
  }

  function submitSearch(event) {
    event.preventDefault()
    navigate(`/blog?q=${encodeURIComponent(query.trim())}`)
    setSearchOpen(false)
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Logo />
        <button
          className="mobile-menu icon-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`}>
          <Link to="/blog" onClick={closeMenu}>All stories</Link>
          <Link to="/blog?category=Industry%20Insights" onClick={closeMenu}>Perspectives</Link>
          <Link to="/blog?category=Software%20Development" onClick={closeMenu}>Engineering</Link>
          <Link to="/blog?category=Artificial%20Intelligence%20%26%20Machine%20Learning" onClick={closeMenu}>AI &amp; data</Link>
        </nav>
        <div className="header-actions">
          {searchOpen ? (
            <form className="header-search" onSubmit={submitSearch}>
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search stories"
                aria-label="Search stories"
              />
              <button type="submit" aria-label="Submit search"><ArrowRight size={17} /></button>
              <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search"><X size={17} /></button>
            </form>
          ) : (
            <button className="search-trigger" onClick={() => setSearchOpen(true)}>
              <Search size={17} /><span>Search</span>
            </button>
          )}
          <Link className="header-cta" to="/blog">Explore stories <ArrowUpRight size={15} /></Link>
        </div>
      </div>
    </header>
  )
}

function Eyebrow({ children, light = false }) {
  return <span className={`eyebrow ${light ? 'eyebrow-light' : ''}`}>{children}</span>
}

function ArticleCard({ article, layout = 'standard', index }) {
  return (
    <article className={`article-card card-${layout}`}>
      <Link to={`/blog/${article.slug}`} className="card-image-link">
        <img src={article.image} alt="" className="card-image" loading="lazy" />
        {index !== undefined && <span className="card-number">0{index + 1}</span>}
      </Link>
      <div className="card-copy">
        <div className="card-meta"><span>{article.category}</span><span className="meta-dot" />{article.read}</div>
        <h3><Link to={`/blog/${article.slug}`}>{article.title}</Link></h3>
        <p>{article.excerpt}</p>
        <div className="card-byline"><span>{article.author}</span><span>{article.date}</span></div>
      </div>
    </article>
  )
}

function ArticleLink({ href, children, ...props }) {
  let embedUrl = ''
  try {
    const url = new URL(href, window.location.origin)
    if (url.hostname === 'youtu.be') embedUrl = `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`
    if (['youtube.com', 'www.youtube.com'].includes(url.hostname) && url.pathname === '/watch' && url.searchParams.has('v')) {
      embedUrl = `https://www.youtube-nocookie.com/embed/${url.searchParams.get('v')}`
    }
  } catch {
    embedUrl = ''
  }
  if (embedUrl) {
    return <div className="article-video"><iframe src={embedUrl} title={String(children) || 'Embedded video'} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>
  }
  return <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noreferrer' : undefined} {...props}>{children}</a>
}

function CategoryRail({ selected = 'All stories', onSelect }) {
  const categories = useContext(CategoryContext)
  return (
    <div className="category-rail">
      {categories.map((category) => (
        <button
          key={category}
          className={`category-pill ${selected === category ? 'active' : ''}`}
          onClick={() => onSelect(category)}
        >
          {category}
        </button>
      ))}
    </div>
  )
}

function Newsletter() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  function submit(event) {
    event.preventDefault()
    if (email.includes('@')) setSubscribed(true)
  }

  return (
    <section className="newsletter">
      <div>
        <Eyebrow light>The Northstar note</Eyebrow>
        <h2>Good ideas, delivered<br />occasionally.</h2>
        <p>A considered read on what’s next in technology. No noise, just perspective.</p>
      </div>
      {subscribed ? (
        <div className="subscribe-success"><Check size={18} /> You’re on the list. See you in your inbox.</div>
      ) : (
        <form className="subscribe-form" onSubmit={submit}>
          <label className="sr-only" htmlFor="newsletter-email">Your email address</label>
          <input id="newsletter-email" type="email" placeholder="Your email address" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <button type="submit" aria-label="Subscribe"><ArrowRight size={19} /></button>
          <small>By subscribing, you agree to our <a href="#privacy">privacy policy</a>.</small>
        </form>
      )}
    </section>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Logo />
          <p>Ideas for a world<br />in motion.</p>
        </div>
        <div className="footer-column"><span>Explore</span><Link to="/blog">All stories</Link><Link to="/blog?category=Industry%20Insights">Perspectives</Link><Link to="/blog?category=Software%20Development">Engineering</Link></div>
        <div className="footer-column"><span>Topics</span><Link to="/blog?category=Artificial%20Intelligence%20%26%20Machine%20Learning">AI &amp; data</Link><Link to="/blog?category=Cybersecurity">Security</Link><Link to="/blog?category=Cloud%20Computing">Cloud</Link></div>
        <div className="footer-column"><span>Say hello</span><a href="mailto:hello@northstar.example">hello@northstar.example</a><a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">LinkedIn <ArrowUpRight size={12} /></a><a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={12} /></a></div>
      </div>
      <div className="footer-bottom"><span>© 2026 Northstar Technologies</span><div><a href="#privacy">Privacy</a><a href="#terms">Terms</a><Link to="/admin">Team sign in</Link></div><span>Made for curious minds <span className="footer-star">✳</span></span></div>
    </footer>
  )
}

function HomePage() {
  const navigate = useNavigate()
  const { articles } = useArticles()
  const featured = articles.find((article) => article.featured) || articles[0]
  const latest = articles.filter((article) => article.slug !== featured.slug).slice(0, 3)
  const trending = articles.slice(1, 4)

  function selectCategory(category) {
    navigate(`/blog${category === 'All stories' ? '' : `?category=${encodeURIComponent(category)}`}`)
  }

  return (
    <>
      <main>
        <section className="home-intro page-wrap">
          <div className="intro-topline"><span>Ideas for what’s next</span><span className="intro-line" /><span>{articles === sampleArticles ? 'Sample edition · 2026' : 'Vol. 01 — 2026'}</span></div>
          <h1>Technology moves.<br /><span>We make sense of it.</span></h1>
          <p className="intro-copy">A journal for people building what comes next — thoughtful perspectives on technology, work, and the ideas shaping our world.</p>
          <a className="text-link intro-link" href="#featured">Find your next read <ArrowDownRight size={17} /></a>
        </section>

        {featured && <section id="featured" className="featured-section page-wrap">
          <div className="section-heading"><Eyebrow>Editor’s selection</Eyebrow><span className="section-rule" /><span className="section-index">01 / 04</span></div>
          <Link className="featured-card" to={`/blog/${featured.slug}`}>
            <div className="featured-image-wrap"><img src={featured.image} alt="" className="featured-image" /><span className="image-caption">The future is a work in progress.</span></div>
            <div className="featured-copy">
              <div className="card-meta"><span>{featured.category}</span><span className="meta-dot" />{featured.read}</div>
              <h2>{featured.title}</h2>
              <p>{featured.excerpt}</p>
              <div className="featured-bottom"><div className="card-byline"><span>{featured.author}</span><span>{featured.date}</span></div><span className="round-arrow"><ArrowUpRight size={19} /></span></div>
            </div>
          </Link>
        </section>}

        <section className="latest-section page-wrap">
          <div className="section-heading"><Eyebrow>Fresh thinking</Eyebrow><span className="section-rule" /><Link className="text-link" to="/blog">All stories <ArrowRight size={15} /></Link></div>
          <div className="latest-grid">{latest.map((article, index) => <ArticleCard key={article.slug} article={article} index={index} />)}</div>
        </section>

        <section className="topic-section">
          <div className="page-wrap topic-inner">
            <div className="topic-heading"><div><Eyebrow>Follow your curiosity</Eyebrow><h2>Ideas don’t fit<br />in one box.</h2></div><p>Explore the topics shaping the way we build, work, and live.</p></div>
            <CategoryRail onSelect={selectCategory} />
          </div>
        </section>

        <section className="trending-section page-wrap">
          <div className="section-heading"><Eyebrow>Worth your time</Eyebrow><span className="section-rule" /><span className="section-note">The stories readers are spending time with</span></div>
          <div className="trending-list">
            {trending.map((article, index) => (
              <Link className="trending-row" key={article.slug} to={`/blog/${article.slug}`}>
                <span className="trending-index">0{index + 1}</span>
                <span className="trending-category">{article.category}</span>
                <span className="trending-title">{article.title}</span>
                <span className="trending-read">{article.read}</span>
                <ArrowUpRight className="trending-arrow" size={18} />
              </Link>
            ))}
          </div>
        </section>
        <div className="page-wrap"><Newsletter /></div>
      </main>
      <Footer />
    </>
  )
}

function ListingPage() {
  const { articles, hasMore, loadingMore, loadMore } = useArticles()
  const [params, setParams] = useSearchParams()
  const [visibleCount, setVisibleCount] = useState(6)
  const [loadError, setLoadError] = useState('')
  const selected = params.get('category') || 'All stories'
  const query = params.get('q') || ''
  const filtered = useMemo(() => articles.filter((article) => {
    const categoryMatch = selected === 'All stories' || article.category === selected
    const searchMatch = !query || `${article.title} ${article.excerpt} ${article.category} ${article.author}`.toLowerCase().includes(query.toLowerCase())
    return categoryMatch && searchMatch
  }), [articles, selected, query])
  const featured = filtered[0]
  const rest = filtered.slice(1, visibleCount)

  function selectCategory(category) {
    setVisibleCount(6)
    setParams((current) => {
      const next = new URLSearchParams(current)
      if (category === 'All stories') next.delete('category')
      else next.set('category', category)
      return next
    })
  }

  function updateQuery(value) {
    setVisibleCount(6)
    setParams((current) => {
      const next = new URLSearchParams(current)
      if (value) next.set('q', value)
      else next.delete('q')
      return next
    })
  }

  async function showMore() {
    if (visibleCount < filtered.length) {
      setVisibleCount((count) => count + 6)
      return
    }
    if (hasMore) {
      try {
        await loadMore()
        setLoadError('')
        setVisibleCount((count) => count + 6)
      } catch (error) {
        setLoadError(error.message)
      }
    }
  }

  return (
    <>
      <main className="listing-page page-wrap">
        <div className="listing-title-row"><div><Eyebrow>Northstar journal / Archive</Eyebrow><h1>{query ? 'Search results' : 'A little more perspective.'}</h1></div><p>Notes from the people building, questioning, and imagining what comes next.</p></div>
        <form className="listing-search" onSubmit={(event) => event.preventDefault()}>
          <Search size={18} /><input value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Search by topic, idea, or keyword" aria-label="Search articles" />
          {query && <button type="button" onClick={() => updateQuery('')}><X size={16} /> Clear</button>}
        </form>
        <CategoryRail selected={selected} onSelect={selectCategory} />
        {loadError && <p className="listing-load-error">{loadError}</p>}
        {filtered.length ? (
          <>
            {featured && <Link className="listing-featured" to={`/blog/${featured.slug}`}><img src={featured.image} alt="" /><div><div className="card-meta"><span>{featured.category}</span><span className="meta-dot" />{featured.read}</div><h2>{featured.title}</h2><p>{featured.excerpt}</p><div className="card-byline"><span>{featured.author}</span><span>{featured.date}</span></div></div><span className="round-arrow"><ArrowUpRight size={19} /></span></Link>}
            <div className="listing-grid">{rest.map((article) => <ArticleCard key={article.slug} article={article} />)}</div>
            {(visibleCount < filtered.length || hasMore) && <button className="load-more" onClick={showMore} disabled={loadingMore}>{loadingMore ? 'Loading stories…' : 'Load more stories'} <ArrowDownRight size={16} /></button>}
          </>
        ) : <div className="empty-results"><Search size={24} /><h2>No stories found</h2><p>Try another search or choose a different topic.</p><button className="text-link" onClick={() => { setParams({}); setVisibleCount(6) }}>View all stories <ArrowRight size={15} /></button>{hasMore && <button className="load-more" onClick={showMore} disabled={loadingMore}>{loadingMore ? 'Searching older stories…' : 'Search older stories'} <ArrowDownRight size={16} /></button>}</div>}
      </main>
      <div className="page-wrap"><Newsletter /></div>
      <Footer />
    </>
  )
}

function ArticlePage() {
  const { articles } = useArticles()
  const { slug } = useParams()
  const article = articles.find((item) => item.slug === slug)
  const [copied, setCopied] = useState(false)
  const [savedSlugs, setSavedSlugs] = useState(() => new Set(JSON.parse(localStorage.getItem('northstar-saved') || '[]')))
  const saved = savedSlugs.has(slug)
  const navigate = useNavigate()
  const articleIndex = articles.findIndex((item) => item.slug === slug)
  const otherArticles = articles.filter((item) => item.slug !== slug)
  const sameCategory = otherArticles.filter((item) => item.category === article?.category)
  const related = [...sameCategory, ...otherArticles.filter((item) => item.category !== article?.category)].slice(0, 2)
  useArticleMetadata(article)

  if (!article) return <main className="not-found page-wrap"><Eyebrow>404 / Nothing here</Eyebrow><h1>This story wandered off.</h1><Link className="text-link" to="/blog">Back to all stories <ArrowRight size={15} /></Link></main>

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      window.location.href = `mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(window.location.href)}`
    }
  }

  function toggleSaved() {
    const updated = new Set(savedSlugs)
    if (updated.has(slug)) updated.delete(slug)
    else updated.add(slug)
    localStorage.setItem('northstar-saved', JSON.stringify([...updated]))
    setSavedSlugs(updated)
  }

  return (
    <>
      <main className="article-page">
        <div className="article-top page-wrap"><Link to="/blog" className="back-link"><ArrowLeft size={15} /> All stories</Link><span className="article-top-label">Northstar Journal&nbsp; / &nbsp;{article.category}</span></div>
        <header className="article-header page-wrap">
          <Eyebrow>{article.category}</Eyebrow>
          <h1>{article.title}</h1>
          <p>{article.excerpt}</p>
          <div className="article-author-row"><div className="author-avatar">{article.author.split(' ').map((part) => part[0]).join('')}</div><div className="author-detail"><strong>{article.author}</strong><span>Northstar contributor</span></div><span className="author-divider" /><span className="article-date">{formatDate(article.date)}</span><span className="article-read"><Clock3 size={14} />{article.read}</span></div>
        </header>
        <div className="article-cover page-wrap"><img src={article.image} alt="" /></div>
        <div className="article-content-wrap page-wrap">
          <aside className="article-sidebar"><span className="sidebar-label">In this story</span><a href="#article-start">Introduction</a>{article.body.split('\n').filter((line) => line.startsWith('## ')).map((line) => <a key={line} href={`#${line.slice(3).toLowerCase().replaceAll(' ', '-')}`}>{line.slice(3)}</a>)}<span className="sidebar-separator" /><button onClick={share}><Share2 size={15} />{copied ? 'Link copied' : 'Share story'}</button><button onClick={toggleSaved}><Bookmark size={15} />{saved ? 'Saved for later' : 'Save for later'}</button></aside>
          <article className="article-body" id="article-start">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ h2: ({ children, ...props }) => <h2 id={String(children).toLowerCase().replaceAll(' ', '-')} {...props}>{children}</h2>, a: ArticleLink }}>{article.body}</ReactMarkdown>
            <div className="article-endmark">✳</div>
            <div className="article-share-bottom"><span>Enjoyed this perspective?</span><button className="text-link" onClick={share}><Share2 size={15} />{copied ? 'Link copied' : 'Share this story'}</button></div>
          </article>
        </div>
        <div className="article-pagination page-wrap">
          {articleIndex > 0 ? <button onClick={() => navigate(`/blog/${articles[articleIndex - 1].slug}`)}><ArrowLeft size={17} /><span><small>Previous story</small>{articles[articleIndex - 1].title}</span></button> : <span />}
          {articleIndex < articles.length - 1 && <button className="next-story" onClick={() => navigate(`/blog/${articles[articleIndex + 1].slug}`)}><span><small>Up next</small>{articles[articleIndex + 1].title}</span><ArrowRight size={17} /></button>}
        </div>
      </main>
      {related.length > 0 && <section className="related-section page-wrap"><div className="section-heading"><Eyebrow>Keep exploring</Eyebrow><span className="section-rule" /><span className="section-note">More from {article.category}</span></div><div className="latest-grid">{related.map((item, index) => <ArticleCard key={item.slug} article={item} index={index} />)}</div></section>}
      <Footer />
    </>
  )
}

function AppLayout() {
  const [liveArticles, setLiveArticles] = useState(articles)
  const [liveCategories, setLiveCategories] = useState(categories)
  const [previewMode, setPreviewMode] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const livePageRef = useRef(1)
  const moreLoadingRef = useRef(false)
  const location = useLocation()

  useEffect(() => {
    let active = true
    Promise.all([
      fetch('/api/posts?limit=50&page=1').then(async (response) => {
        if (!response.ok) throw new Error(`Blog API returned ${response.status}`)
        return response.json()
      }),
      fetch('/api/categories').then(async (response) => {
        if (!response.ok) throw new Error(`Category API returned ${response.status}`)
        return response.json()
      }),
    ])
      .then(([{ posts = [], pages = 1 }, { categories: availableCategories = [] }]) => {
        if (!active) return
        if (availableCategories.length) setLiveCategories(['All stories', ...availableCategories.map((category) => category.name)])
        if (!posts.length) return
        setLiveArticles(posts.map(normalizePost))
        livePageRef.current = 1
        setHasMore(pages > 1)
        setPreviewMode(false)
      })
      .catch(() => {
        if (active) setPreviewMode(true)
      })
    return () => { active = false }
  }, [])

  async function loadMore() {
    if (previewMode || moreLoadingRef.current || !hasMore) return
    moreLoadingRef.current = true
    setLoadingMore(true)
    try {
      const nextPage = livePageRef.current + 1
      const response = await fetch(`/api/posts?limit=50&page=${nextPage}`)
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || `Blog API returned ${response.status}`)
      setLiveArticles((current) => [...current, ...(result.posts || []).map(normalizePost)])
      livePageRef.current = nextPage
      setHasMore(nextPage < (result.pages || 1))
    } finally {
      moreLoadingRef.current = false
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    const verification = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION
    if (verification && !document.querySelector('meta[name="google-site-verification"]')) {
      const meta = document.createElement('meta')
      meta.name = 'google-site-verification'
      meta.content = verification
      document.head.append(meta)
    }
    const measurementId = import.meta.env.VITE_GA_ID
    if (!measurementId) return
    if (!document.getElementById('northstar-google-analytics')) {
      const script = document.createElement('script')
      script.id = 'northstar-google-analytics'
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
      document.head.append(script)
      window.dataLayer = window.dataLayer || []
      window.gtag = function gtag() { window.dataLayer.push(arguments) }
      window.gtag('js', new Date())
    }
    window.gtag('config', measurementId, { page_path: `${location.pathname}${location.search}` })
  }, [location.pathname, location.search])

  return (
    <>
      <Header />
      <CategoryContext.Provider value={liveCategories}>
        <BlogContext.Provider value={{ articles: previewMode ? sampleArticles : liveArticles, hasMore: !previewMode && hasMore, loadingMore, loadMore }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/blog" element={<ListingPage />} />
            <Route path="/blog/:slug" element={<ArticlePage />} />
            <Route path="/admin/*" element={<Admin />} />
          </Routes>
        </BlogContext.Provider>
      </CategoryContext.Provider>
    </>
  )
}

const sampleArticles = articles

export default function App() {
  return <BrowserRouter><AppLayout /></BrowserRouter>
}
