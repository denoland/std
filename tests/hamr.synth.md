---
target: agents/hamr.md
assessor: agents/assessor.md
max_runs: 100
synthetic_prompts: 50
seed_variations: 30
max_shot: 3
min_shot: 1
temperature_max: 2
temperature_min: 1
impersonations:
  - agents/customer-agent.md
  - actor/customer.md:
      crazy: [1, 5]
filesystem:
  repo: some/repo
  commit: 918455f8825572a6fc33473ec8e8bdc9fcb61597
  paths:
    - agents/accountant.md
    - bank-statements/*.csv
  cwd: tests/some-test-dir
---

# Test: starter for 10

**Prompts:**
\`\`\`markdown
list all customers
\`\`\`

**Expections:**

- 10 customers listed
- the response is short
- there is no question asked at the end
