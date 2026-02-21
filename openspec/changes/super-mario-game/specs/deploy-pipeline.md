## ADDED: FTP Deployment Pipeline

### Requirements
- Deployment target: `mario.godeliauskas.com` hosted on `altas.serveriai.lt`
- Deploy script: `deploy.sh` (Bash) in project root
- FTP connection via `lftp` for reliable recursive uploads with retry

#### deploy.sh Script
- Reads FTP credentials from environment variables or `.env` file: `FTP_HOST`, `FTP_USER`, `FTP_PASS`
- FTP_HOST: `altas.serveriai.lt`
- Remote directory: `/public_html/mario.godeliauskas.com/`
- Uploads the `dist/` directory contents (built game files) to remote
- Uses `lftp` with `mirror --reverse --delete --verbose` to sync local dist to remote
- Skips `.git`, `node_modules`, `.env`, `deploy.sh` (never upload these)
- Prints upload summary on completion
- Exit code 0 on success, 1 on failure

#### Build Step (before deploy)
- `npm run build` produces optimized output in `dist/` folder
- Build includes: index.html, bundled JS, assets (sprites, tilemaps), .htaccess
- Build minifies JS for production

#### .htaccess Configuration
- Placed in `dist/` and uploaded to remote root
- HTTPS redirect: redirect all HTTP requests to HTTPS
- Content:
  ```
  RewriteEngine On
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  ```
- Cache headers: cache static assets (JS, CSS, images, audio) for 1 year, HTML for 1 hour
- GZIP compression enabled for text-based files
- Custom 404 fallback to index.html (SPA-style)

#### .env File
- Not committed to git (listed in `.gitignore`)
- Contains: `FTP_HOST`, `FTP_USER`, `FTP_PASS`
- deploy.sh sources this file if it exists

#### CI Consideration
- deploy.sh can be run manually or from a CI pipeline
- All secrets passed via environment variables, no hardcoded credentials

### Scenarios
- Given the developer runs `bash deploy.sh`, When .env file exists with valid credentials, Then lftp connects to altas.serveriai.lt and uploads dist/ to the remote directory
- Given the developer runs `bash deploy.sh`, When .env file is missing and env vars are not set, Then the script exits with error message "FTP credentials not configured"
- Given dist/ is uploaded, When a user visits http://mario.godeliauskas.com, Then .htaccess redirects to https://mario.godeliauskas.com with 301
- Given the build completes, When dist/ contains index.html and bundled JS, Then deploy.sh uploads all files and prints a success summary
- Given deploy.sh runs, When .git or node_modules directories exist locally, Then they are excluded from the upload
- Given the game is deployed, When a user visits a non-existent path, Then .htaccess serves index.html as fallback
- Given static assets are served, When the browser requests JS or image files, Then cache headers set max-age to 1 year
