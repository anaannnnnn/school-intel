# Deploy on Cloudways

`school-intel-cloudways.zip` is the finished site: the start page, both workspaces and the school database
(`data/school.db`). Files are at the zip root.

1. Cloudways: create an application of type **Custom PHP** and turn on SSL.
2. Upload the zip and unzip it into `public_html` (SFTP, or File Manager under Application Access).
3. Open `https://your-domain/`. The page asks whether you are a student, parent or teacher.

The database file is read by the browser when the app starts, so there is nothing to start or configure on the server.
To publish new data, run `npm run db:build`, then `npm run build`, and upload the new `dist/` contents; browsers pick
up the new file on their next visit and drop their saved local changes.

Logins are in `docs/accounts.md`; the initial passcode is in the README ("Accounts and the database"). Anyone who can open
the site can download `school.db`, so use it for sample data and pilots only.

To rebuild the zip: `npm run build`, then zip the contents of `dist/` (not the folder itself).
