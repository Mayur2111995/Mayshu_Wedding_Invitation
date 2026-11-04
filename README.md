# Mayur weds Ashwini - Wedding Invitation

Static site (HTML + CSS + JS), hosted on GitHub Pages. No build step.

## Add your own files (same names)
- images/groom.jpg  - groom photo (portrait, 3:4 looks best)
- images/bride.jpg  - bride photo (portrait, 3:4 looks best)
- audio/song.mp3    - background song (keep under ~5 MB)

## Guest list (Google Sheet)
1. Create a Google Sheet. Extensions > Apps Script. Paste google-apps-script.gs and Save.
2. Deploy > New deployment > type "Web app". Execute as: Me. Who has access: Anyone. Deploy and allow access.
3. Copy the Web app URL and paste it in script.js: var APPS_SCRIPT_URL = '...';
4. git add . && git commit -m "Add guest sheet" && git push

After any later edit of the Apps Script, use Deploy > Manage deployments > Edit > New version.
