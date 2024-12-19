[12-Dec-24 6:48 AM] Scott Maxwell: Nope, none, other than having a shitty sleep cycle. BTW, where do I put in requests for artefact tools?  A really useful one would be to take two commits (logically they’d be say the same folder only with a bunch of diffs, that sort of change), do a concat style compression on each commit and then be able to talk to the bot about the diff concats.  E.g. each time I’m going through the cycle of definitions reconciliation it would be REALLY cool to talk to a bot about that reconciliation.  For now will stick it in as a manual text stuck in reasoning/stucks, but that tool would be awesome.
[12-Dec-24 6:57 AM] Tom Thompson 🧴: I'll have a think. That is useful.
[12-Dec-24 6:58 AM] Scott Maxwell: I also need to get WAY more disciplined in using git commits.  That’s an aside, but I’ve layered and layered up here and should be committing at some frequency less than ‘end of day’
[12-Dec-24 7:08 AM] Scott Maxwell: One observation that’s coming through very clear is that with these tools you can touch a lot of docs with a single prompt.  So what I was saying about why agentic probably will fade - chinese whispers.  It’s just not practical to figure out if you’ve fucked up by keying in “the troops to advance” instead of “a girl for a dance”.
[12-Dec-24 7:09 AM] Scott Maxwell: Containing complexity.  Getting more convinced day be day - that’s the battleground.
[12-Dec-24 7:10 AM] Scott Maxwell: Evals.  Tomorrow, let’s talk about Evals.  That at least is a safety net.  Suspecting it won’t be enough, but a start.
[12-Dec-24 7:41 AM] Scott Maxwell: OK, first, sorry for the text bombing you’re about to get.  But you did ask:
[12-Dec-24 7:42 AM] Scott Maxwell: It’s super-awkward to pull out the chats so I’ve cut, pasted and deleted relevant stuff.  This is also transient as it covered multiple threads.  So have editted it down.
[12-Dec-24 7:42 AM] Scott Maxwell: Prompt: I will give you a transcript between two people, Scott and Tom. The first person to talk is Tom. I want you to consider the transcript, and given the discussion, assign names to each of the lines, and feel free to break up some of the larger paragraphs. Make sure that you keep the timestamps in.  Here's the transcript:  

 <transcript inserted there>

Response: Below is the transcript with speaker labels and the same timestamps. Some longer segments have been broken into smaller paragraphs for clarity.

<Response editted transcript, which wasn't great>
[12-Dec-24 7:42 AM] Scott Maxwell: Prompt: Remove all of the superfluous words like 'um' and 'yeah' superfluous comments that are not discussing the main points being discussed, such as "1:13
Scott: um but uh I mean this is uh like a pony for Christmas" Keep ALL of the important comments that remain on-topic. 

Response:  <Getting much closer>
[12-Dec-24 7:42 AM] Scott Maxwell: Prompt:  Now, using your last response, make a full and descriptive summary of the topics, focusing on what was decided.

Response: <Lost some detail>

Prompt: No, make it complete.  Include references to the timestamps.  End with a detailed list of tasks and what to do next.

Response: <Pretty fucking good actually>
[12-Dec-24 7:43 AM] Scott Maxwell: Prompt:  The above is a good workflow.  I want to create a single prompt that produces both the stripped down original transcript and summaries like this.

[Bump over to a new thread, tried the prompt.  Then came back.]

Prompt: I tried that prompt.  Firstly, it didn't identify the speakers.  Second, it condensed the transcript too much and lost too much important data.  Third, I wanted it to produce two separate files.  The first is the condensed version of the transcript that is more succinct but doesn't lose information.  The second is the summary.  Exactly as you did above, but the prompt didn't produce that.  Rewrite the prompt

Response: <New Prompt.>
[12-Dec-24 7:43 AM] Scott Maxwell: [Bump over to another new thread to check prompt v2 out, then back to the initial thread]

Prompt:  This is good, but get the prompt to ask who the first speaker's name and the second speaker's name is.

Response:

[This prompt: 

Prompt Template:

You are a careful and structured assistant. I will provide you with a transcript. Before you begin processing it, ask me to confirm the names of the first speaker and the second speaker. Once I confirm the names, you will then proceed with the following steps exactly, and in the order given. Do not skip any steps. Do not add extra commentary outside of what is requested.

Instructions:
	1.	Ask for Speaker Confirmation:
	•	After I provide the transcript, first ask: “Who is the first speaker and who is the second speaker?”
	•	Wait for me to provide the exact names corresponding to the speakers.
	2.	Identify Speakers and Timestamps:
	•	After I confirm the speaker names, re-check the transcript.
	•	Every line in the final outputs must retain its original timestamp and speaker labels using the exact confirmed names.
	3.	Condensed Transcript (File 1):
	•	Create a condensed version of the transcript.
	•	Remove filler words (“um,” “uh,” “yeah,” “like,” “you know,” etc.).
	•	Remove off-topic, non-substantive banter that does not contribute to the main reasoning, decisions, tools, or conceptual understanding.
	•	Do NOT remove actual content or important reasoning steps. Keep all essential information, decisions, and concepts intact. The goal is to make the transcript more succinct, not to shorten it arbitrarily.
	•	Do NOT lose information: all main points, decisions, and technical details discussed must remain.
	•	Keep the original timestamps exactly as they are and the exact speaker labels as confirmed.
	•	Present this condensed transcript as “File 1: Condensed Transcript”.
	4.	Comprehensive Summary (File 2):
	•	After producing the condensed transcript, produce a full and descriptive summary of the key decisions and concepts discussed.
	•	Reference timestamps in the summary to tie major decisions back to points in the conversation.
	•	End the summary with a detailed list of next steps or tasks based on the decisions made.
	•	Present this summary as “File 2: Summary and Next Steps”.
	5.	Final Output Format:
	•	Your final answer should contain two separate files (after I confirm the speaker names and you process the transcript).
	•	The first file is the condensed transcript. Label it as “File 1: Condensed Transcript”.
	•	The second file is the summary. Label it as “File 2: Summary and Next Steps”.
[12-Dec-24 7:43 AM] Scott Maxwell: RESULT OF RUNNING THIS AS IS ON A NON-DIARISED YOUTUBE TRANSCRIPT:

---
FILE ONE (condensed transcript):

File 1: Condensed Transcript
0:01 [Tom]: We’re off now. I got some stuff for you.
0:10 [Tom]: I wish I could see token burn rate stats. I probably burned between 60 and 1 worth today. About spending $200—this is maybe the best deal. I feel like I’m getting a lot of consumption. They extract their pound of flesh.
0:52 [Tom]: Based on your encouragement, I shouldn’t code anymore. I should reason first, get specs right, define interfaces, then have code rendered by the bot, not typed by hand. Thanks for disrupting my old workflow.
1:43 [Tom]: The biggest difference today is I can pass the entire codebase into the context window because it’s effectively “free.” Before, when it was expensive, I resisted. Now, I give the entire contents of every file to ask even simple questions.
2:24 [Tom]: I made a tool and sent you a link.
2:35 [Scott]: I installed it and tried to run it, got an error. I’ll fix it.
2:57 [Tom]: Let’s go into a repository. This tool is published on jsr, scores 100% on jsr score. It has best practices. It was generated by the bot across several threads. The value is in refactoring and modifying code.
4:51 [Tom]: This tool, “concat,” concatenates files, recursively if needed, and counts tokens. I can feed entire directories into the context.
5:45 [Tom]: For example, “concat” can process multiple files, output a single dump file, and tell me token counts. With large context windows, I can easily include all relevant files.
7:13 [Tom]: Everything together might be twice the context window, so I can choose subsets. For example, domains alone are about 26k tokens, easy to handle.
8:20 [Tom]: The format uses demarcation lines with paths and “end file” markers. I can copy the entire dump into the model and ask questions. It works very well.
9:10 [Tom]: I’ve been getting good results. I can load an entire codebase, ask what’s wrong, and it might find spelling mistakes or acronyms. Quality is high.
10:05 [Tom]: This approach is better than previous tools like “consider at” because I can specify paths and choose what to load. It’s flexible.
11:53 [Tom]: I can now ask complex multi-step questions without confusing the model. It’s resilient.
12:58 [Tom]: I can highlight certain folders or files as higher priority. The model respects that.
17:05 [Tom]: The new model (01 Pro) doesn’t get confused by large amounts of data. It’s stable, logical, and can handle big context windows gracefully.
17:56 [Tom]: It finds subtle errors, logical consistency issues, and refactors code well. The code generation is stable and minimal in changes.
21:02 [Tom]: I think the model can now reason fully over the entire input. It’s like the resolution of understanding is higher. No contradictions, more reliable.
24:00 [Tom]: I’m reverse-engineering specs from code by feeding the code to the model and asking it to infer requirements. It works well. This saves time.
26:12 [Tom]: The model’s code outputs are stable and consistent. It remembers context better.
27:45 [Tom]: I’ll create specs from code, then combine all specs into a higher-level reasoning layer, focusing on interfaces between modules.
29:59 [Tom]: With “concat,” I can isolate sets of files like all “readme” files for a domain and feed them in to get coherent summaries. It’s simple and powerful.
31:08 [Tom]: With about 128k tokens, I can handle large modules easily. This is more than enough for complex projects.
33:00 [Tom]: The model might not give all details first time because some files lack info. I can refine by adjusting the input sets.
41:31 [Tom]: The new image/video capabilities (Sora) show that advanced reasoning about physics and reality is emerging. This is a hint of what’s possible.
43:42 [Tom]: I’ll focus on finishing my specs. With this tool, I’m going to finalize domain definitions and reasoning layers.
45:50 [Scott]: I’ll install “concat” and start using it to reason about domains and definitions.
46:40 [Tom]: Once you have “concat,” we can handle large inputs easily, making meta reasoning simpler.
48:43 [Tom]: Good. Let’s do domain reasoning first. Later, we can handle meta reasoning.
49:54 [Tom]: Let’s just pick a domain and do it. Then we’ll integrate.
53:01 [Scott]: I’ll use my own reasoning for now, define domains, then use the tool, and we’ll integrate later.
54:43 [Tom]: Perfect, do that, and then I’ll integrate your domain definitions.
55:12 [Scott]: Sounds good, I’ll stop now.

---

FILE TWO: Summary

Throughout the conversation, Tom and Scott discuss a new workflow enabled by a large-context LLM (“01 Pro”) and a custom “concat” tool. Instead of coding by hand, Tom now focuses on reasoning, specifying interfaces, and providing entire codebases as context to the LLM. At 0:52–1:16, Tom acknowledges shifting to a “reason first” approach and using the model to generate code. By 1:43–2:07, Tom realizes passing the entire codebase into context is now affordable and effective. At 4:51–9:10, Tom explains how “concat” creates a single dump file of multiple code files, including token counts, allowing the model to see all relevant content at once.

From 10:05–11:53 and 17:05–21:02, they note the model’s improved logical consistency, fewer contradictions, stable code outputs, and refined error detection—significantly better than earlier models. At 24:00–29:59, Tom describes reversing specs from code and using “concat” to selectively provide readme files for coherent summaries. By 31:08–33:00, they confirm that a 128k-token context is ample. The conversation (41:31) also touches on advanced model capabilities (like Sora for images/videos) that infer physics and reality.

Finally, at 45:50–55:12, they agree that Scott will install “concat” and use it to reason about domain definitions. They’ll integrate results later and eventually address meta reasoning once foundational reasoning is established.

Next Steps:
• Scott will install and use “concat” to process and summarize domain files (45:50–46:40).
• Scott will manually define domain concepts and interfaces (49:54–53:01).
• Tom will integrate these domain definitions and specifications into a higher-level reasoning layer (54:43–55:12).
• Both will eventually revisit meta reasoning after completing core domain reasoning.
[12-Dec-24 7:44 AM] Scott Maxwell: That’s pretty tight.  Have been using this in a similar way to you’d use a bash script - basically if you need to do it more than once, go through a loop like this.
[12-Dec-24 7:46 AM] Scott Maxwell: OK, tomorrow it would be really helpful to go through how to ride this bloody mustang…. It’s going to get hard pretty soon, and we’ve glossed over it a bit in terms of repo.  E.g where do I put a prompt that doesn’t need any artifact calls?
[12-Dec-24 7:46 AM] Scott Maxwell: Signing off now.  See you in 11 hrs and 16 mins
[12-Dec-24 7:49 AM] Scott Maxwell: Oh, one last thing forgot to mention.  If the condensed transcript loses info, because of concat I put them both together and prompt the bot to say that the original transcript has higher resolution timestamps, but they both refer to the same time start, so I can drill down.  That’s been a cool tool.
[12-Dec-24 7:51 AM] Scott Maxwell: I suspect that pattern will be useful more generally.  Just have run out of time today.  Will commit my messy commit now, but check it out only out of curiosity as we still don’t have (well, see above ref How to Ride a Mustang)
[12-Dec-24 8:24 AM] Scott Maxwell: Can I just check you got the additional texts after your last?  It’s not syncing with your phone and may be helpful for today your time
[12-Dec-24 8:24 AM] Scott Maxwell: *My phone.  As it, it looks delivered on
laptop, but phone denying all knowledge
