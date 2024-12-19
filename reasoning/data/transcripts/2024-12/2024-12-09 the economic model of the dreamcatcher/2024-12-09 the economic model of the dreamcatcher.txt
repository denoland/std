[0:00:00 - Tom]
Okay, buddy, we’re on. So thanks for taking the time. The reason why I’m rushing out is I’m just a little bit rattled about the model context and how that affects NAPS or the utility of NAPS. So I’m just, I don’t know, did you get a chance to school up on what the MCP was about?

[0:00:32 - Ben]
Yeah, yeah.

[0:00:33 - Tom]
Yeah.

[0:00:34 - Ben]
I watched the video, I read the docs a bit I came up with a little thought experiment to help you okay great okay so what if you were to just implement MCP as another interface into your own system that seemed like a necessary thing. Right. Anyway. So, why I think that would actually help you, why it would like make you feel less shook about what you’re doing, is because it’s going to, when you do that, it’s going to show you the hard line between like all the other stuff that you’ve built and like what this thing is meant for, right?

So, like from what I can see in it, it looked like it’s a fairly agnostic tool, right? It needs a back end. It’s basically providing a front end to the LLM, and you write a server as a back end, right?

[0:01:45 - Tom]
Yeah.

[0:01:46 - Ben]
So, if you were to just implement that server, I think you would pretty quickly see what parts of what you’ve built already are not included in MCFLAG. What they built there is a pretty thin thing, in my opinion.

[0:02:00 - Tom]
It’s just basically… Right, but like I can see how you could easily wrap the NAPS interface with MCP and then you’re like, ta-da, every NAP is now MCP compatible. And you know, trivially, you could also make NAPS call MCP servers where other people were building MCP based services and all that. I suppose that like building NAPS and promoting NAPS is a lot of work and I’m just wondering if that might be like MCPs close enough that it might not be worth the heartache to build because NAPS is basically the evolution of covenants or how to package code, right? And I’m like, well, if MCP kind of allows you to be really shitty with your packaging or do it any way you like and then present a nice clean interface that achieves the same, I’m like, well, what’s the thing that we’re doing, I guess? Because I’ve got a lot of things that I know are cool sitting around, but independently they’re not that much cooler. And so the painful question is, the thing we want is the Dreamcatcher, maybe we should just build it cobbled together out of bastardized pieces because building it purely is a little bit of a slog.

[0:03:49 - Ben]
I can see that. You know, I do think that the introduction of something like MCP, by the way, I think, was it the spinning head thing in Tron called the MCP? It’s like a cheeky name, yeah.

[0:04:05 - Tom]
You know the thing I’m talking about.

[0:04:06 - Ben]
Have you ever seen the movie Tron? Yep. The bad guy in that movie is called the Master Control Program, and it’s a big spinning head that yells at everyone. Oh, that’s funny, no I didn’t.

Joy.

[0:04:19 - Tom]
So I think these guys were being a little bit jokey with that name. Right.

[0:04:27 - Ben]
But anyway, they’re going to bring a rush of people into like, let’s connect everything possible into LLMs, right? Right. And like, that’s the thing that’s got you feeling a little bit nervous is like, you know, you were obviously hoping for like people to do that.

[0:04:50 - Tom]
Yeah, yeah, but that’s like that’s a that’s a sort of not what I meant, but that like wanting it to be through us is not a healthy thing to want. Like wanting it to happen at all great, to be in the game when it happens, yep, that’s cool. I guess defeat for us is when something lands that’s close enough to the utility that people would get from us that we are now worthless because the incremental change is not worth the risk to switch. Plus, if someone’s way more funded, way more advanced and has an insertion point with several million customers already, like that’s just a waste of time. So I guess the question I have is a bit deeper and it’s not very well formed. I’m just sort of left like, because we’ve also found that there’s a number of Decentralized compute platforms like v0 or a left zero there’s a few others around that are able to run AI agents in a decentralized fashion on a blockchain, so I’m like well, that’s not… You know, everyone knew that that was possible. Yeah, we had one way of doing it and I guess I’m losing the shine as to why our architecture using this, the design goals of our architecture seem eroded now, like there’s lots of close enough things. They ain’t pure and they’re not nice and clean, but does that distinction matter, I guess?

[0:06:56 - Ben]
I mean, if you want my honest opinion, and not to bum you out more, no, it doesn’t matter. You know, everything evolves as incremental step changes to things in the past, right? It was always going to be an inevitability that every good idea you ever had, like someone else was probably having it at the same time, right? And like, or before, yeah. And that’s because like the frontier is like a, it is a fixed thing, right? It is like, you know, everybody that wants to be at the frontier will be at the frontier, right? Yeah, the frontier doesn’t, like, the thing is you can reach the front line very quickly, and once you’re there, there are millions of people there. So the chance that you find something novel is near zero.

[0:07:44 - Tom]
Right, but then the challenge of real software is like, just having the new cool gadget is like, fine, but it doesn’t actually solve a lot of the harder problems of building big systems, right?

[0:08:01 - Ben]
Right, and it doesn’t even touch on things like equity management or economic coordination. I do think that one of the things that I thought while I was watching that video…

[0:08:13 - Tom]
…about MCP is it’s cool that you could get agents to pull things from your file system, like push them around, poke at them with other agents, with search APIs, whatever, right? And then put these back on your hard drive.

[0:08:23 - Ben]
I still wouldn’t want to ask that thing to do banking for me, right? Because the reason why blockchain happened in the first place is because it’s, you know, I think, let me back up a little tiny bit here. I have been working an awful lot with a complicated system recently that needs to be spun up in a billion different environments. It’s run in a billion different ways. It has its own module system or it could be run in K8s, or it could be run locally on your machine in a bunch of Docker containers. You know what you need to actually keep something like that coherent, is an absolutely incredible first-class logging experience between all the components, especially as you’ve exploded out into like 800 microservices or whatever, right?

Logging on that system is still absolutely like an afterthought. It’s a bolt-on feature, right? It’s like, okay, we can stick it here on the network agents between the microservices that are running, and that way every single bit of traffic that’s going around the whole network is… Sort of logging the bus or the fabric as it were. But like, you know, I think what history will prove about blockchain is that like if you made logging a very central concern, right, if you said that like no program can run but through a log, and that log is actually the thing that’s doing the work, right?

The log is the bus. It’s like, yeah, you are not capable of building a piece of software that does not log every single bit of internal process, right?

[0:10:32 - Tom]
And that’s… So basically, at what point does maintaining the complete application state at every meaningful interval become less work and data than the logging? I’d argue it’s pretty soon, like it’s pretty early on that that advantage kicks in.

[0:11:14 - Tom]
Yeah, and the key element, the key software property that enables that is repeatable computing. That’s what makes it all happen. And as soon as you lose repeatability, which honestly in Hello World, you can lose it within a few lines of that and it will become such a nightmare to get it back. If you manage to hold it from the start, then you can do all these magical things if you have repeatability.

[0:11:44 - Ben]
Right, because you’re pushing, like okay, the very first program you ever wrote is running in an impure way, because it has to take IO, right? It has to take things from a person, and it has to give things to a person. And like, that’s a boundary that like, you lose every purity.

[0:12:01 - Tom]
Like your first experience is impure. Yeah. So like it,

[0:12:08 - Ben]
it’s a worthwhile experiment to try and build systems that are resilient, repeatable, like basically, you know, the log is the interface into the program rather than an afterthought. Yeah.

[0:12:19 - Tom]
And something that I’ve grown quite attached to is this ability to have it be Git compatible. Not because of the immutability properties of Git, but simply the compatibility because like I can, it seems like what I really wanted now that I’ve sort of spent a lot of time trying to get the things I want… It was self-sovereignty of data and a level of understandability of what went on. And if I have a Git repo that represents my data and how it got there, I feel significantly safer that I’m never going to be locked in. Even having my data on the Ethereum chain, even while that thing is in full operation, I don’t feel like I can really touch it because it’s a bunch of freaking binary Hicks registers that I have to actually… I’m like, where is my stuff and it costs like a thousand bucks a minute… Oh, sorry a thousand bucks a kilobyte even and I’m like, that’s not… It’s sort of what I wanted, but it doesn’t have the portability. You know, it has a bonkers assumption built into it, right? Which is that we all have to be cooperating in one compute space together. Right, and so I guess the multiple chains concept, I don’t think that’s really run its course yet, so that’s still valuable to push, but I’m just like, why would anyone care about it is kind of what I’m starting to ask because there’s all these things that are ticking the boxes of more and more the features that that was gonna unlock.

[0:14:12 - Ben]
I’m not gonna lie. I’ve been there too, right, like what’s the value of any tool is what you can build with it. And like, I tend to view all these things as tools, right? I mean, even AI itself, right? I think that like, it’s great. You know, it makes me a little bit sad that some people are like already using it as like a wedge to try and like displace workers again. Like everything new that I’ve seen. That’s as old as the hills.

[0:14:44 - Tom]
I mean, even blockchain was meant to displace workers. It was not just for putting people out of work or making them worthless, but simply to allow them to move on to more elevated pursuits rather than things that are just… You know, humans have within them something magical which is that you can say shit that’s never been said before. And now I’m, as far as I can see, no matter how you improve that architecture, it still lacks the spark of novelty. It’s an un-novel machine that can appear novel because it drew on the novelty of other humans, or it allowed you to… it told you something that you’ve never heard of and you’re like, oh, that’s brilliant. But actually like, if you took the sum of all human knowledge… Well, it is pretty magical, right?

[0:15:35 - Ben]
When you’re like, wow, I just built this thing in a language I never used before, or like, I learned how this tool works. Yeah, yeah, yeah.

[0:15:43 - Tom]
So part of what I see my job as, or my duty as, is to also keep steering in a way that accommodates the latest developments in the technical sector as well. I’m not saying that I’ve seen enough signals to quit, but I’m saying that I’m seeing signals that indicate a corrective movement is coming for the Dreamcatcher and how we go about it. And so how much time have we got by the way, because I can sort of reduce my output tokens to accommodate.

[0:16:23 - Ben]
I have like 30 more minutes.

[0:16:28 - Tom]
30 more minutes. Okay. All right. So O1 full just came out and I love it. ChatGPTPro came out and I’ve been using that all day today. It’s starting to give me the feeling that for a time, the best AI is going to be non-repeatable and closed source, but then there’s going to come a time when, like if I imagine, if I was being generous, I’d say two years and there’ll be open source models that can do right now. And open source model means you can run it on chain.

But for the meantime, you’ve got to just eat shit and just take the private option. So there’s not really a good selling point for a repeatable system, but there will be soon. So that’s one area, right? The second area appears to be that what all this chat-based interaction did was it changed very discreetly how a person interacts with an application of any kind. Because a traditional web app is like, here’s all your tools, paint, artist, paint. And you can go from here to there to there. Like, if you were watching a typical user use an app, you need to have an incredible amount of understanding of that app to know what they were trying to do because the interface, it’s used imperatively. Like the user is implying what they’re trying to do. But a chat-based interface makes it suddenly be declarative. It makes it be discrete tasks, like first of all, you’ve got a concept of a chat. So you typically want to achieve a single thing in that chat, but yeah, also you can segment that chat into different objectives or tasks and it’s pretty obvious when that person has changed, right? But you don’t get that with a traditional system and so why that’s a big deal is because you can put a fix me button on the current task that you can’t put in a traditional app because the fix me button in a chat based interface can capture exactly what they were trying to do in that area, but you can’t digitize or package up faults in a traditional user interface in that way because it doesn’t, it just doesn’t, it doesn’t package, it doesn’t unit well.

[0:19:29 - Ben]
Yeah, I mean the way I tend to think of that is it’s not serialized, right? Like the thing that’s going on inside the model in the memory in the traditional realization, right, it forces realization, which is a brilliant thing as a side effect because it makes the program simpler. Mm-hmm. Yeah.

Arguably, it’s the reason why people like things like microservice architecture or like want to build more network-based apps, right?

[0:19:56 - Tom]
It’s because it’s another like forced serialization.

Yeah. Yeah. So If I take that and then I take the fact that where the AI models are going and that they’re getting incredibly powerful… Yeah, we’re starting to use O1 as the reasoner. So like we level up one and sort of try to talk to it about what should we do and why should we do it, as opposed to like “What’s the weather in San Francisco?” You know, like we’ve gone well past the gimmicky chatbot thing to like “Tell me how to live my life, please.” And so, yeah, I guess I’m saying, well, what should I do?

[0:20:54 - Ben]
What to do now, yeah.

[0:20:56 - Tom]
So, I mean, I want to go back to something that you said.

[0:21:00 - Ben]
I think you said that humans are the ones that have the spark, right? The spark, yeah. And I think what you’ve always said to me about a Dreamcatcher is like, what if there was a net that could catch all those sparks?

[0:21:19 - Tom]
Yeah, well I’d catch the sparks. Because they’re very fleeting, they’re very faint and they often arrive quite muddied like a dirty spark plug in a bunch of other stuff, but they’re still there and they die when they don’t get connected to other sparks. And there’s no such social network right now that tries to develop the sparkle inside of people to sort of let people make more stuff with less. I forget what it’s called, it’s like a low-pass filter or something. There’s this massive filter that kills new things because of all the conditions that you, to break the energy gap to like, here’s a product from like, I had this idea in the pub and I was thinking it was cool. And you know, like the gap is so big that most things die. And if we can just lower the energy gap down…

[0:22:23 - Ben]
I like the metaphor, I really do. And what I would say is like, AI, blockchains, whatever you want to throw at that, it doesn’t matter if you want to ditch some of the things that you feel are weight right now, right, if you wanted to write this on MCP and you felt that that’s a good approach and it would save you a lot of time, I think you should. Like an AI on a blockchain connected to MCP and just YOLO it. Maybe don’t even think about blockchain for now. Because I think the thing is, maybe where it’s all kind of running in circles is you want the application that you’re building to shrink the gap, right? Does that mean it’s your job to understand what the gap is and to model it?

[0:23:18 - Tom]
I agree with you, but the issue is I feel like I do. And so great if you told me how I don’t.

[0:23:26 - Ben]
If I told you how you don’t, I mean, I don’t know, right? I get lost in this question a lot myself. It’s like, okay, I have ideas. Angela has ideas, we talk about ideas all the time, it would be awesome if any of those were immediately actionable. You know, if I could go out there and… Actually tends to have the type of ideas that require you to have a full blown authenticate and authorize any person on the planet to a very high degree of certainty that they’re a person. It’s basically impossible to build that kind of authorization system, you know?

[0:24:06 - Tom]
Right, but there’s great value in being able to say, like, if I had this component, then I could blah, blah, blah. Like, if I had a quantum computer, then things would be really cool. And then one day, your requirements will be met and suddenly you’re off.

[0:24:22 - Ben]
So I would argue that what you’re saying there is that the best way people could serve that goal is by figuring out how to attach their ideas into a context even if they don’t know how to action them, right?

[0:24:42 - Tom]
Yeah and have like automated deduplication going on so that we’re like, oh all of us need this one piece? Oh, we didn’t know that before, and now that means that that one piece is actually quite more useful because the guy who knows how to use it didn’t think it was worth much because he could only imagine how it was going to do this one thing. But actually, there’s a lot of things that need it.

[0:25:08 - Ben]
Sure. I’m with you. I think that, again, I brought up that example of the conversation I have with Angela because I don’t know how to build that thing, I’d love to be able to get somebody to just be like, ah, this is easy, right? Like, it’s just a bunch of crypto functions. And like, I could spend all my time trying to figure those out and then I’m not actually doing the thing that I want to do, which is build the application that’s supposed to be on top of that, right? So for me to be able to go out and say, this is the part I don’t know that I wish somebody else could just deliver to me, and this is the part I do know and I want to build, that’s great. I love that.

[0:25:52 - Tom]
But the thing that seems crucial to all of that is the attribution system because that’s what is actually the biggest killer, the killer filter is how am I going to get paid and who’s going to… someone’s going to steal my idea or someone’s going to get the credit and then that’s what kills anything happening at all.

[0:26:21 - Ben]
Money is a tricky thing you know. Maybe you’re kind of coming at me at a moment where I’ve been reading stuff online a lot recently that’s been making me mad. I think we’re about to head out to look at large chunks of land all over the country that we could buy and like, I believe that there’s probably some value to knowing how to do homesteading type stuff in the near future, just based on my pessimism about the world, right? And I keep thinking about in that environment, in that world where all of a sudden, you know, you can’t really trust the structures that are around you anymore, that are all based on that idea of like, how do I contribute in a monetary way to this system, right? That like, you know, I actually personally deeply believe that the true value of things you can do in life probably aren’t monetary, right? Like I think people all kind of crave community and they all crave experiences that they enjoy and take pleasure in.

[0:27:45 - Tom]
Yeah I’d agree with you except with the caveat that it’s simply because the monetary system has not been designed in such a way that those things can be aligned and my belief is that they can be made to be the same thing. Why should what I emotionally value not be also valued by other people? How many smiles does a bar of gold buy? Those are trades that should be possible, but the money system kills it, right? Like for example me reducing my carbon output for the proven benefit of someone 200 years in the future. Right now, they aren’t even going to remember me. They’ll have my fucking life Facebook feed in some fucking archive, you know, etched on the tip of a diamond that no one will ever fucking look at because they got bigger problems like, you know, the seas dried up and they got other problems, right? And so I’m like, maybe I’ll just burn the carbon. Maybe screw you. Maybe what’s the difference? But a system should be in place where that can carry forwards and have some long-lasting benefit to the things that I chose to leave behind and care about, like children, for example. So if you’re like the great-great-grandfather of someone who walks to work instead of driving his V8, you should get a proportionate sort of a thing there, right?

[0:29:22 - Ben]
I’m actually with you. I think that’s the marketing problem of the idea that you’re trying to put out in the world, is how do you teach other people to think that this is how we should construct value, when they’re so, so, so bought into the way that we do construct value right now.

[0:29:40 - Tom]
But they’re not bought into it. They go along with it and they perpetuate it because it’s death not to. They grumble and moan and they listen to Rage Against the Machine or whatever the cool kids do now. And very few people have a shot at it. But I’m just sort of saying that now that we have AI, one of the key features of AI is that it’s not that it’s incorruptible, it’s just that it is repeatable. And it can do intelligent decisions that may not be perfect, but at least they’ll be not human corruptible, not biased.

[0:30:27 - Ben]
It’s biased, you know. It’s just, it’s ultimately kind of like you made the wisdom of the crowd queryable, right?

[0:30:32 - Tom]
Yeah, the wisdom of the crowds, right. So I guess what I’m trying to figure out is I’m like, I’ve lost sight of all these components seem less and less magical. Like a year ago, they all felt like really high quality components. I was like, yeah, we’ll make this thing and we’ll make these bits and I’ll assemble it and it’ll be the dreamcatcher like Voltron sort of. But now it’s muddier. It’s less… yeah.

[0:31:03 - Ben]
I think this is just a challenge in the entire domain of software, honestly. You know, the more you fall in love with your architecture, the usually typically the worse the architecture actually is. The more time you spend trying to polish all the bits and pieces, the more time you lose to actually put to the problem that you’re trying to solve.

[0:31:26 - Tom]
Yeah. I would argue like I’ve dumped the architecture so many times that I’m pretty sure I’m not attached to it. I guess it’s more like I’m attached to what I wanted to do. Yeah, I’m still not getting the portability and the repeatability and the scale and so I’m like is that enough reason to keep going with it? Or should I just park those and focus on the core thing I want, which is this ambient coordination or an attribution system, a coordination system that’s economically tied, that’s just hanging around in the ether, grinding away with AI tokens, trying to make links between people and statements and things, you know, like the basal layer of an awareness machine that’s actually like plugged into every single person, sort of ambiently.

[0:32:39 - Ben]
I think it is still the case that the thing that you’re proposing is massive, right? It’s hard, it’s very difficult, and if it has even the mildest amount of success and brings people a little bit more value in the form of real money, there will be immediately tons of people trying to corrupt it. So yeah, there are a lot of good reasons to think about the architecture. There’s a lot of good reasons to really care about it.

[0:33:14 - Tom]
Yeah, right, because I’m like, for it to take a little bit of load is the same amount of effort as it is to take a lot of load, because it’s like, it needs to be immutable. Like not a little bit immutable, but actually immutable.

[0:33:28 - Ben]
But, you know, nothing is lost either, right? Everything that you’ve built gives you the foundation to understand how other people have built similar things and you can look at them after all the work that you’ve done and see how they function. To even be sitting here saying, I’ve seen enough things that work similarly to how the things I’ve built work that I’m starting to feel that they’re losing their luster, you wouldn’t be able to make that assessment if you hadn’t gone through the work of trying to build it yourself.

[0:34:00 - Tom]
That’s, I can see that, but not to be facetious, how does that help me?

[0:34:09 - Ben]
It allows you to take your ego one more piece out of the game, right? I don’t think of you as a person who’s ego-driven in this, but ego trips me up all the time, so I’m speaking from my own experience.

[0:34:27 - Tom]
Right, right. So to refocus: how do we make this economic coordination network? I don’t particularly care how, I just… it needs to exist. I’d like it to exist sooner than the rate at which we’re going, because it’s always half here, but never actually here.

[0:35:05 - Ben]
I would argue that if you don’t care about how, then what’s left is what. A very clear description of what it’s supposed to do. If all you could do is take that what and look at little pieces of it… everyone has their own corner of the elephant and it’s hard to tell it’s an elephant. If all you can do is look at the piece in front of you with this tool and put it into a pile of whats described around the problem, eventually you’d have sufficiently described the intent and the what of it all so other people can come look at it.

[0:35:57 - Tom]
Perhaps the light I could take from this is that with all the torture and turmoil, I can at least say I know what the dreamcatcher is now. We had different theories, we tried building things, tried some stuff, realized what doesn’t work. But now I can reason about what it actually is as a statement or a requirements doc, be like this thing needs to be here now and it has these component dependencies. You’ve done enough experiments. Now you can pick up the experiments and write out the what, and an intelligent what always gives your motivation. It teaches why that what matters. And you can attach a how and say this is not the only how, it’s just one piece. There are many ways to build the dreamcatcher but they share properties: cost of execution, portability of data. Any implementation must follow these steps. Then you get into specifics, like NAPCS is a specific thing, making some incompatible choices to get extra features, like how TCP/IP chooses reliability vs UDP.

[0:38:21 - Ben]
So, and I know you’ve been doing that too, putting stuff on the site, building a catalog…

[0:38:29 - Tom]
We’ve got great techniques, mostly from what Scott’s done, to get the bots to reason about systems and update definitions just by having a conversation and feeding a transcript in. It’s yielding well. But I guess my fear is I know the dreamcatcher is possible, I know it’s possible, but it’s like factoring prime numbers—so many useful things came from people trying to do that one thing. They make side-effect stuff that’s actually the useful bit.

[0:39:29 - Ben]
Right. Let me ask you this. The utility you want requires a large amount of buy-in from many people. The thing that shrinks that band gap is the energy to get the idea into the overall system. If there’s only one person, no difference, right?

[0:40:18 - Ben]
One of the things you need to do is realize your instinct that the code doesn’t matter might be correct. Code is basically irrelevant. That took me years of painful deprogramming. What does last are reasons.

[0:40:46 - Tom]
Yeah, we discovered with reasoning and definitions, no matter how good intelligence gets, a collection of reasons outlasts everything. They are the project. Code is how, the spec is what, even what doesn’t matter as much. It’s the why. We’ve even started playing with mathematical expressions of communism, socialism, capitalism, “Drink ambientism,” and showing why an economic coordination system can be vastly superior. So putting down the why is more important than getting a working prototype.

[0:41:58 - Ben]
What and why need to come together. Anyone can talk about why they want change, but you must deliver a what. The how is just implementation detail. Code is throwaway. Many options exist.

[0:42:24 - Tom]
I felt you had another point after saying code is nothing.

[0:42:38 - Ben]
I’m in the middle of a job now where something was massively over-engineered. Nobody used it, no customers. It languished. Now picked up and assumed to work well because it had a labor of love. I don’t understand what it’s for, how it works. Nobody wrote down why they wanted it. That’s the problem.

[0:43:35 - Tom]
We’re hopeful that by using bots to thoroughly reason at the top level, we can get good code because they understand why, and the bots define modular boundaries. The bots write code in a minute that would take me weeks. I know it’s not perfect, but it’s not wrong either. Probably my higher-level reasoning caused the fault.

[0:44:38 - Ben]
That makes sense. I’ve seen it coming. There’s fear of AI replacing devs, but system design is the real hard part.

[0:44:55 - Tom]
It’s really hard, takes time, thinking, humility. Maybe I should double down on reasoning with Scott to get a well-reasoned why and what. Implementation falls out. We tried to implement our way to a requirements doc. We should define the doc first.

[0:45:43 - Ben]
It’s the eternal trap. Build enough stuff and maybe understand. You were never dishonest. Now maybe you see the whole thing.

[0:46:02 - Tom]
Yeah, okay.

[0:46:04 - Ben]
The other thing: learning from science. If you want people to take the economic engine idea seriously, run repeatable experiments, simulations economists understand, show them data, they’ll buy in.

[0:46:47 - Tom]
You mean a model with rational actors, or real world?

[0:46:57 - Ben]
Either. Economists love rational actor models. Classic experiments show even simplest models produce wealth inequality. If you doubt the market model, propose your model. Publish an econ paper. Generate academic interest.

[0:49:24 - Tom]
With ChatGPT Pro, maybe I can write a reputable white paper. I care about the economic model, not the implementation.

[0:49:52 - Ben]
Pick the big issues like wealth inequality. If you produce a system that solves it better, serious people notice.

[0:50:01 - Tom]
Part of reasoning: we can put a bot on a website, people talk about Dreamcatcher, always the same scenario. The bot can answer infinitely. The bot can generate a white paper, show how it compares, etc. If we also have a simulator accessible after chatting scenario, we can pitch “This is why we should build it.” We can model future states.

[0:51:20 - Ben]
Cool idea. Knowing effects before doing it is useful.

[0:51:31 - Tom]
Not just decoupled—part of the machine. A simulator always available. Forecasting future. Propose changes. I’ll think on that.

Sorry, you said you had to go.

[0:52:03 - Ben]
Oh yeah, sorry no dinner yet. Good to talk.

[0:52:07 - Tom]
NAPS: I’ll only pursue them if they fall out of top-level definitions. Even though NAPS is a great idea on its own.

[0:52:41 - Ben]
I like all your ideas, but pick the right subset. Don’t grab more than you can hold. Once you have adoption, complexity can grow as people take ownership of bits.

[0:53:14 - Tom]
I like NAPS for Dreamcatcher because unitizing value is key. Without units it’s hard to say who did what. NAPS serialize value streams into discrete chunks you can weigh. That’s what I was saying.

[0:53:50 - Ben]
Yes, you’ll need something like that. You can attribute all you want, but you need something to point at. Units.

[0:54:02 - Tom]
You need units. Yeah. Okay, cool. Thanks. I’m fuzzy, just making sure we stay relevant.

[0:54:20 - Ben]
You are for sure. I talk to a lot in this industry, don’t see them as frontier as you. Don’t worry. You’re smart, always do valuable things.

[0:54:41 - Tom]
I think this is immensely valuable. Thanks. I’ll talk to Scott, go over this recording, focus on the economic model primarily.

[0:54:53 - Ben]
Yeah, catch it in language serious people speak. If you can’t convince serious people, you can only convince maniacs. If you want old ideas and new ideas to connect, you need serious buy-in.

[0:55:16 - Tom]
Oh yeah, crypto industry full of maniacs. Okay.

[0:55:23 - Ben]
If you want a place where new ideas can attach to old ideas… They talk about crisis in physics: big people pushing their theories, no room for crazy ideas. It’s happening everywhere. Feels like a cage.

[0:55:53 - Tom]
Competition suppression. Can’t say crazy ideas without clampdown, so you never find the person who could refine it.

[0:56:12 - Tom]
It’s too many orthodoxies. Too heavy structures. Feels like living in a cage. Can’t say what you think.

[0:56:33 - Ben]
Suspect a signal/noise problem. Too many people talking, not enough listening. Anyway, I should hop off.

[0:57:17 - Tom]
Okay, thanks for your time. I’ll let you know how we get on.

[0:57:24 - Ben]
Yeah, for sure.

[0:57:25 - Tom]
Okay.

[0:57:26 - Tom]
Bye. Bye.

[0:57:27 - Ben]
Peace.