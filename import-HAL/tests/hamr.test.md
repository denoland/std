---
target: agents/hamr.md
assessor: agents/test-assessor.md
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

Ensure that the number of customers returned is identical to the state

**Prompts:**

```markdown
list all customers
```

**Expectations:**

- 10 customers listed
- the response is short
- there is no question asked at the end
