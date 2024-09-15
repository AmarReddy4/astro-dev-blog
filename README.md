# Dev Blog

A developer blog built with [Astro 4](https://astro.build) and content collections.

## Tech Stack

- **Astro 4** — Static site generator with content collections
- **TypeScript** — Type-safe configuration and schemas
- **Tailwind CSS 3.4** — Utility-first styling with dark theme
- **MDX** — Enhanced Markdown with component support

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── content/
│   ├── config.ts          # Content collection schemas
│   └── blog/              # Markdown blog posts
├── layouts/
│   ├── BaseLayout.astro   # HTML shell with dark theme
│   └── BlogPost.astro     # Post layout with metadata
├── pages/
│   ├── index.astro        # Home page with latest posts
│   ├── blog/
│   │   ├── index.astro    # All posts listing
│   │   └── [slug].astro   # Dynamic post pages
│   └── tags/
│       └── [tag].astro    # Posts filtered by tag
└── components/
    ├── PostCard.astro     # Blog post card component
    └── TagList.astro      # Tag badge component
```

## Writing Posts

Add Markdown files to `src/content/blog/` with the following frontmatter:

```markdown
---
title: "Post Title"
description: "A brief description"
pubDate: 2024-09-15
tags: ["astro", "web"]
draft: false
---

Your content here...
```
