# Card Cosmic Aliyun Deployment Plan

This package is the static website build for `cardcosmic.top`.

## Deployment Package

Upload this file to the Aliyun server or panel:

```text
deploy/cardcosmic-site.zip
```

Package size is large because it includes the promotional videos.

## Recommended Safe Access

Do not share the Aliyun root account password in chat.

Use one of these safer options:

- Create a temporary RAM user with only ECS/OSS/Codeup access needed for deployment.
- Create a temporary SSH key for the ECS server, then delete it after deployment.
- Log in yourself and let Codex provide commands step by step.

## Option A: Baota Panel Upload

1. Log in to Baota.
2. Open the website root directory for `cardcosmic.top`.
3. Back up the existing website folder.
4. Upload `deploy/cardcosmic-site.zip`.
5. Extract it into the website root directory.
6. Make sure `index.html` is directly inside the root directory.
7. Visit `https://cardcosmic.top`.

## Option B: ECS SSH Deployment

Replace `/www/wwwroot/cardcosmic.top` with the actual site root if different.

```sh
cd /www/wwwroot
cp -r cardcosmic.top cardcosmic.top_backup_$(date +%Y%m%d_%H%M%S)
cd cardcosmic.top
unzip -o /path/to/cardcosmic-site.zip
```

If Nginx needs reload:

```sh
nginx -t
systemctl reload nginx
```

## Files Included

- HTML pages
- `assets/`
- `data/`
- `素材图片/`
- `滚动视频播放/`
- `（3）宣传视频/`
- `robots.txt`
- `sitemap.xml`

## Important Performance Note

The current package includes a large homepage promotional video. For production, move videos to Aliyun OSS + CDN or compress them before launch.

