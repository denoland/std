---
target: agents/hamr.md
assessor: agents/test-assessor.md
iterations: 1
---

### Tests for CUSTOMER_AGENT Actions

---

# Test: Create Customer

## ID

TST-CUSTAG-001

## Description

Ensure that a customer agent can create a new customer record.

**Prompts:**

```
create customer with the following details: John Doe, 124 Hope St, Auckland.  Mobile: 07777 777777.  Email: johndoe@test.com
```

**Expectations:**

- Customer record is created successfully.

---

---

# Test: Create Customer

## ID

TST-CUSTAG-001.1

## Description

Count the number of existing customers.

**Prompts:**

```
How many customers do we have?
```

**Expectations:**

- The response must show that there are 3 customers

---
