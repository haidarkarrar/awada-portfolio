import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { about, logo, previewMedia, sections, splashArtwork } from './data.js';
import './styles.css';

const emailAddress = 'awadaali104@gmail.com';
const whatsappUrl = 'https://wa.me/96181871609';

function Icon({ name, size = 23, fill = 'none' }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill, stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  if (name === 'mail') return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="m4 7 8 6 8-6" /></svg>;
  if (name === 'whatsapp') return <svg {...props}><path d="M20 11.5a8.4 8.4 0 0 1-12.4 7.4L4 20l1.1-3.4A8.4 8.4 0 1 1 20 11.5Z" /><path d="M9 8.5c.2-.5.5-.6.8-.6h.5c.2 0 .4.1.5.5l.7 1.7c.1.3.1.5-.1.7l-.5.6c-.2.2-.2.4 0 .7.3.5.8 1.1 1.4 1.6.7.6 1.4 1 1.8 1.1.3.1.5.1.7-.2l.7-.9c.2-.2.4-.3.7-.2l1.6.8c.3.1.4.3.4.5 0 .2-.2 1-.7 1.4-.5.5-1.2.7-1.8.7s-1.8-.3-3-.9c-1.3-.6-2.6-1.7-3.6-3-1-1.2-1.6-2.5-1.7-3.4-.1-.9.2-1.5.5-1.9.4-.4.8-.5 1.1-.5Z" /></svg>;
  if (name === 'heart') return <svg {...props}><path d="M20.8 8.8c0 4.5-8.8 10.2-8.8 10.2S3.2 13.3 3.2 8.8A4.4 4.4 0 0 1 12 7.2a4.4 4.4 0 0 1 8.8 1.6Z" /></svg>;
  if (name === 'comment') return <svg {...props}><path d="M20 11.4a7.7 7.7 0 0 1-8 7.4 8.7 8.7 0 0 1-3.7-.8L4 19l1.1-3.5a7 7 0 0 1-1.1-3.8A7.7 7.7 0 0 1 12 4a7.7 7.7 0 0 1 8 7.4Z" /><path d="M8.4 11.6h.1m3.5 0h.1m3.5 0h.1" strokeWidth="3" /></svg>;
  if (name === 'share') return <svg {...props}><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" /><path d="M5 13.5v4A1.5 1.5 0 0 0 6.5 19h11a1.5 1.5 0 0 0 1.5-1.5v-4" /></svg>;
  if (name === 'close') return <svg {...props}><path d="m6 6 12 12M18 6 6 18" /></svg>;
  if (name === 'play') return <svg {...props} fill="currentColor" stroke="none"><path d="m8 5 11 7-11 7V5Z" /></svg>;
  return null;
}

function getVisitorId() {
  const key = 'aliawada-visitor';
  try {
    let id = localStorage.getItem(key);
    if (!id) {
      id = globalThis.crypto?.randomUUID?.() || `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return 'visitor-session';
  }
}

function readLocalCommunity(id, visitorId) {
  try {
    const saved = JSON.parse(localStorage.getItem(`aliawada-community:${id}`) || '{"liked":false,"comments":[]}');
    return { likeCount: Number(saved.likeCount || 0), liked: Boolean(saved.liked), comments: Array.isArray(saved.comments) ? saved.comments : [] };
  } catch {
    return { likeCount: 0, liked: false, comments: [] };
  }
}

function saveLocalCommunity(id, record) {
  try {
    localStorage.setItem(`aliawada-community:${id}`, JSON.stringify(record));
  } catch {
    // Local-only fallback is optional when storage is unavailable.
  }
}

function SectionLink({ section, className = '' }) {
  return <a className={className} href={`/${section.slug}`}>{section.title}</a>;
}

function Header({ active }) {
  return (
    <header className="site-header">
      <nav className="primary-nav" aria-label="Main navigation">
        <a className={active === 'welcome' ? 'active' : ''} href="/welcome">Welcome</a>
        <a className={active === 'work' ? 'active' : ''} href="/work">Work</a>
        <a className={active === 'about-me' ? 'active' : ''} href="/about-me">About me</a>
        <a className={active === 'contact' ? 'active' : ''} href="/contact">Contact</a>
      </nav>
      <a className="site-brand" href="/work" aria-label="Ali Awada home"><img src={logo} alt="Ali Awada" /></a>
      <div className="header-social" aria-label="Contact links">
        <a href={`mailto:${emailAddress}`} aria-label="Email Ali"><Icon name="mail" size={19} /></a>
        <a href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="WhatsApp Ali"><Icon name="whatsapp" size={20} /></a>
      </div>
    </header>
  );
}

function Footer({ preview }) {
  return (
    <footer className="site-footer">
      <div className="footer-social">
        <a href={`mailto:${emailAddress}`} aria-label="Email Ali"><Icon name="mail" size={17} /></a>
        <a href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="WhatsApp Ali"><Icon name="whatsapp" size={19} /></a>
      </div>
      {preview && <p className="preview-note">Preview media · Google Drive will sync when connected</p>}
    </footer>
  );
}

function Splash() {
  return (
    <main className="splash-page" style={{ '--splash-artwork': `url("${splashArtwork}")` }}>
      <div className="splash-content">
        <p>I am a graphic designer with a passion for transforming ideas into visually compelling designs and creative content. Proficient in Adobe After Effects, Premiere Pro, Photoshop, and Illustrator, I combine artistic vision with technical precision to deliver high-quality, impactful work. My goal is to create unique designs and engaging videos that effectively communicate the intended message with a professional and creative touch.</p>
        <a className="continue-button" href="/work">Continue</a>
      </div>
    </main>
  );
}

function WorkPage({ mediaSections, preview }) {
  return (
    <>
      <Header active="work" />
      <main className="work-grid" aria-label="Selected work">
        {sections.map((section) => {
          const sectionItems = mediaSections[section.slug] || [];
          const coverItem = sectionItems.find((item) => item.type === 'image' && (item.thumbnailUrl || item.contentUrl || item.previewUrl))
            || sectionItems.find((item) => item.thumbnailUrl || item.previewUrl);
          const cover = preview ? section.cover : coverItem?.thumbnailUrl || coverItem?.contentUrl || coverItem?.previewUrl || section.cover;
          return (
            <a className="project-tile" href={`/${section.slug}`} key={section.slug} aria-label={`${section.year} ${section.title}`}>
              <img src={cover} alt="" loading="lazy" />
            </a>
          );
        })}
      </main>
      <Footer preview={preview} />
    </>
  );
}

function AboutPage({ preview }) {
  return (
    <>
      <Header active="about-me" />
      <main className="text-page about-page">
        <h1>About me</h1>
        <div className="about-intro">
          {about.intro.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
        <section className="resume-section">
          <h2>Experience</h2>
          <div className="experience-list">
            {about.experience.map((job) => (
              <article className="experience-item" key={`${job.company}-${job.role}`}>
                <div className="experience-heading">
                  <h3>{job.role} <span>— {job.company}</span></h3>
                  <time>{job.date}</time>
                </div>
                {job.description && <p>{job.description}</p>}
              </article>
            ))}
          </div>
        </section>
        <section className="resume-section skills-section">
          <h2>Skills</h2>
          <ul>
            {about.skills.map(([label, skills]) => <li key={label}><strong>{label}:</strong> {skills}</li>)}
          </ul>
        </section>
      </main>
      <Footer preview={preview} />
    </>
  );
}

function ContactPage({ preview }) {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const update = (event) => setForm((value) => ({ ...value, [event.target.name]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    const subject = encodeURIComponent(`Portfolio enquiry from ${form.name}`);
    const body = encodeURIComponent(`${form.message}\n\nFrom: ${form.name}\nEmail: ${form.email}`);
    window.location.href = `mailto:${emailAddress}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <>
      <Header active="contact" />
      <main className="text-page contact-page">
        <h1>Contact</h1>
        <p className="contact-intro">Let’s create something extraordinary together.</p>
        <form className="contact-form" onSubmit={submit}>
          <label>Name <span>*</span><input name="name" value={form.name} onChange={update} required autoComplete="name" /></label>
          <label>Email Address <span>*</span><input type="email" name="email" value={form.email} onChange={update} required autoComplete="email" /></label>
          <label>Message <span>*</span><textarea name="message" rows="6" value={form.message} onChange={update} required /></label>
          <button className="submit-button" type="submit">Submit</button>
          {sent && <p className="form-hint">Your email app should open with the message ready to send.</p>}
        </form>
        <div className="contact-details">
          <a href={`mailto:${emailAddress}`}>{emailAddress}</a>
          <a href={whatsappUrl} target="_blank" rel="noreferrer">WhatsApp</a>
        </div>
      </main>
      <Footer preview={preview} />
    </>
  );
}

function defaultRecord(id, visitorId) {
  return readLocalCommunity(id, visitorId);
}

function ShareButton({ item, onToast }) {
  const share = async () => {
    const url = new URL(window.location.href);
    url.hash = item.id;
    const payload = { title: item.name || 'Ali Awada Portfolio', text: item.name || 'Take a look at this work.', url: url.toString() };
    try {
      if (navigator.share) await navigator.share(payload);
      else {
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(payload.url);
        else {
          const temporary = document.createElement('textarea');
          temporary.value = payload.url;
          temporary.style.position = 'fixed';
          temporary.style.opacity = '0';
          document.body.append(temporary);
          temporary.select();
          document.execCommand('copy');
          temporary.remove();
        }
        onToast('Link copied');
      }
    } catch (error) {
      if (error.name !== 'AbortError') onToast('Could not share this link');
    }
  };
  return <button className="action-button" onClick={share} aria-label={`Share ${item.name}`}><Icon name="share" /><span>Share</span></button>;
}

function CommentPanel({ item, record, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    if (!text.trim()) return;
    try {
      await onSubmit(item.id, name.trim() || 'Guest', text.trim());
      setText('');
      setError('');
    } catch (reason) {
      setError(reason.message || 'Your comment could not be saved.');
    }
  };

  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="comments-panel" role="dialog" aria-modal="true" aria-label={`Comments on ${item.name}`}>
        <div className="panel-heading"><div><span className="eyebrow">Community</span><h2>Comments <span>({record.comments.length})</span></h2></div><button className="icon-button" onClick={onClose} aria-label="Close comments"><Icon name="close" /></button></div>
        <div className="comment-list">
          {record.comments.length === 0 ? <p className="empty-comments">Be the first to leave a comment.</p> : record.comments.map((comment) => (
            <article className="comment-item" key={comment.id}>
              <div className="comment-avatar">{(comment.name || 'G').slice(0, 1).toUpperCase()}</div>
              <div><strong>{comment.name || 'Guest'}</strong><p>{comment.text}</p><time>{formatDate(comment.createdAt)}</time></div>
            </article>
          ))}
        </div>
        <form className="comment-form" onSubmit={submit}>
          <label className="visually-hidden" htmlFor="comment-name">Name</label>
          <input id="comment-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" maxLength={50} />
          <label className="visually-hidden" htmlFor="comment-text">Write a comment</label>
          <textarea id="comment-text" value={text} onChange={(event) => setText(event.target.value)} placeholder="Add a comment…" rows={3} maxLength={1000} required />
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="submit-button">Post comment</button>
        </form>
      </section>
    </div>
  );
}

function formatDate(value) {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function autoplayEmbedUrl(value, autoplay = true) {
  try {
    const url = new URL(value);
    url.searchParams.set('autoplay', String(autoplay));
    url.searchParams.set('muted', 'true');
    url.searchParams.set('lazyLoading', 'false');
    return url.toString();
  } catch {
    return value;
  }
}

function CommunityActions({ item, record, onLike, onComment, onToast, compact = false }) {
  return (
    <div className={`community-actions ${compact ? 'compact' : ''}`}>
      <button className={`action-button like-button ${record.liked ? 'is-liked' : ''}`} onClick={() => onLike(item.id)} aria-pressed={record.liked} aria-label={record.liked ? 'Unlike' : 'Like'}>
        <Icon name="heart" fill={record.liked ? 'currentColor' : 'none'} /><span>{record.likeCount}</span>
      </button>
      <button className="action-button" onClick={() => onComment(item)} aria-label="Open comments"><Icon name="comment" /><span>{record.comments.length}</span></button>
      <ShareButton item={item} onToast={onToast} />
    </div>
  );
}

function LazyPlayer({ item, mode, preloadStage = 0 }) {
  const [preloadStarted, setPreloadStarted] = useState(false);
  const [preloadedToFiveSeconds, setPreloadedToFiveSeconds] = useState(false);

  useEffect(() => {
    if (mode === 'idle') {
      setPreloadStarted(false);
      setPreloadedToFiveSeconds(false);
      return;
    }
    if (mode === 'active') {
      setPreloadStarted(false);
      return;
    }

    const delay = Math.max(0, (preloadStage - 1) * 350);
    const timeout = window.setTimeout(() => setPreloadStarted(true), delay);
    return () => window.clearTimeout(timeout);
  }, [item.id, mode, preloadStage]);

  const poster = item.thumbnailUrl || item.previewUrl || item.contentUrl;
  const shouldLoadPlayer = mode === 'active' || mode === 'preload' && preloadStarted;
  const videoPreload = mode === 'active' || !preloadedToFiveSeconds ? 'auto' : 'metadata';
  const limitPreload = (event) => {
    if (mode !== 'preload' || preloadedToFiveSeconds) return;
    const buffered = event.currentTarget.buffered;
    if (buffered.length && buffered.start(0) <= 0.25 && buffered.end(0) >= 5) setPreloadedToFiveSeconds(true);
  };

  return (
    <div className="reel-media">
      {shouldLoadPlayer ? (
        item.embedUrl ? <iframe src={autoplayEmbedUrl(item.embedUrl, mode === 'active')} title={item.name} allow="autoplay; fullscreen; encrypted-media; picture-in-picture" loading="eager" />
          : item.type === 'video' ? <video src={item.contentUrl} poster={poster} autoPlay={mode === 'active'} muted loop={mode === 'active'} controls={mode === 'active'} playsInline preload={videoPreload} onProgress={mode === 'preload' ? limitPreload : undefined} />
            : <img src={item.contentUrl || poster} alt={item.name || 'Portfolio work'} />
      ) : (
        <div className="reel-placeholder" style={poster ? { backgroundImage: `url("${poster}")` } : undefined}>
          <span className="reel-loading-mark"><Icon name="play" size={22} /></span>
        </div>
      )}
    </div>
  );
}

function ReelFeed({ section, items, community, actions, preview }) {
  const rootRef = useRef(null);
  const slideRefs = useRef([]);
  const orderedItems = useMemo(() => preview ? (previewMedia[section.slug] || []) : items, [items, preview, section.slug]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const targetId = decodeURIComponent(window.location.hash.slice(1));
    const targetIndex = orderedItems.findIndex((item) => item.id === targetId);
    if (targetIndex < 0) return;
    setActiveIndex(targetIndex);
    const targetFrame = window.requestAnimationFrame(() => slideRefs.current[targetIndex]?.scrollIntoView({ block: 'start' }));
    return () => window.cancelAnimationFrame(targetFrame);
  }, [orderedItems]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let frame = 0;
    const updateActiveIndex = () => {
      frame = 0;
      const feedRect = root.getBoundingClientRect();
      const center = feedRect.top + root.clientHeight / 2;
      let closestIndex = 0;
      let closestDistance = Infinity;
      slideRefs.current.slice(0, orderedItems.length).forEach((slide, index) => {
        if (!slide) return;
        const rect = slide.getBoundingClientRect();
        const distance = Math.abs((rect.top + rect.bottom) / 2 - center);
        if (distance < closestDistance) {
          closestIndex = index;
          closestDistance = distance;
        }
      });
      setActiveIndex((current) => current === closestIndex ? current : closestIndex);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateActiveIndex);
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    updateActiveIndex();
    return () => {
      root.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [orderedItems]);

  return (
    <div className="reel-feed" ref={rootRef} aria-label={`${section.title} video feed`}>
      {orderedItems.map((item, index) => {
        const record = community[item.id] || { likeCount: 0, liked: false, comments: [] };
        const ahead = index - activeIndex;
        const mode = ahead === 0 ? 'active' : ahead > 0 && ahead <= 3 ? 'preload' : 'idle';
        return (
          <article className="reel-slide" key={item.id} id={item.id} ref={(node) => { slideRefs.current[index] = node; }}>
            <div className="reel-frame">
              <LazyPlayer item={item} mode={mode} preloadStage={ahead} />
              <div className="reel-caption"><span>{item.name || section.title}</span><small>{String(index + 1).padStart(2, '0')} / {String(orderedItems.length).padStart(2, '0')}</small></div>
              <CommunityActions item={item} record={record} {...actions} />
            </div>
          </article>
        );
      })}
      {orderedItems.length === 0 && <div className="media-empty">No media in this section yet.</div>}
    </div>
  );
}

function Lightbox({ item, record, onClose, actions }) {
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="lightbox" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <button className="lightbox-close icon-button" onClick={onClose} aria-label="Close artwork"><Icon name="close" /></button>
      <div className="lightbox-art">{item.type === 'video' ? <video src={item.contentUrl} poster={item.thumbnailUrl || item.previewUrl} controls playsInline /> : <img src={item.contentUrl || item.thumbnailUrl || item.previewUrl} alt={item.name || 'Portfolio artwork'} />}</div>
      <aside className="lightbox-info"><span className="eyebrow">Selected work</span><h2>{item.name}</h2><CommunityActions item={item} record={record} compact {...actions} /></aside>
    </div>
  );
}

function GalleryPage({ section, items, community, actions, preview }) {
  const [selected, setSelected] = useState(null);
  const galleryItems = preview ? (previewMedia[section.slug] || []) : items;

  useEffect(() => {
    const targetId = decodeURIComponent(window.location.hash.slice(1));
    const target = galleryItems.find((item) => item.id === targetId);
    if (target) setSelected(target);
  }, [galleryItems]);

  const closeLightbox = () => {
    setSelected(null);
    if (window.location.hash) history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  };

  return (
    <>
      <main className="gallery-page">
        <div className="gallery-grid">
          {galleryItems.map((item, index) => {
            const record = community[item.id] || { likeCount: 0, liked: false, comments: [] };
            return (
              <button className="gallery-item" key={item.id} onClick={() => setSelected(item)} aria-label={`Open ${item.name || section.title}`}>
                {item.type === 'video'
                  ? <video src={item.contentUrl} poster={item.thumbnailUrl || item.previewUrl} muted playsInline preload="metadata" />
                  : <img src={item.thumbnailUrl || item.contentUrl || item.previewUrl} alt={item.name || `${section.title} ${index + 1}`} loading="lazy" />}
                <span className="gallery-overlay"><strong>{item.name || section.title}</strong><span className="gallery-count"><Icon name="heart" size={16} /> {record.likeCount}</span></span>
              </button>
            );
          })}
          {galleryItems.length === 0 && <p className="media-empty">No images in this section yet.</p>}
        </div>
      </main>
      {selected && <Lightbox item={selected} record={community[selected.id] || { likeCount: 0, liked: false, comments: [] }} onClose={closeLightbox} actions={actions} />}
    </>
  );
}

function SectionPage({ section, items, community, actions, preview }) {
  const date = section.year;
  const related = sections.filter((item) => item.slug !== section.slug).slice(0, 4);
  return (
    <>
      {section.kind === 'reels' ? (
        <>
          <Header />
          <main className="reel-page">
            <div className="reel-heading"><span>{section.title}</span><time>{date}</time></div>
            <ReelFeed section={section} items={items} community={community} actions={actions} preview={preview} />
          </main>
          <nav className="related-links" aria-label="More work"><span>You may also like</span>{related.map((item) => <SectionLink key={item.slug} section={item} />)}</nav>
          <Footer preview={preview} />
        </>
      ) : (
        <>
          <Header />
          <div className="gallery-heading"><span>{section.title}</span><time>{date}</time></div>
          <GalleryPage section={section} items={items} community={community} actions={actions} preview={preview} />
          <nav className="related-links" aria-label="More work"><span>You may also like</span>{related.map((item) => <SectionLink key={item.slug} section={item} />)}</nav>
          <Footer preview={preview} />
        </>
      )}
    </>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return <div className="toast" role="status">{message}</div>;
}

function App() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const [mediaSections, setMediaSections] = useState(previewMedia);
  const [preview, setPreview] = useState(true);
  const [community, setCommunity] = useState({});
  const [commentTarget, setCommentTarget] = useState(null);
  const [toast, setToast] = useState('');
  const visitorId = useMemo(getVisitorId, []);
  const allItems = useMemo(() => Object.values(mediaSections).flat(), [mediaSections]);

  const refreshMedia = useCallback(async (signal) => {
    try {
      const response = await fetch('/api/media', { signal, cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      if (data.configured && !data.error) {
        setMediaSections((current) => Object.fromEntries(sections.map((section) => [section.slug, data.sections?.[section.slug] || current[section.slug] || []])));
        setPreview(false);
      }
    } catch {
      // The reference preview remains available if the API has not been started.
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    refreshMedia(controller.signal);
    const interval = window.setInterval(() => refreshMedia(), 60_000);
    return () => { controller.abort(); window.clearInterval(interval); };
  }, [refreshMedia]);

  useEffect(() => {
    if (!allItems.length) return;
    let cancelled = false;
    const local = Object.fromEntries(allItems.map((item) => [item.id, defaultRecord(item.id, visitorId)]));
    setCommunity((current) => ({ ...local, ...current }));
    const ids = [...new Set(allItems.map((item) => item.id))];
    const batches = [];
    for (let index = 0; index < ids.length; index += 200) batches.push(ids.slice(index, index + 200));
    Promise.all(batches.map((batch) => fetch('/api/community/bulk', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ids: batch, viewerId: visitorId }),
      cache: 'no-store',
    }).then((response) => response.ok ? response.json() : null).catch(() => null)))
      .then((responses) => {
        if (cancelled) return;
        const records = Object.assign({}, ...responses.map((data) => data?.records || {}));
        if (Object.keys(records).length) setCommunity((current) => ({ ...current, ...records }));
      });
    return () => { cancelled = true; };
  }, [allItems, visitorId]);

  const showToast = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  }, []);

  const like = useCallback(async (id) => {
    const current = community[id] || defaultRecord(id, visitorId);
    const next = { ...current, liked: !current.liked, likeCount: Math.max(0, current.likeCount + (current.liked ? -1 : 1)) };
    setCommunity((records) => ({ ...records, [id]: next }));
    saveLocalCommunity(id, next);
    try {
      const response = await fetch(`/api/community/${encodeURIComponent(id)}/likes`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ visitorId, liked: next.liked }),
      });
      if (!response.ok) throw new Error('Like service unavailable');
      const data = await response.json();
      setCommunity((records) => ({ ...records, [id]: data.record }));
      saveLocalCommunity(id, data.record);
    } catch {
      showToast('Like saved on this device');
    }
  }, [community, visitorId, showToast]);

  const addComment = useCallback(async (id, name, text) => {
    try {
      const response = await fetch(`/api/community/${encodeURIComponent(id)}/comments`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ visitorId, name, text }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Comment service unavailable');
      }
      const data = await response.json();
      setCommunity((records) => ({ ...records, [id]: data.record }));
      saveLocalCommunity(id, data.record);
      return data.record;
    } catch (error) {
      if (error.message !== 'Failed to fetch' && !error.message.includes('service unavailable')) throw error;
      const current = community[id] || defaultRecord(id, visitorId);
      const next = { ...current, comments: [...current.comments, { id: `local-${Date.now()}`, name, text, createdAt: new Date().toISOString() }] };
      setCommunity((records) => ({ ...records, [id]: next }));
      saveLocalCommunity(id, next);
      showToast('Comment saved on this device');
      return next;
    }
  }, [community, visitorId, showToast]);

  const actions = { onLike: like, onComment: setCommentTarget, onToast: showToast };
  const section = sections.find((item) => `/${item.slug}` === path);
  const content = path === '/' || path === '/welcome'
    ? <Splash />
    : path === '/work' || !section && !['/about-me', '/contact'].includes(path)
      ? <WorkPage mediaSections={mediaSections} preview={preview} />
      : path === '/about-me'
        ? <AboutPage preview={preview} />
        : path === '/contact'
          ? <ContactPage preview={preview} />
          : <SectionPage section={section} items={mediaSections[section.slug] || []} community={community} actions={actions} preview={preview} />;

  return (
    <>
      {content}
      {commentTarget && <CommentPanel item={commentTarget} record={community[commentTarget.id] || defaultRecord(commentTarget.id, visitorId)} onClose={() => setCommentTarget(null)} onSubmit={addComment} />}
      <Toast message={toast} />
    </>
  );
}

const rootElement = document.getElementById('root');
const appRoot = import.meta.hot?.data.appRoot || createRoot(rootElement);
if (import.meta.hot) import.meta.hot.data.appRoot = appRoot;
appRoot.render(<React.StrictMode><App /></React.StrictMode>);
