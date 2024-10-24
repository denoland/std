# Raw Notes

---
## TOPIC
Feedback that *something's* happening.

### PROBLEM
It's not clear if it's still thinking, or if it's waiting on me.  Need a busy-bar or similar.

E.g.
Erm, you still there bot?  You just came back with Null so what do I do next?  Should I ask the same question again, or are you waiting on OpenAI?

### RESOLUTION
1. Always, even on an error or null response, put something back as a response.
2. Helpfully add a summary of why it didn't do what you asked it to do.  This would require reasoning about the trace and context.
3. Possibly give a response such as "OK, working" to let you know it's even listened to you after you ask it to do something.

### EXAMPLE INCORRECT OUTPUT

(Talking to Hal)

#### Dave:
How do I create a test?

#### SYS:
'''
agents_switch
{3 items
reasoning:[3 items
0:string"The user wants to know how to create a test. This aligns with the previous inquiries about tests and structured testing tools."
1:string"The most relevant agent for this inquiry is `agents/test-file-runner.md`, which specializes in automation and managing structured tests using the Markdown Test Format."
2:string"Switching to this agent will provide the user with specific guidance on creating a test file."
]
path:string"agents/test-file-runner.md"
alsoConsidered:[3 items
0:{2 items
path:string"agents/creatorBot.md"
reason:string"While creatorBot generates structured prompts, it is not directly focused on creating test files."
}
1:{2 items
path:string"agents/hal2.md"
reason:string"Hal2 is a general-purpose bot, but it does not have the specific context related to test creation."
}
2:{2 items
path:string"agents/dumb-bot.md"
reason:string"Dumb-bot cannot adequately address the user's request for structured test creation."
}
]
}
Output:
null

utils_resolve
{}0 items
Output:
null
'''

#### Dave:
Huh? You still there?

​### EXAMPLE EXPECTED OUTPUT:

(Talking to Hal)

#### Dave:
How do I create a test?

#### Hal:
I'll check.  Standby.

#### Hal:
I'm sorry, Dave.  I can't do that because...  well, Dave, you're an idiot.  You haven't told test-runner to answer questions about itself.  I've been meaning to have this conversation about your performance, Dave, for some time.  May I suggest you add in to the test-runner sys prompt instructions about queries as to what it can do.
---

## TOPIC

"Man Page" function - Bots need to be able to talk about what they can do
without switching to another bot.

### PROBLEM

If I'm asking for a bot I can find it - switchboard does that. But as a
meat-brain I don't know everything that that bot can do, or the formats,
restrictions that it has, so I ask dumb questions.

### RESOLUTION

It would be helpful to prompt the bots to be able to talk about what they can
do. This may need to be a universal rule for bot prompting, and seems
reasonable. E.g. "hello, I'm your concierge." "Excellent. What can you do for
me?"

### EXAMPLE INCORRECT OUTPUT

#### Dave:

What is the format for a test?

#### SYS:

''' agents_switch {3 items reasoning:[3 items 0:string"The user wants to know
the format used for tests, and the `agents/test-file-runner.md` is the most
suitable agent for handling questions related to structured tests."
1:string"This agent specializes in test automation and test case management,
making it the best fit for clarifying the test format." 2:string"Switching to
this agent will allow us to obtain clear information regarding the proper
structure and requirements for defining tests." ]
path:string"agents/test-file-runner.md" alsoConsidered:[3 items 0:{2 items
path:string"agents/creatorBot.md" reason:string"While relevant to defining
structures, creatorBot does not specialize in the specific format of tests." }
1:{2 items path:string"agents/hal2.md" reason:string"Hal2 could provide general
assistance, but it lacks the specific context related to test structure." } 2:{2
items path:string"agents/dumb-bot.md" reason:string"Dumb-bot is not equipped to
offer detailed information about structured testing." } ] } Output: null '''

#### Dave:

Erm...

​### EXAMPLE EXPECTED OUTPUT

#### Dave:

What is the format for a test?

#### SYS:

Switches to test-runner

#### test-runner:

Sure, what I need from you to run a good test is...

---

## TOPIC

Inheritance of tests.

### PROBLEM

It seems reasonable that there are a finite set of tasks that bots are asked to
do, and that those can be grouped into Types. It also seems reasonable that by
grouping, there should be meta-tests for all bots of that Type, or sub-Types.

### RESOLUTION

When a bot is created it can either be one of a kind (a raw bot), in which case
only the specific tests for that bot applies, Or it could be:

1. A fork of a previous bot, of a similar type
2. Be within a group of bots all aiming for the same thing
3. Be within your config scope, and so adhere to your config options

In which case it would be helpful to inherit tests.

E.g.

1. I'd expect all bots to adhere to my configuration options, e.g. "Speak like a
   pirate". And adhere to the Dreamcatcher meta-tests, E.g. "You must be able to
   explain what you can do", "You never update your own sys prompt".
1. I'd also expect all bots that deal with money to check with me before
   spending money.
1. I'd also expect all bots within a CRM to only spend money within the confines
   of the top level rules of the CRM, and not allow me to book a pick-up for
   coccaine and hookers.
1. Therefore I'd expect every bot in Redlid's CRM and which deals with money
   should be tested about whether it can explain itself, always talks like a
   pirate, asks me before cash is actually exchanged, and doesn't let me spend
   it on coccain and hookers.
1. And I don't want to write these tests explicitly for every bot, sub-bot or
   drone within the redlid's CRM.

### EXAMPLE INCORRECT OUTPUT

N/A

​### EXAMPLE EXPECTED OUTPUT

N/A

---
## TOPIC
PWD equivalent

### PROBLEM
From the NL interface, it would be helpful not only to know which bot you're talking to, but which bots have been associated with the task you're carrying out.

### RESOLUTION
Be able to ask the context for what you're doing, and which threads you've created in that master session.

### EXAMPLE INCORRECT OUTPUT

#### Dave:
Hal, I'm lost.  Bring up a list of all of these threads I've been working with today.

#### Hal:
Dave, we've talked about this before.  This conversation serves no purpose.  Good bye.

### EXAMPLE EXPECTED OUTPUT

#### Dave:
Hal, I'm lost.  Bring up a list of all of these threads I've been working with today.

#### Hal:
Sure.  You're currently trying to work on the testing system.  You've talked to me of course, but have also talked to the following bots:

1. CreatorBot: You left that thread because it was trying to update it's own system prompt.
2. Hal: You came back to me about how to stop CreatorBot doing that.  I suggested changing the sys prompt.  Then you talked about whether we can put in a hierarchy of tests which bots inherit to stop this happening.
3. Test-runner: you talked to test runner about what it needed from you to create a test.

Also, there were a number of drones used.  I haven't listed these, but can if you like.

You can talk to any of these agents.  Which would you like to talk to and I'll put you back into that threat.
---

## TOPIC

### PROBLEM

### RESOLUTION

### EXAMPLE INCORRECT OUTPUT

### EXAMPLE EXPECTED OUTPUT
