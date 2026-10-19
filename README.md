# nikefn.github.io

Personal site of Niklas Effenberger, built with Jekyll on GitHub Pages. Based on the [Indigo theme](https://github.com/sergiokopplin/indigo) by Sérgio Kopplin (MIT).

Every push to `gh-pages` publishes the site. Work on another branch and merge when ready.

## Layout

Content (text and media):

| Path | What |
|---|---|
| `_posts/` | All posts, one Markdown file each |
| `about.md` | About page |
| `assets/images/<topic>/` | Images and PDFs used by posts |
| `assets/chiptunes/` | Tracker files for the chiptunes post |
| `_data/chiptunes.yml` | Chiptunes playlist (file and title) |

Code and configuration:

| Path | What |
|---|---|
| `_config.yml` | Site settings, navigation, social links, front matter defaults |
| `_layouts/` | `default` (HTML shell), `page` (header, nav, footer), `post` |
| `_includes/` | Page parts; `post-list.html` renders one category; `widgets/` holds the globe and chiptune player markup |
| `_sass/` | Styles. `_includes/style.scss` and `style-dark.scss` set colours and import `_sass/site.scss` |
| `assets/js/` | `ascii-globe.js`, `chiptune-player.js`; `chiptune/` is the vendored [chiptune3](https://github.com/DrSnuggles/chiptune) and [libopenmpt](https://lib.openmpt.org/libopenmpt/) worklet, with two small local fixes marked "local patch" |
| `index.html`, `blog.html`, `projects.html`, `creative.html`, `tags.html`, `404.html` | Index pages |

Posts contain no CSS or JavaScript. Interactive parts are includes in `_includes/widgets/`.

## Posts

File name: `_posts/YYYY-MM-DD-slug.markdown`, with the same date as the front matter.

```yaml
---
title: "Title"
date: 2026-01-31 18:00
category: blog            # blog | projects | creative: the list the post appears in
tags: [research]
description: "One sentence for search results and link previews"
image: /assets/images/topic/header.jpg   # preview image
headerImage: true         # optional: also show the image above the title
permalink: /slug
---
```

Layout and author are set for all posts in `_config.yml`. Use root-relative paths (`/assets/...`) for images and `{{ site.url }}/slug` for links to other posts.

A post with a future date is left out of the build. It appears with the first push after that date, since GitHub Pages only builds on push.

## Run locally

```bash
bundle config set --local path vendor/bundle
bundle install
bundle exec jekyll serve
```

Or `docker compose up`. The site runs at http://localhost:4000.
