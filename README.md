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
| 03 | [K-Nearest Neighbors](topics/k-nearest-neighbors.html) | done |
| 04 | [Naive Bayes](topics/naive-bayes.html) | done |
| 05 | [Decision Trees](topics/decision-trees.html) | done |
| 06 | Neural Networks | soon |

Start with [Foundations](foundations.html) — the shared vocabulary — then work
through 01 upward; each lesson assumes you've read the ones before it.

**Organizing rule:** concepts shared by every algorithm (error, overfitting,
the Bayes classifier, …) live in `foundations.html` under the *Foundations*
sidebar group; anything specific to one algorithm lives in that topic's page.

## References

Source books live in `Materials/Books/` (gitignored — add your own copies):

- **An Introduction to Statistical Learning** — James, Witten, Hastie,
  Tibshirani (Python edition). Curriculum backbone: lesson structure and the
  "Further reading" section citations in each footer follow it.
- **Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow** —
  Aurélien Géron. Practical side: implementation patterns, evaluation
  metrics (precision/recall/ROC).

Footers cite exact sections (e.g. `ISLR §4.1–4.3 · Géron ch.3`); page lookups
happen on demand while writing a lesson.

## Structure

```
index.html                 hub with topic cards
foundations.html           shared fundamentals (sidebar group: Foundations)
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
