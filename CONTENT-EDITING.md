# Card Cosmic Content Editing Guide

## Change Page Images

Most images are controlled in `assets/data.js`.

- Homepage hero image: change `localHeroImage`. It currently points to `素材图片/宣传图片横屏.png`.
- Homepage hero video: change `heroVideo`. It currently points to `（3）宣传视频/智选直连，进阶人生.mp4`.
- App preview image: change `appImage`.
- Video poster images: change the `image` value inside `videoPosters`.
- Uploaded browser screenshots are in `assets/screenshots/`.
- Existing marketing assets are in `素材图片/`.

Example:

```js
localHeroImage: "素材图片/your-new-hero.png"
heroVideo: "（3）宣传视频/your-promo-video.mp4"
```

Put the new image file in `素材图片/` or `assets/screenshots/`, then update the path in `assets/data.js`.

For the homepage hero, replace `素材图片/宣传图片横屏.png` with a new landscape image, or change:

```js
localHeroImage: "素材图片/your-landscape-promo.png"
```

## Change Gift Card Brand Logos

The rate cards use the `rates` array in `assets/data.js`.

```js
{
  brand: "Apple / iTunes",
  logoClass: "apple",
  logoText: "Apple",
  logoUrl: "https://cdn.simpleicons.org/apple/111111",
  intro: "Popular for US and UK Apple gift cards.",
  rates: [["US", "₦1189"], ["UK", "₦1424"], ["EUR", "Ask in app"]]
}
```

- `logoClass` chooses the colour style from `assets/styles.css`.
- `logoUrl` is the actual brand logo image shown in the rate card.
- `logoText` is the fallback short label if the logo image cannot load.
- To add a new brand style, add a CSS rule like `.brand-logo.nike { ... }`.

## Change Promotional Videos

The video preview page and homepage video rail use `videoPosters` in `assets/data.js`.

For image-only preview:

```js
{ title: "Creator trade walkthrough", image: "素材图片/poster.jpg", video: "", tag: "Influencer" }
```

For a real MP4 video:

```js
{ title: "Creator trade walkthrough", image: "素材图片/poster.jpg", video: "素材图片/creator-video.mp4", tag: "Influencer" }
```

Current homepage and Videos page content uses files from the root `滚动视频播放/` folder. Put new `.mp4` or `.MOV` files there, then add each file path to `videoPosters` in `assets/data.js`.

The browser will show video controls automatically when `video` is not empty.

## Update Daily News And Source Scores

The media/news direction is controlled by two files:

- Source registry: `data/source-directory.json`
- Generated daily editorial draft: `data/generated/YYYY-MM-DD.json`

Run:

```sh
npm run generate:news
```

The script creates a daily draft with source attribution, topic notes, evaluation scores and Card Cosmic CTA guidance. This first version is a safe content-pipeline scaffold: it does not copy full articles from news websites. For production, connect RSS/API/search sources, summarize with attribution, add Card Cosmic analysis, then review before publishing.

To add or change sources, edit `data/source-directory.json`:

```json
{
  "name": "Vanguard",
  "url": "https://www.vanguardngr.com",
  "category": "News",
  "score": 86,
  "note": "Established local newsroom with broad national coverage."
}
```

Use the score to communicate editorial confidence, not a legal or financial rating. Keep notes specific: coverage quality, local relevance, update frequency, or conversion usefulness.

## Change Language Text

Language switching is handled in `assets/site.js` inside `translationMaps`.

- `fr` controls French.
- `zh` controls Chinese.
- `ja` controls Japanese.
- `en-GB` can override British English wording.

Add the original English phrase as the key and the translated phrase as the value.
