# Card Cosmic Webflow CMS Blueprint

This static implementation is structured so it can be recreated in Webflow without changing the content strategy.

## Collections

### Blog Posts
- Name
- Slug
- Category
- Meta Title
- Meta Description
- Featured Image
- Excerpt
- Body
- Related Card Type

### Gift Card Types
- Brand
- Slug
- Card Countries
- Example Rate
- Description
- CTA Label
- CTA URL

### FAQs
- Question
- Answer
- Page Group

### Testimonials
- Name
- Location
- Quote
- Screenshot or Avatar
- Source

### Creator Videos
- Title
- Slug
- Video File or Embed URL
- Poster Image
- Campaign Tag
- CTA URL

### Rate Rows
- Brand
- Region
- Small Value Quote
- Medium Value Quote
- Large Value Quote
- Source Screenshot

### News Sources
- Source Name
- Source URL
- Category
- Editorial Score
- Use Case
- Notes

### Daily News Briefs
- Date
- Title
- Source Links
- Original Summary
- Card Cosmic Analysis
- Tags
- CTA Type
- Review Status

### Opportunity Sources
- Name
- Category
- Example Platforms
- Score
- Risk Notes
- CTA Route

### Campaign Landing Pages
- Channel
- Slug
- Tracking Code
- WhatsApp Prefill Message
- Creator Video
- Featured Rate Card
- Source UTM

## Pages
- Home
- Rates
- How It Works
- Sell Gift Cards in Nigeria
- Blog
- FAQ
- About
- Contact
- App Download
- Creator Promotion Videos
- Nigeria News / Local Updates
- Gift Card Hub
- Guides / Learn
- Campaign landing pages: TikTok, Facebook, Instagram, Creator Essien, Apple Rate Today
- Privacy Policy
- Terms of Service

## Launch Notes
- Replace placeholder testimonials with verified user proof only.
- Confirm WhatsApp number before launch.
- Current WhatsApp target is `+44 7542 487886`.
- Add real MP4 files or hosted embeds to the Creator Videos collection.
- The language selector currently includes English, British English, French, Chinese, and Japanese; create translated pages or locale collections before enabling true multilingual routing.
- Use `data/source-directory.json` as the first source registry for News Sources.
- Use `npm run generate:news` to create a daily editorial draft; connect it to a real RSS/API + AI-summary workflow before production automation.
- Never copy full news articles. Publish short original summaries, source attribution, and Card Cosmic analysis.
- Campaign pages should preserve their tracking code and WhatsApp prefilled message for attribution.
- Review Privacy Policy and Terms with legal counsel.
- Connect `cardcosmic.top` and redirect `www` to the canonical domain.
- Submit `sitemap.xml` in Google Search Console after publishing.
