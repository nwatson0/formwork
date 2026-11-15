# Formwork Trainer — source

The files one level up are the finished, installable app. This folder is what builds it.

| File | What it is |
|---|---|
| `engine.js` | Pose solver (skeleton, reach/IK, hand grips), equipment shapes, animation timing |
| `moves.js` | The movement library: one function per movement pattern, shared by many exercises |
| `data.js` | Muscles, equipment and the exercise list (names, muscles, instructions) |
| `form.js` | On-figure form guides and "common mistake" demonstrations |
| `coach.js` | Researched, lift-specific coaching notes and callouts (with sources) |
| `stage.js` | 3D rendering of the mannequin and equipment (three.js) |
| `app2.js` | The app itself: workout builder, logging, progress, library, gear |
| `template2.html` | Page layout and styles |
| `build_body2.js`, `muscle_map.js`, `mhlib.js`, `mh/` | Builds the mannequin (`body.js`) from the CC0 MakeHuman model |
| `build2.py` | Bundles everything into one HTML file |
| `build_site.py` | Produces the installable site (the files one level up) |
| `test/` | Screenshot and check scripts (Playwright) |

Rebuild: `node build_body2.js sub=1` (only if the figure changes), then `python3 build2.py && python3 build_site.py`.
Paths inside the scripts assume the folder lives at `/home/claude/fw2`; adjust if you move it.
