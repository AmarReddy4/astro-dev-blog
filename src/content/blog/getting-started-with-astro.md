---
title: "Getting Started with Astro 4"
description: "Why Astro 4 is a compelling choice for content-driven sites, and how its island architecture changes the way you think about frontend performance."
pubDate: 2024-09-07
tags: ["astro", "web", "frontend"]
draft: false
---

Astro has been on my radar since v1, but version 4 is where everything clicked. The combination of content collections, view transitions, and the island architecture makes it one of the best tools for building content-heavy sites.

## Why Astro?

Most frameworks ship JavaScript whether you need it or not. Astro flips the default: **zero client-side JS** unless you explicitly opt in. For a blog or docs site, this means near-instant page loads with no hydration overhead.

The key ideas:

- **Islands architecture** — Interactive components hydrate independently. The rest of the page is static HTML.
- **Content collections** — Type-safe Markdown/MDX with Zod schemas. No more runtime surprises from malformed frontmatter.
- **Framework agnostic** — Use React, Svelte, Vue, or nothing at all. Mix and match per component.

## Content Collections in Practice

Astro 4 refined content collections with better type inference and validation. Here's how a typical blog schema looks:

```typescript
import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

The `z.coerce.date()` call is particularly nice — it handles both `Date` objects and date strings from YAML frontmatter. If a post has invalid frontmatter, you get a clear build-time error instead of a broken page in production.

Querying posts is straightforward:

```typescript
import { getCollection } from "astro:content";

const posts = await getCollection("blog", ({ data }) => !data.draft);
```

The filter callback runs at build time, so draft posts never end up in your output directory.

## View Transitions

Astro 4 ships with built-in view transitions powered by the browser's View Transitions API, with a fallback for browsers that don't support it yet. Adding it is a single line:

```astro
---
import { ViewTransitions } from "astro:transitions";
---

<head>
  <ViewTransitions />
</head>
```

The result feels like a SPA — smooth page transitions without a full-page reload — but you keep the benefits of MPA architecture: smaller bundles, simpler mental model, standard browser behavior for links and forms.

## Performance Baseline

Out of the box, a basic Astro 4 blog scores 100 on Lighthouse across all categories. That's not marketing — it's a natural consequence of shipping no JavaScript by default. The HTML is clean, images can be optimized with the built-in `<Image />` component, and there's nothing to block the critical rendering path.

## When Not to Use Astro

Astro is purpose-built for content sites. If you're building a highly interactive dashboard or a real-time collaboration tool, you'd be fighting the framework. Reach for Next.js, SvelteKit, or a dedicated SPA framework instead.

But for blogs, documentation, marketing sites, and portfolios — Astro 4 is hard to beat.
