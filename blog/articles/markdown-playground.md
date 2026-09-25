# formatting reference

This article exists to make changes to the Markdown renderer easy to test. It includes **bold text**, *italic text*, ***both together***, ~~deleted text~~, `inline code`, and a ||small spoiler||.

[Internal links](/) stay in the current tab. [External links](https://example.com) open separately and receive the appropriate safety attributes.

## lists

- unordered item one
- unordered item two with **emphasis**
- unordered item three

1. first ordered item
2. second ordered item
3. third ordered item

## quotes and callouts

> Markdown is useful because the source remains readable before anything renders it.
> This is a second line in the same quote.

::: tip Custom callout title
Callouts use the current article accent color. Start one with `::: tip`, `::: note`, or `::: warning`, and close it with `:::` on its own line.
:::

## a table

| setting | supported values | purpose |
| --- | --- | --- |
| font | inter, gothic, mono | changes article typography |
| width | 40rem, 46rem, 54rem, 62rem | changes the reading measure |
| crop | any CSS object-position | adjusts the list thumbnail |

## code

```javascript
function hello(name) {
  return `hello, ${name}!`;
}

console.log(hello("world"));
```

---

![A wide pixel art city used as an image example.](/assets/images/cityscape.png "cityscape")

Images are lazy-loaded and keep their natural aspect ratio.
