This document describes the release flow of the Standard Library for the
maintainers. If you're not a maintainer, you don't need to read this document.

# The release flow

To release deno_std, follow the below steps:

- Message slack #std and discord #dev-std channel "🔒 std is locked"
- Trigger `version_bump` action with `main` branch selected
- Wait for @denobot to create a release PR
  - Note: the tool automatically calculates the necessary version upgrades.
- Review PR, and update it if necessary
- Land the PR.
- Tag the main branch with `release-YYY-MM-DD` (This step can be automated in
  the future)
  ```
  git tag release-YYYY.MM.DD
  git push origin release-YYYY.MM.DD
  ```
- Publish the tag from github UI (Re-check the tag is in correct form)
- Wait for `workspace publish` action to publish the new versions to JSR
- Message slack #std and discord #dev-std channel "🔓 std is unlocked
  <url_of_release>"
- That's all
