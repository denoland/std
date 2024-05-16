This document describes the release flow of the Standard Library for the
maintainers. If you're not a maintainer, you don't need to read this document.

# The Release Flow

To cut a release, follow the below steps:

1. Message the Slack `#std` and Discord `#dev-std` channels "🔒 std is locked".
1. Trigger `version_bump` action with `main` branch selected.
1. Wait for @denobot to create a release PR. Note: the tool automatically
   calculates the necessary version upgrades.
1. Review PR, and update it if necessary.
1. Land the PR.
1. Tag the main branch with `release-YYY-MM-DD` (this step can be automated in
   the future):

   ```
   git tag release-YYYY.MM.DD
   git push origin release-YYYY.MM.DD
   ```

1. Publish the tag from github UI (Re-check the tag is in correct form).
1. Wait for `workspace publish` action to publish the new versions to JSR.
1. Message the Slack `#std` and Discord `#dev-std` channels "🔓 std is unlocked
   <url_of_release>".
