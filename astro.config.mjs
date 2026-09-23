import { defineConfig } from 'astro/config';
import remarkClaims from './src/lib/remark-claims.mjs';

// GitHub Pages: https://<owner>.github.io/<repo>/ — derived from the Actions env so renaming the repo needs no edit.
const [owner, repo] = (process.env.GITHUB_REPOSITORY ?? '0-draft/muscle').split('/');
const isUserSite = repo === `${owner}.github.io`;

export default defineConfig({
  site: `https://${owner}.github.io`,
  base: isUserSite ? '/' : `/${repo}`,
  trailingSlash: 'always',
  markdown: {
    remarkPlugins: [remarkClaims],
  },
});
