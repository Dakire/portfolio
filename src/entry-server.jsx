import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import App from './App.jsx';
import LegalPage from './components/LegalPage.jsx';
import NotFound from './components/NotFound.jsx';
import { BlogIndex, BlogPost } from './components/Blog.jsx';

export const render = (lang, posts) => renderToString(<App lang={lang} posts={posts} />);
export const renderLegal = (lang) => renderToStaticMarkup(<LegalPage lang={lang} />);
export const renderBlogIndex = (posts, lang) => renderToStaticMarkup(<BlogIndex posts={posts} lang={lang} />);
export const renderBlogPost = (post, related, lang) => renderToStaticMarkup(<BlogPost post={post} related={related} lang={lang} />);
export const renderNotFound = () => renderToStaticMarkup(<NotFound />);
