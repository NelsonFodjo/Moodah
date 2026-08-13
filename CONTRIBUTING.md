# Contributing to MOODAH

Thank you for contributing to MOODAH. To make your submission valid, follow these steps exactly.

> **Note:** You only submit your `username` and `emojis`. Once your pull request is merged, AI (via Groq) automatically generates your **mood** and **description** from those emojis — you don't write these yourself, and you don't need to open a follow-up PR to add them.
>
> **Each GitHub username may contribute only once.** Every entry in `data/manifest.json` must have a unique `username`; a PR that reuses a username already in the manifest (including your own, if you've contributed before) will fail validation.

## Cloning, Forking, and PR workflow

If you do not have write access to this repository (the common case), fork the repository on GitHub and open a Pull Request (PR) from a branch in your fork into the upstream `main` branch. Cloning someone else's fork or merging changes into *your fork's* `main` branch does not create a PR on this repository and will not update the upstream `main`.

Key points:

- If you don't have write access: fork -> branch in your fork -> push -> open PR to upstream `main`.
- If you do have write access: create a feature branch in the upstream repo and open a PR (do not push directly to `main`).
- Never merge your changes into your fork's `main` and assume upstream will get them. A merge to your fork's `main` only affects your fork.

Common command sequence (no write access, using SSH):

```bash
# Fork on GitHub, then clone your fork locally
git clone git@github.com:your-username/Moodah.git
cd Moodah

# Add upstream so you can stay in sync with the original repo
git remote add upstream git@github.com:NelsonFodjo/Moodah.git
git fetch upstream

# Create a branch for your contribution (use your GitHub username)
git checkout -b your-username

# Make the required change to data/manifest.json
git add data/manifest.json
git commit -m "Add contribution from your-username"

# Push the branch to your fork
git push origin your-username

# Open a PR on GitHub from your-username (fork) -> NelsonFodjo:main
``` 

You can create the PR with the GitHub web UI (Compare & pull request) or the `gh` CLI:

```bash
# Example using GitHub CLI
gh repo fork NelsonFodjo/Moodah --clone=false # optional if you've already forked
gh pr create --base NelsonFodjo:main --head your-username --title "Add your-username" --body "Adds contribution for @your-username"
```

If you accidentally merge changes into your fork's `main`, create a branch from that commit and open a PR from that branch to upstream `main`. Do not rely on merges to your fork's `main` as a substitute for opening a PR to the upstream repository.

Maintainers: this repository enforces branch protection on `main` and requires PRs and passing checks before merge, so direct pushes or merges to upstream `main` are prevented unless protections are removed.

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
- After merge, the AI reads your `emojis` and generates your `mood` and `description` for you — this happens automatically in the same workflow run, no extra steps needed
- You get one contribution per GitHub username — once your entry is in the manifest, you can't add another

## Example contribution

```json
{
  "username": "your-username",
  "emojis": ["😄", "🎨", "😍", "🎧", "🌙"]
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
