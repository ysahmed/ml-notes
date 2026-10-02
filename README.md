# ML Notes

Plain-English, visually-driven study notes for machine learning algorithms.
Each topic is one page: intuition first, formulas second, interactive demos third.

## Run

```bash
python3 serve.py          # http://localhost:8000
python3 serve.py 3000     # custom port
```

Then open the printed URL. The pages need internet once for KaTeX (the math
rendering); everything else works offline.

## Topics

| # | Topic | Status |
|---|-------|--------|
| 01 | [Linear Regression](topics/linear-regression.html) | done |
| 02 | [Logistic Regression](topics/logistic-regression.html) | done |
| 03 | K-Nearest Neighbors | soon |
| 04 | Decision Trees | soon |
| 05 | Neural Networks | soon |

Start at 01 — each lesson assumes you've read the ones before it.

## Structure

```
index.html                 hub with topic cards
serve.py                   local dev server (stdlib only)
topics/                    one HTML file per lesson
assets/css/style.css       shared theme (light/dark), sidebar, components
assets/js/common.js        sidebar drawer, theme toggle, KaTeX, TOC scrollspy
assets/js/plots.js         Plot helper used by every demo (axes, lines, heatmaps…)
assets/js/demos/           one script per interactive figure
```

## Adding a new topic

1. Create `topics/<name>.html` — copy an existing lesson as the template
   (sidebar, table of contents, and script includes come with it).
2. Add demos under `assets/js/demos/`, reusing the `Plot` helper from
   `assets/js/plots.js`.
3. Add the topic to the sidebar of **every** page and to the cards on
   `index.html` (numbering moves the old "soon" entries down).
