# Contributing to MOODAH

Thank you for contributing to MOODAH. To make your submission valid, follow these steps exactly.

## Create a branch first

1. Fork the repository.
2. Create a new branch named after your GitHub username, for example:
   - `your-username`
3. Make your changes in that branch.
4. Open a pull request from that branch into `main`.

## What to change

In your username branch, only modify `data/manifest.json`.

- Add exactly one new object.
- Add it to the end of the array.
- Do not edit, reorder, or delete existing entries.

The object must include only:

- `username` — your valid GitHub username
- `emojis` — an array of exactly 5 emoji characters

Do not include any of these fields in your contribution:

- `mood`
- `description`
- `addedAt`
- any other extra fields

## Why this matters

The repository separates contributor input from generated AI output.

- Contributor data lives only in `data/manifest.json`
- Generated data is written to `generated/mood-results.json`
- The GitHub Action validates the PR and runs Groq automatically
- Valid PRs are auto-merged once checks pass

## Example contribution

```json
{
  "username": "your-username",
  "emojis": ["😄", "🎨", "☕", "🎧", "🌙"]
}
```

## Pull request rules

- Use a branch named after your GitHub username
- Add a single new object to `data/manifest.json`
- Do not modify `generated/mood-results.json`
- Do not include mood fields or addedAt
- Keep the PR small and focused

Thanks! Your branch will be validated and merged automatically if it follows these rules.
」