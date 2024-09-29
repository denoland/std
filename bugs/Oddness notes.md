Oddness


 Bug:
 
 I asked /o1 to translate the timestamp in a TPS report just generated.  Here's the answer:

 ---
Based on the timestamp you provided, 1727597512505 milliseconds since the Unix epoch (January 1, 1970), the corresponding date and time are:

Date: 02/06/2024 (DD/MM/YYYY)
Time: 08:11:52 (HH:MM:SS)
This means the timestamp corresponds to June 2, 2024, at 08:11:52 UTC.

If you intended this timestamp to represent an event today, there might be a discrepancy. Please double-check the timestamp to ensure it's correct.

If you need further assistance or have more questions, feel free to ask!

---

It should have generated a datetime for today.


Note:

Definitely could use a "STOP!", mostly when I realise I've put in a typo, but occasionally because the bots are redoing stuff for no reason.

---

Request:

To be able to select a file in the explorer as the target for a bot.  E.g.

User: /test-file-runner
Result: <Moves to test-file-runner>
User: <select the test in the file explorer.  E.g. tests/router.test.md
User: run
Result: <runs the tests in tests/router.test.md>

Reason: lost time in typos, but also in folder context.

---

Request:

Would like to restrict a bot to always look for the file relative to the folder that it's meant to be looking at.  E.g.

User: /test-file-runner
Result: <Moves to test-file-runner>
User: router.test.md
Result: runs router.test.md

Reason: spending a bit of time where /test-file-runner is looking for an absolute path.

---

Request:

One a stream of actions has completed, output the final response so the user doesn't need to keep checking if it's completed and is just presented with the final result.  

User: /files delete tests/scottMudPit/multiple_hamr.tps.json
Result: <multiple calls, all collapsed>
Note: Having to click on the input box throughout the multiple calls to see if it's actually come to a conclusion.  When it does, need to expand on the last one to see if it worked.

Note, if the final result is an error or unexpected, user should still be able to go back up the stream and expand as necessary to figure out what happened.

---

Request:

A history, so I don't have to keep typing stuff back in.  Same function as for linux.


---

Request:

I've written a more human readable agent called test-results-summary.md.  I want test-file-runner.md, once the tps is written, to then call test-results-summary.md.  At the moment test-results-summary.md reads the TPS, but outputs to the thread the summary results rather than writing to a file, and the operation is just parsing and so is quick and disposable.

---


Bug:

I asked /files to:

- create a folder called scott and in that folder create a file called hamr.test.md with the contents: "test"

I got the location wrong.  It should have ended up being in /tests/scott/hamr.test.md.  However, it did create /scott/hamr.test.md.  So, fair enough.

I then asked it to:

	- move the folder scott to /tests

It moved the folder, but what I was suspecting was that I'd end up with /tests/scott/hamr.test.md.  What I got was an empty folder /tests/scott.  hamr.test.md did't come with it, and wasn't left in /.  I lost my test file, dude! ;-)

---

Request:

Batching up raw prompts as if you'd put them in by hand would be really useful.  E.g.

- User: /files create a file called temp.batch.md with the contents: 

	--- 
	- /files create a new file called file X with the contents: 
		- o1/ what's a dinosaur?

- Response: temp.batch.md successfully created.
- User /batch run temp.batch.md
- Response: Basically a naked bird with attitude.


I'm currently able to do something like this by creating a thread such as:

"Give me all of the instructions and inputs Dave has put in on this thread, leaving out any responses from agents."

but then can't run it to get back to the situation I was in, but also to be able to edit half way through then run the whole thing from the start.

--- 

User Note:

Sometimes when, having switched to a bot, you can put in directly a file name.  However, if you give the absolute path, that also starts with a '/' so router get's confused.

Suggest prompting router and switchboard to, having not found an agent at '/', then to strip out the '/' and try again.  Example:

User: /test-file-runner.md
Response: <now talking to test-file-runner>
User: /tests/hamr.test.md
Wrong Response: Sorry Dave, you're talking shit again, aren't you.  That's not an agent.
Right Response: <Router thinks - hmmm... maybe it's meant to be "tests/hamr.md". Let's do that instead.

---

Very Odd Bug:  Assertion Error

https://longthreat-ui--next.deno.dev/#branches=main/act_A3VJHSYD86C5TQYZ/the_9WMYG3ENQ22TQE5J

The last part is the interesting part, being:  

---

Output:
{2 items
name:"AssertionError"
message:"thread exists: threads/the_9WMYG3ENQ22TQE5J/case_1/iteration_0.json"
}
agents/test-file-runner.md
utils_reject
{1 item
message:"The test cases could not be run due to existing threads. The system indicated that threads already exist for the specified test cases."
}
Output:
null

---

Here's the full thing:

---  



agents/files.md
The file hamr.test.md has been successfully created in the folder scott, with the specified contents detailing the test for customer creation and count. You can now view the directory structure and the created file through the file explorer widget.

Dave
/tests-file-runner.md

agents/router.md ➡️ agents/test-file-runner.md

Dave
run scott/hamr.test.md

agents/test-file-runner.md
tps-report_upsert
{5 items
reasoning:[1 item
0:"To create a new TPS report for the test suite 'scott/hamr.test.md' to record outcomes of the tests being run."
]
testPath:"scott/hamr.test.md"
agent:"agents/hamr.md"
assessor:"agents/test-assessor.md"
iterations:1
}
Output:
(empty)

tps-report_addCase
{5 items
reasoning:[2 items
0:"Identifying and adding the first test case 'Create Customer' to the test report."
1:"The test consists of several prompts and corresponding expectations."
]
testPath:"scott/hamr.test.md"
name:"Create Customer"
promptChains:[1 item
0:[1 item
0:"Create customer with the following details: John Doe, 124 Hope St, Auckland. Mobile: 07777 777777. Email: johndoe@test.com"
]
]
expectations:[1 item
0:"Customer record is created successfully."
]
}
Output:
(empty)

tps-report_addCase
{5 items
reasoning:[2 items
0:"Identifying and adding the second test case 'Count customers' to the test report."
1:"This test has its own set of prompts and expectations."
]
testPath:"scott/hamr.test.md"
name:"Count customers"
promptChains:[1 item
0:[1 item
0:"How many customers do we have?"
]
]
expectations:[1 item
0:"The response must show that there are 3 customers"
]
}
Output:
(empty)

agents/test-file-runner.md
tps-report_confirmCaseCount
{3 items
reasoning:[2 items
0:"The test file 'scott/hamr.test.md' has two defined test cases: 'Create Customer' and 'Count customers'."
1:"Confirming the count to ensure the report accurately reflects the number of test cases."
]
testPath:"scott/hamr.test.md"
count:2
}
Output:
2

test-case-runner_test
{2 items
path:"scott/hamr.test.md"
caseIndex:0
}
Output:
{2 items
name:"AssertionError"
message:"thread exists: threads/the_9WMYG3ENQ22TQE5J/case_0/iteration_0.json"
}
test-case-runner_test
{2 items
path:"scott/hamr.test.md"
caseIndex:1
}
Output:
{2 items
name:"AssertionError"
message:"thread exists: threads/the_9WMYG3ENQ22TQE5J/case_1/iteration_0.json"
}
agents/test-file-runner.md
utils_reject
{1 item
message:"The test cases could not be run due to existing threads. The system indicated that threads already exist for the specified test cases."
}
Output:
null


---


Big Request

Unitary Actions

1. Do, or do not.  There is no 'try'. 
2. Overwrite, but only on success.

Explanation:

1. Files are being written to during a cascade of interim steps.  But if a later step fails, then you're left with a file that's just plain wrong.

E.g. this was what I think was behind the "elapsed time: 0" issue on running tests.

2. I'm seeing files being updated early in a cascade, but if the cascade fails, I've lost the previous one.  I know I could fork back, but it would be a lot more helpful if a failed cascade doesn't wipe out your previous one.  Then you can check if your meat-brain has just done the equivalent of "rmdir /"

---



