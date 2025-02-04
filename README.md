# PR Labels Checker
Github Action to check if a PR's labels pass the specified rules

Forked from https://github.com/danielchabr/pr-labels-checker

## Input
- `hasSome`: Comma separated list of labels, PR needs at least of them
- `hasAll`: Comma separated list of labels, PR needs all of them
- `hasNone`: Comma separated list of labels, PR must not have any of them
- `hasNotAll`: Comma separated list of labels, PR must not have all of them
- `githubToken`: GitHub token

## Output
- `passed`: boolean

## Example workflow file
```yml
name: Labels Check
on:
  pull_request:
    types: [opened, labeled, unlabeled, synchronize]
jobs:
  QA-check:
    if: github.base_ref == 'master'
    runs-on: ubuntu-latest
    steps:
      - uses: Hysolate/pr-labels-checker@main
        id: checkLabel
        with:
          hasSome: QA:tested,QA:skipped
          githubToken: ${{ secrets.GITHUB_TOKEN }}
  Do_not_merge-check:
    if: github.base_ref == 'master'
    runs-on: ubuntu-latest
    steps:
      - uses: Hysolate/pr-labels-checker@main
        id: checkLabel
        with:
          hasNone: do not merge,blocked
          githubToken: ${{ secrets.GITHUB_TOKEN }}
  Unlock-check:
    runs-on: ubuntu-latest
    steps:
      - uses: Hysolate/pr-labels-checker@main
        id: checkLabel
        with:
          forceMerge: force merge
          githubToken: ${{ secrets.GITHUB_TOKEN }}
```
