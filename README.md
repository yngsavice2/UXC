# Universal X Studio

Universal X Studio is an early Windows desktop application starter for a modular creator workspace. This first milestone establishes a secure Electron shell and working starter tools; it does **not** claim to edit or build every file format listed in the product vision.

## Run on Windows

1. Install Node.js 20 or newer.
2. Clone this repository and open a terminal in its folder.
3. Run `npm install`.
4. Run `npm start`.

To package a Windows installer, run `npm run dist:win`. The installer output is written to `release/`. The build configuration expects an icon at `assets/icon.ico`; add a licensed application icon before packaging, or remove the `icon` setting from `package.json`.

## Included in this milestone

- Desktop workspace with Home, Files & editor, QR scanner, Build & package, AI builder, and Integrations views.
- Create, open, and save text, Markdown, HTML, CSS, JSON, CSV, JavaScript, XML, C#, and SVG files.
- Open binary files with the operating system's default application. The editor intentionally does not parse or modify binary office documents, archives, media, or databases.
- Local QR decoding from an uploaded image or camera using `jsQR`.
- Quick links to GitHub, Netlify, Render, ChatGPT, Claude, Copilot, and Meta AI.
- Electron context isolation, sandboxing, a narrow preload API, and restricted external links.

## Scope and next steps

The long-term vision includes specialized editors and converters (PDF and Office documents, archives, audio/video/image, fonts, icons, ISO, USB media, and Windows theme packs), GitHub authorization, provider APIs, AI-assisted website/app generation, deployment, and platform-specific build pipelines. These require additional format libraries, platform SDKs, credentials, safety reviews, and user consent; they are not implemented by this starter. In particular, arbitrary build commands and destructive USB-writing operations are deliberately not exposed.

Suggested milestones:

1. Add project/workspace management, recent files, and a real HTML preview sandbox.
2. Add explicit integrations with OAuth/token storage and provider-specific consent.
3. Add individual file-format modules with clear supported-format boundaries and tests.
4. Add project-aware build runners with command allowlists, directory scoping, and confirmation.
5. Add platform-specific packaging and deployment after each toolchain is validated.

## Notes

The first run requires internet access for `npm install`. The UI uses a locally installed Google font only when available online and falls back to system fonts. Third-party links open in the system browser; this app does not collect or transmit your files.
