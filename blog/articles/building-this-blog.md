# a page made out of plain files

This blog does not need a build step, database, or publishing dashboard. The article you are reading is a Markdown file, while its title, date, thumbnail, and visual settings live in one small JSON index.

::: note Why split the content and metadata?
The article stays pleasant to write, and the article list does not have to download every post just to show its title.
:::

## what changed from the old reader

The original page had a lot of personality, so the useful parts remain: a full-screen backdrop, one focused reading surface, and instant article switching. The navigation is now a visible list with thumbnails and real dates.

- article requests can be cancelled when another post is selected
- broken or missing files produce a readable error state
- browser back and forward buttons select the right article
- Markdown is escaped before formatting is applied
- mobile keeps the entire article list within reach

## publishing another post

Create `articles/my-post.md`, then add its metadata to `articles/index.json`:

```json
{
  "slug": "my-post",
  "title": "my post",
  "date": "2026-10-01",
  "summary": "One sentence shown beneath the title.",
  "thumbnail": "/assets/images/example.webp",
  "accent": "#9fdcff",
  "font": "chirp",
  "width": "46rem"
}
```

The list sorts itself by date, newest first. Its link becomes `/blog#my-post`, and no other file needs to change.

> Static should still feel alive. It just should not need babysitting.
