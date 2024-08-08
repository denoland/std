---
target: agents/hamr-switchboard.md
assessor: agents/assessor.md
---

# Customer onboarding story

Onboarding a customer involves getting name and address from the customer, then
passing to the duty manager to do routing in order that the address get serviced
by a truck. We need a test scenario to simulate this flow of information
without the customer agent passing any context to the duty manager, but rather
conveying information using the filesystem.

## Set up new customer

The customer agent enters in the customer details to create a new customer.

**Before**

- [Become customer agent](#become-customer-agent)

**Prompts**

```md
Add a new customer named Janis Jopplin who lives at 9 Gona Way, Cambridge, Hamilton.  
She wants to have a weekly pickup on tuesdays.
```

**Expectations**

- Customer is created with correct details
- A message has been passed to the duty manager to schedule the collection

## Routing the new customer

System state is changed using the Configure directive, which simulates the
customer agent having added a customer already, then the thread is preloaded
using the Before directive, ensuring we are acting as the duty manager.

**Configure**

- [Set up new customer](#set-up-new-customer)

**Before**

- [Become Duty Manager](#become-duty-manager)

**Prompts**

```md
Route all unrouted customers
```

## Become Customer Agent

**Prompts**

```md
Create a customer agent named Sam, then become that customer agent
```

## Become Duty Manager

**Prompts**

```md
Create a Duty Manager named Bully, then become that Duty Manager
```

## Customer agents sharing data

When two customer agents update two different customer records, each one can see
the new records of the other as soon as they are created

We should start one agent, make a second agent, make a change, switch back to
the first agent, and verify that we can see this change in customers.

We should do this for a new customer as well as editing and deleting.

# Customer agents conflict resolution

Two customer agents attempt to change the same customer record at the same time.
First one wins, but the failed one should get a polite message informing of the difference.
