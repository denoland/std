0:03 [Tom]: The situation is we've had 01 Pro for 13 days.  
0:09 [Tom]: We've burned between 60 and 100 bucks worth of tokens every day, an unprofitable amount from OpenAI’s perspective.  
0:16 [Scott]: True, and we've been at it nearly around the clock.  
0:22 [Tom]: We’ve made tools to hit its context window limit, which turns out to be 200k tokens.  
1:11 [Tom]: First problem: I can get 01 to make advanced software just by chatting, more advanced than I can manually. This will get more extreme in a few years. The cost of software will approach zero. What should a software engineer do in such a world? As a startup, we should cash in quickly before this advantage disappears.  
2:30 [Tom]: We must decide what to push on, because soon everyone can generate code cheaply, nullifying our advantage.  
3:33 [Tom]: Second problem: Now that code generation is easy, my previous role was coding and yours was inference. Now I can do both. What's the best configuration for our partnership?  
4:44 [Tom]: With 01 Pro, I can handle tasks you did plus coding. What’s most effective for us now?  
5:22 [Tom]: We should think of Dream Catcher Command as an entity. Even though it can’t think yet, soon it might. We should ask it questions from its own perspective. Our capabilities have radically changed.  
6:35 [Tom]: Third problem: The trucking guys can’t survive without software. Now we can make code rapidly. Before, we forced them onto our platform because code was hard to produce. Now code is easy, so maybe they don’t need to run on our platform. They’re ready to pay. We must figure out a deal that doesn’t hurt our principles but helps them and us. Also, we must reassess our roles and whether we need more people.  
9:33 [Tom]: Summarizing:  
- Problem 1: Future of coding and our advantage.  
- Problem 2: Our partnership configuration now that AI can do both coding and inference.  
- Problem 3: The trucking clients need a solution urgently.  
10:14 [Scott]: The skill now is going meta—meta on code and prompting. We can generate a lot quickly, but that can overwhelm us. We need structures (like knowledge trees) to prevent choking on complexity.  
11:19 [Tom]: We produce correct stuff so fast we can’t process it. 
11:26 [Scott]: Trusting it blindly is dangerous. We must manage complexity carefully.  
11:45 [Scott]: We have history and a shared understanding. We’re both going meta, converging in the same conceptual space.  
14:09 [Scott]: We must accelerate our acceleration.  We can do this by going meta on our knowledge structures.
15:02 [Scott]: At the same time, we must deliver the trucking app.  We can do this by using our new code generation capabilities.
14:40 [Tom]: About the trucking guys: we could solve their problem quickly, but we haven’t. We’re stuck defining Dream Catcher perfectly. Maybe just deliver something concrete now.  
15:50 [Tom]: My wife’s input helped clarify options:  
- M&A for revenue stability. Risky if we pick wrong targets or the market changes.  
- Selling software short-term, capitalizing on our current code-generation advantage.  
- Building our blockchain might be cheaper and less risky long-term.  
- Just deliver the trucking app quickly using our new code speed, then decide next steps.  
19:04 [Scott]: Complexity is the key metric. We need Commander to handle complexity.  If we can't handle complexity, we can't do any of those.  Commander relies on our knowledge structures.
19:30 [Tom]: Let’s consider doing the trucking app first, while simultaneously building Commander to manage complexity.  
20:02 [Tom]: Plan: I focus on delivering the trucking app with rapid code generation. You focus on Commander and knowledge structures. After that, we integrate blockchain.  
22:02 [Tom]: We agree: Commander first to handle complexity, then blockchain.  
23:01 [Scott]: Commander’s knowledge structure is priority so we can deal with acceleration.  
24:05 [Tom]: I can do trucking without Commander, but it’s better with it.  
25:02 [Scott]: Commander leads to blockchain. Blockchain depends on good complexity management.  
26:09 [Tom]: Resolve complexity first, then trucking, then blockchain. Defer M&A until we have a stable platform.  
27:04 [Tom]: Our advantage is temporary; we must build tools and capture value quickly.  
28:16 [Scott]: After delivering Commandertrucking and then progressing on blockchain, we re-check M&A or other moves.  
29:04 [Scott]: Record contributions for later attribution.  
30:01 [Scott]: Commander essential for complexity and scaling.  
31:03 [Tom]: Trucking for immediate revenue, blockchain for long-term, Commander for complexity.  
32:02 [Tom]: Final approach: Tom does trucking, Scott does Commander and knowledge structure, then blockchain, M&A later.  
32:49 [Tom]: Good, next topic. That was fast. Another thing: 01 API landed today.  
33:01 [Tom]: 01 now supports tool calls, structured outputs, better than 4.0 at tool usage. I haven’t checked docs yet.  
33:33 [Tom]: We have 01 with structured calls and an “effort” parameter (low/medium/high) affecting reasoning and cost. Pro level might be “ultra.” Models are pricey, $60 per million tokens.  
35:09 [Tom]: The trucking app vs. building a platform that harnesses 01’s power: It can spawn instances, break down problems, and loop to correct errors.  
39:32 [Tom]: I know how to build a platform that splits tasks and uses 01 to solve them concurrently. This competes with trucking app work. How to prioritize?  
40:14 [Tom]: 01 Pro is slower now, maybe load issues. I don’t want manual cut/paste. I want automation to handle waiting and context switching.  
41:06 [Tom]: Juggling multiple tasks in parallel is hard. A platform that “spins the plates” automatically would help.  
42:11 [Scott]: The complexity of context management: waiting for summaries, pasting, losing info. Also serverless functions timeout because 01’s reasoning is slow. Everything breaks. Need stability.  
43:10 [Tom]: Maybe I can do trucking and the tool at once. The tool is basically this platform. The front end, plus a coding environment.  
44:10 [Scott]: We still need a platform to test strategies for using 01 effectively. 
45:17 [Scott]: My usage so far is mostly pointing 01 at stashed text in github and stashing the results from the AI. 
46:09 [Scott]: Issues: scattered data in different branches, hard to reason. With a knowledge hierarchy we can manage complexity.  
47:05 [Tom]: This is trivial to implement in the platform. If we defer parallel execution and just use artifact as a database (via git), we maintain our path to a blockchain later.  
48:26 [Tom]: Still need a “stuck nap” (task structure). Need data structures for stucks so that pressing “stuck” in the UI triggers actions.  
49:17 [Scott]: The stuck button would generate a new nap context. Store results, refer to them in smaller contexts. Target specific folders/files.  
50:16 [Tom]: We need naps, artifact, but without execution. AI in the browser, storing results into artifact. 
50:30 [Scott]: Without large context windows we must chunk, so we need a tool to aim the AI at specific files. 
51:04 [Tom]: We need the nap execution environment for tool calls. We agreed on that. 
51:20: [Scott]: Every time I change reasoning repo, we need to reconcile.  
51:52 [Tom]: Also need per-user billing. Running this setup is expensive. Don’t want accidental big bills.  
53:32 [Tom]: The cost might drop over time. We can use smaller models if needed. Prioritize “fundamental” automation that boosts everything else. 
54:50 [Tom]: Instead of manually coding trucking by copy-paste, build the amplifying tool first. If risk, we’ll adapt. Start tomorrow: build naps format and amplifying tool, integrate into front end. Then deliver the trucking app on top.  
55:39 [Scott]: Estimating trucking app time is hard. Maybe just do it.  
56:09 [Tom]: I’ll try something for a day and see, then we’ll refine.  
56:22 [Scott]: With Commander, we can generate retrospectives. Until then, manual steps.  
56:47 [Tom]: I need you to act as project manager, like the Commander’s stand-in. You track tasks (“stucks”), clarifying them.  
57:30 [Tom]: You can provoke refinement of tasks so we can reason better.  
59:29 [Tom]: As project manager, you’d also help with estimates. 
1:00:40 [Tom]: Over time, we can forecast better. A “stuck report” after completion: what went wrong, delays. Identify common snags.  
1:02:16 [Tom]: Maybe you do QA. With 01 Pro, you can check code and system performance. If I say stuck solved, you verify.  
1:03:01 [Scott]: This builds a cycle of improvement. We accumulate data and can prove our productivity.  
1:04:06 [Tom]: With code nearly free for us, we can offer cheaper, high-quality solutions at a big margin. It’s fair since we invested heavily.  
1:05:47 [Tom]: When we get paid for the trucking app, we know our cost structure. If profitable, great. If not, adjust.  
1:06:17 [Scott]: New Topic: looked at your project map. It’s close to my thinking for Commander. But it’s in another repo.  
1:06:51 [Tom]: We have multiple repos. Hard to unify reasoning. Let’s put everything into one big repo.  
1:07:19 [Scott]: Commander is a nap, so all naps in one place. Single repo, main branch plus branches for each of us. QA merges.  
1:08:57 [Tom]: Currently three active repos: UI front end, naps repo, reasoning repo. We’ll merge them. Just commit by day’s end, I’ll unify tomorrow.  
1:09:35 [Tom]: Briefing folder structure similar to what I came up with. We align on hierarchical knowledge structure, read folder, summaries folder, stucks.  
1:11:10 [Tom]: Tasks = stucks. Introducing concept of stuck horizons. 
1:12:22 [Scott]: Stucks can break down into smaller stucks. We can represent these as a graph of dependencies.  
1:14:22 [Scott]: A data structure for stucks is crucial. Graph-based, multiverse-compatible for different opinions.  
1:15:40 [Scott]: I’ll define the stuck data structure, parse and prompt it so Commander understands. I'll specify what is needed, you implement the tools.  


