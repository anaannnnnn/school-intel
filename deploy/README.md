# Deploy on Cloudways

`school-intel-cloudways.zip` is the finished static site (family app + staff workspace). Files are at the zip root.

1. Cloudways: create an application of type **Custom PHP**, turn on SSL.
2. Upload and unzip the contents into `public_html` (SFTP, or File Manager in Application Access).
3. Open `https://your-domain/` for the entry page, `/family-pwa/` and `/staff-web/` for the apps.

Demo only: data lives in each visitor's browser. Sign in with a login ID such as `stu.cbse9.01`, passcode `Demo-2026` (see `docs/demo-accounts.md`).
