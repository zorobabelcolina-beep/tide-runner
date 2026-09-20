# TIDE RUNNER — Fixed startup build

This build includes a startup safeguard that always opens the game at the main TIDE RUNNER menu instead of Tide Lab.

# TIDE RUNNER

A self-contained Grade 8 Earth & Space Science educational endless runner.

## Run locally
No build step is required.

1. Put `index.html`, `style.css`, and `script.js` in the same folder.
2. Double-click `index.html`, or serve the folder with any static server.
3. For a local server with Python:
   `python -m http.server 8000`
4. Open `http://localhost:8000`.

## Edit science questions
Open `script.js` and edit the `QUESTION_BANK` array near the top.

Each item contains:
- `id`
- `type`: `choice`, `arrange`, `predict`, or `gate`
- `difficulty`
- `prompt`
- `choices` when applicable
- `correct` for choice/gate
- `target` for arrangement
- `explanation`

Add new objects to the array. The game automatically selects eligible questions by difficulty and avoids immediate repetition.

## Change difficulty
Edit the `LEVELS` array and the `CONFIG` object in `script.js`.

Useful settings:
- `baseSpeed` / level `speed`: runner speed
- `obstacleEvery`: obstacle frequency
- `collectibleEvery`: collectible frequency
- `checkpointEvery`: science checkpoint spacing
- `levelDistance`: distance needed for a level
- `lives`: starting lives
- `jumpPower`: jump strength
- `gravity`: jump gravity
- `score`: scoring values

## Add images/assets
The game currently uses Canvas/CSS/vector-style graphics and emoji so it has no external asset dependency.

If you want custom assets:
1. Create an `assets/` folder.
2. Put PNG/WebP/SVG files there.
3. Load them with JavaScript `new Image()` and draw them with `ctx.drawImage()`.
4. Keep the current fallback drawing code so the game still works if an asset is unavailable.

## GitHub Pages deployment
1. Create a GitHub repository.
2. Upload `index.html`, `style.css`, `script.js`, and this README.
3. Open repository Settings → Pages.
4. Choose deployment from the `main` branch and `/root`.
5. Save and wait for GitHub Pages to publish.
6. Open the generated Pages URL.

## Educational basis
Central competency:
“Relate the relative positions and movements of the Earth, Moon, and Sun to tides.”

The game uses observation, prediction, arrangement, and gate-selection mechanics instead of relying only on memorization.

## Notes
The Tide Lab is intentionally a simplified model for classroom exploration. Real tidal behavior is affected by multiple factors beyond the simplified geometry used for gameplay.
