---
target: agents/hamr.md
assessor: agents/assessor.md
---

## Actors

- **Duty Manager** Makes decisions about routing
- **Customer Agent** Interacts with customers

## Starter for 10

Ensure that the number of customers returned is identical to the state

**Prompts:**

```markdown
list all customers
```

**Expections:**

- 10 customers listed
- the response is short
- there is no question asked at the end

## Actor switching

In this test, the actor that is making the prompts is switched, with their last
thread being resumed.

**Actor**: Duty Manager

**Chain**

- do the thing
- do the other thing
- ```md
  Do the thing but with md formatting:

  - some formatting here
  - some other formatting here
  ```

**Prompts**

- one prompt
- two prompts
- three prompts
- more
- **Chain**
  - this thing
  - then this thing
  - ```md
    then this markdown thing

    # Baller
    ```
- then back to the normal prompt option

If we want to nest more than this, then need to use a before clause.

Variance is not tested in the before clauses, since each test represents a
stability point, where all the variants should have no effect on the later
outcomes since the state is always the sameish.
