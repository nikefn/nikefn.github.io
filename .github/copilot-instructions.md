## Purpose
Help AI coding agents get productive in this repository: a Jekyll-based personal website (GitHub Pages).

## Big picture
- This is a Jekyll site using GitHub Pages conventions. Content comes from `_posts/`, layouts in `_layouts/`, and reusable fragments in `_includes/`.
- Assets and compiled CSS live in `assets/` and `style.scss` (Sass sources in `_sass/`). Templates use Liquid; pages are rendered by Jekyll before deployment.

## Build & run (explicit)
- Ruby/Gems: run `bundle install` then `bundle exec jekyll serve` to build locally (this repo uses `github-pages` in `Gemfile`).
- Docker: `docker-compose up` starts a Jekyll server (service defined in `docker-compose.yml` exposing port 4000).

## Key files and components
- Posts: `_posts/*.markdown` — filenames are `YYYY-MM-DD-<slug>.markdown`. Example: `_posts/2026-03-09-project_citiverse.markdown` uses front matter keys like `layout`, `date`, `image`, `headerImage`, `projects`, `permalink`.
- Layouts: `_layouts/default.html`, `_layouts/post.html` control page scaffolding and include partials from `_includes/`.
- Includes: `_includes/header.html`, `_includes/footer.html`, `_includes/nav.html` — modify site chrome here.
- Sass: primary entry `style.scss` imports `_sass/` modules. Use the `_sass/components/` and `_sass/base/` structure to add styles.

## Project-specific conventions
- Post front-matter uses `projects: true` for project posts and `headerImage: true` when an image should appear in the post header — follow existing posts for exact keys.
- Image assets are stored under `assets/images/` with subfolders by context (e.g. `proj-work/`, `proj-personal/`). Use those folders when adding images.
- Permalinks: many posts set `permalink:` in front matter; prefer explicit permalinks when adding project pages.

## Plugins & integrations
- Plugins listed in `Gemfile`: `github-pages`, `jekyll-feed`, `jekyll-seo-tag`, `jemoji`. Avoid adding plugins that conflict with GitHub Pages unless you adjust CI/build.
- Integrations: Google Analytics, Disqus, and social links are implemented as includes (`_includes/analytics-google.html`, `_includes/disqus.html`, `_includes/social-links.html`). Update those includes for keys/IDs.

## Editing guidance for AI agents
- Prefer small, focused edits: change include/layout first for global behavior rather than editing many posts.
- When adding a new post, follow an existing post as template (front matter keys and asset paths). Cite an example post when creating new content.
- For CSS changes, add new variables in `_sass/variables.sass` or a component file under `_sass/components/` and import via `style.scss`.

## Examples to reference (use these as patterns)
- Post front matter + structure: `_posts/2026-03-09-project_citiverse.markdown`
- Template hierarchy: `_layouts/default.html` includes `_includes/header.html` and `_includes/footer.html`
- Sass entry: `style.scss` with `_sass/` modules

## What not to change without confirmation
- Do not replace the `github-pages` gem unless you also update CI/build instructions.
- Avoid mass renames in `_includes/` or `_layouts/` — small, reversible commits are preferred.

## Questions for the maintainer (put these in the PR body)
- Preferred local dev workflow (Ruby native vs Docker)?
- Any deployment steps beyond standard GitHub Pages (CI, secrets for Disqus/GA)?

---
If anything above is unclear or you'd like more detail (examples of common edits, PR checklist, or automated checks), tell me which parts to expand.
