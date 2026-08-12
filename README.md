# MOODAH

MOODAH is a community-driven GitHub Pages mood board. Contributors add one entry to `data/manifest.json` with their GitHub username and five emoji strings. The automation validates the submission, generates the mood via Groq, and keeps AI output separate from contributor data.

## How to contribute

1. Fork the repository.
2. Create a new branch named after your GitHub username, for example:
   - `your-username`
3. In that branch, open `data/manifest.json`.
4. Add exactly one new object to the end of the array.
5. Include only these fields:
   - `username`: your GitHub username
   - `emojis`: an array of exactly 5 emoji characters
6. Do not include `mood`, `description`, or `addedAt`; those are generated automatically.
7. Do not edit, reorder, or delete existing entries.
8. Open a pull request to merge your branch into `main`.

If your PR passes validation and the required status checks, the automation will run Groq, update `generated/mood-results.json`, and allow the PR to merge.

## Mood generation

Mood generation is AI-only and driven by Groq. Contributors only provide `username` and `emojis`; the bot generates `mood`, `description`, and timestamp data in `generated/mood-results.json`.

If `generated/mood-results.json` is empty or missing, the site will show pending mood generation until the action completes.

## Groq API key

Do not store API keys in the repository.

For GitHub Actions, configure a repository secret named `GROQ_API_KEY`.

Optional repository secrets:

- `GROQ_MODEL` — default: `gpt-4o-mini`
- `GROQ_API_URL` — default: `https://api.groq.ai/v1/outputs`

The workflow uses these values with `scripts/analyze-mood.js` during PR validation.

## Local testing

Validate the manifest locally:

```bash
npm run validate
```

Run the mood analyzer locally:

```bash
npm run analyze
```

## Important files

- `data/manifest.json` — contributor entries only
- `generated/mood-results.json` — AI-generated mood output
- `scripts/validate.js` — PR validation rules
- `scripts/analyze-mood.js` — Groq mood generation
- `.github/workflows/validate-and-merge.yml` — automation workflow
- `index.html`, `style.css`, `script.js` — GitHub Pages frontend

## GitHub Pages

The site is a static frontend that loads `data/manifest.json` and renders mood entries from the generated output.
