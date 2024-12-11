0:02
Tom: Okay, here we go. What’s on your list? I’ve been sandboxing one pro, got a couple thoughts on it.

0:09
Tom: We should go through my stack. At the top is using 0 Pro to reason about reasoning, which we were discussing yesterday. I haven’t started yet, because I thought about the part of telling me why cursor is 50% of the reasoning tool you desire.

0:30
Scott: That comes down to what cursor allows you to do: aim at targets, scoping particular folders and files. There’s still a high cognitive load on choosing those.

1:13
Scott: The perfect thing is to disregard information. Reasoning comes down to what to ignore, not what to consider. Once you know what to consider, that’s fine. The hard part is knowing what to ignore.

1:48
Tom: I haven’t been using it that way. I’ve been using definitions, stuffing them all in. You’re telling me how I’d benefit from ignoring some things?

2:10
Scott: Consider adding transcripts. I don’t know what’s relevant. It doesn’t know what I think is relevant. For reasoning about reasoning, it may be more important to know what to disregard from a large body of knowledge.

2:31
Tom: You just restated it. Give an example.

2:38
Scott: For example, we have a set of definitions—say, the dream catcher definition. We can add as many definitions as we want, but that doesn’t make it tight. The interesting part is reducing the number of definitions.

3:22
Tom: Is that what you meant by what to leave out?

3:28
Scott: Exactly. Distillation of reasoning is all that reasoning is. With a model that knows a lot, we don’t need all that; we need it to talk about a subset. Two parts: first, guardrails—ignore anything outside this body of knowledge; second, can it be stated more succinctly without losing information?

4:21
Tom: How does cursor fail to deliver that? Are you wanting principles baked into a nap so it’s always doing that, otherwise you must repeat the same question?

4:35
Scott: There’s a cognitive load now. With new models, it shouldn’t be on me. Also, we could do repetitive calls that burn a thousand calls trying to distill from different angles. I don’t care if it takes an hour, as long as it understands what to consider or ignore.

5:09
Tom: This touches on something: we need crawlers. We should set up crawlers for YouTube channels on AI, digest transcripts, figure out new concepts, reconcile with existing knowledge. Things are changing fast. One thing we must do is have a platform adaptable rapidly. It’s not about a finished product, but something we can turn into new things as they appear.

6:00
Scott: An adaptive system where we plug in different things. Keeping up with changes has forced us to keep shifting our approach. We’re doing okay, but not fully connected. We’re still passive, discovering novelty in old ways. We need a system constantly crawling, like Neo crawling the internet, always looking for more.

6:41
Tom: Consider evidence presented by a crawler. We know how to transcribe, summarize, identify main themes, go from themes to practices, then integrate into our core. Something new comes up; how does it impact dream catcher? To think about thinking, we need a subject and a framework. Logic and fallacies given 2,500 years ago. We could have modules like a fallacy checker. We must assemble structures, plug things in, experiment, find personal preferences, adapt to new models. We need a platform for crawling, reasoning, and so forth.

8:09
Tom: AI must surely be something always running in the background on our behalf. We have no such system. It needs to grind in the background. Current AI (like ChatGPT) does nothing unless prompted. Why not say: over the next year, keep considering this? We don’t know if it’s possible, but we need to build one thing that can adapt. Without that, we risk getting stuck on partial solutions.

10:05
Tom: When you said cursor is only 50% of the Reasoner you need, you meant less about triggers or long AI and more about reducing cognitive load in choosing what to consider. You want agents pre-programmed to do reasoning, point them at files, test new theories of reasoning improvement, plug in new naps, and reduce the repetitive manual prompting.

11:08
Tom: Another aspect: working on reasoning, then triggering agents whenever something changes. If you modify a file, you want a reconciliation step to ensure changes still fit all the rules.

11:16
Scott: This is like eval: have we introduced unintended consequences? Eval means generating synthetic inputs and checking expectations. It’s a build-time tool ensuring correct behavior due to prompting, code, naps. The eval ensures quality.

12:34
Tom: You’re talking about something else: not runtime checks, but when we change the core and compile it to schema. After changing the core, are all required outcomes still correct? Evaluations could highlight unintended consequences. It’s like continuous integration for reasoning.

14:43
Tom: So you want a test framework. Also, a reasoning tool that knows context without specifying folders each time. Each reasoning domain is a nap with agents and evals. Implementation details like schemas arise from reasoning renders.

17:02
Scott: Running evals against rendered schemas amplifies reasoning errors, allowing refinement.

19:52
Tom: I’ve started using reasoning to produce code. It’s hard to begin but cleaner once started. The main difficulty is tooling: cut/paste, selecting multiple files. Ideally, I’d highlight certain files or changes and ask questions about how they fit the reasoning. The reasoning should always be relevant.

30:07
Tom: If reasoning is too large for the context window, we’ve gone wrong. It’s a sign it’s too big for human understanding as well. Reasoning should define boundaries clearly.

31:16
Tom: Reasoning aligns with the human layer rather than typing code by hand. I’d choose this approach after one day over my previous decades of coding. The benefit will appear more in subsequent passes—when extending or integrating modules. If reasoning is done well, adjusting code should be straightforward.

33:40
Tom: Intent is what I’m doing at the moment. Reasoning provides context and constraints so the bot can guess my intent correctly. We don’t need to capture intent explicitly since it’s always inferred. Good reasoning stands on its own.

34:22
Tom: The results feel cleaner. Speed and quality improve over multiple passes. First pass, you can produce code anyway. The difference emerges with faults, extensions, reconciliation. If two modules must fit together, reasoning guides the integration. Code is rendered from reasoning; editing code just means following reasoning again.

35:44
Scott: Even with advanced models coming, the principle remains stable. It’s the way to go. No matter how good AI gets, it can’t take one giant step. Complex problems require multiple steps. Reasoning provides a stable layer for humans and AI to meet. Humans have limited cognitive capacity, so reasoning is essential to communicate complex ideas sustainably, across time and technology changes.

40:02
Tom: Without reasoning recorded, future readers must reconstruct it. If reasoning is written down, new methods or technologies can be applied quickly. Reasoning plus code means a nap can explain its own code. It’s a foundation to build on, no matter how the underlying tech changes.

42:27
Tom: I questioned using reasoning or artifact yesterday, but now you’ve tried it. It seems the right way. I was checking in because I sounded harsh before. No apology needed, it made sense.

42:53
Scott: Now I must apply these tools to reason about reasoning. We’ll figure it out as we go.

43:13
Tom: What’s the interface for reasoning across modules? For example, if one domain needs a KV store, it should discover that get KV fits. We’d load both sets of reasoning, see if get KV meets the needs. It’s reasoning-to-reasoning, possibly via an agent representing get KV. We ask questions, it answers, we reconcile results. It’s discovery, negotiation of capabilities.

47:00
Tom: I have to go now. We’ll think about partial fits later. Let’s get our systems up and running first.

47:19
Tom: Stopping the recording now.

47:22
Scott: Yes, go for it.