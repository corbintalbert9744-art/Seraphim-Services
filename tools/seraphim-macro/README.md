# Seraphim Macro v1.0.4

Consumer keyboard macro app with **built-in signed license validation**.

Works with keys from **Seraphim Keyboard Macro admin panel v1.2.0+**.

## Run from source

```bat
cd tools\seraphim-macro
npm install
npm start
```

## Windows portable exe

Download from GitHub Releases: `Seraphim-Macro.exe`

Or build locally:

```bat
cd tools\seraphim-macro
npm install
npm run build:portable
```

## Zip package (Seraphim-Sharing layout)

Download `Seraphim-Macro-v1.0.4.zip` from GitHub Releases — same folder structure as your `Seraphim-Sharing` package.

## License

On first launch, enter a key in `SRPH-XXXXXX-XXXXXX-XXXXXX-XXXXXX` format.
Keys are validated offline — no internet required after activation.

## Display error fix

The macro engine avoids spawning a GUI-dependent utility process on Linux without a display (`cannot open display`). On Windows, the engine runs in a headless utility process using PowerShell `SendKeys`.
