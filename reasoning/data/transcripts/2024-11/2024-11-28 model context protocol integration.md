Tom
0:00:00
Okay, so who's going first, what we've done? 

Scott
Well, I've sent over a bunch of stuff. There's a couple of things, the actual work done, which we did in those files that we went through, and see if you've had a thought about them. 

Tom
And the most important thing for me, apart from nothing, is us working together on a single place. I think we need at least one layer of complexity.

Tom
0:00:44
I think we need to have pull requests so that we're both not just updating the goal definitions because we think. 

Scott
0:00:55
Yeah.

Tom
0:00:56
Like being able to work in the same place on a chunk of information that stays permanent that we use and grow, like that's the only thing I've seen so far that I'm like, those definitions, they might not be exactly the same in a few years' time, but they are definitely going to be there in some form or other. Right? Nothing else that we've made is going to last that long or has the capacity to last that long. You know, the software is going to get shredded, the AI models, the techniques, the everything is going to get treated but those definitions, we've spoken about them in our

Tom
0:01:41
conversations for years now, five years or more for many of them and now that we've got them in a stable place, I think they're going to stay. 

Scott
I think you're right and in terms of work practices, this might be one of these rare moments where it's worth actually, what's the old cliche? Sharpening the saw.

Tom
0:02:04
I think it's worth just that I don't actually care how long it takes so long as we're committed to just incrementally improving that repository and getting our process down for that. That's worth every penny, so to speak.

Tom
0:02:21
Well, let's do that because yes, we haven't moved to any other platform that was working, only inside of Cursor. 

Tom Nice. Nice.

Tom
0:02:31
How did you find it? How did you feel?

Tom
0:02:33
I felt nervous. You know, things like, oh, I'm just about to, you know, add in a new stuck definition, which extends... 

Scott
Yeah, you often feel nervous about that. You shouldn't because, first of all it's Git. It's easy to get, just roll back, roll forwards,

Tom
0:02:55
there's no problem whatsoever. I don't, in the nicest, politest way, I don't think you know enough about Git to be able to do damage that I couldn't recover from. 

Scott
No, I don't know. I don't know enough about Git. I don't think I need to know much about Git.

Tom
0:03:09
Git sucks, dude. You don't need to know.

Tom
0:03:11
Yeah. I do know that we can rule backwards and forwards.

Tom
0:03:15
Yeah, yeah.

Tom
0:03:15
And so I don't want to freak you out with process, like pull requests and all that. I can work perfectly happy without them. It is a delight to me to wake up in the morning and have a new set of commits that I can think about, understand where you're coming from,

Tom
0:03:35
learn something about our system, think about what features it has to do, and think about the process of how we're going to merge and keep these definitions going forward.

Tom
0:03:45
I love that. That's gold. 

Scott
Yeah, that's cool. And the other thing I was thinking about is the assessment, the summary of the kind of these threads. Now, I moved from one thread to another, not for any particular reason. I think I was worried about the context window getting a bit too large. But summarizing those
threads this morning when I woke up, I could read what I did yesterday and went, oh yeah,
that's what I did.

Tom
0:04:20
Right. I think that's essential. That's essential for the CRM operations because anyone doing serious business in this stuff, it's costly to have an unfinished thread. 

Scott
Yes.

Tom
0:04:31
And you should, we probably need a UI element that lets you mark it as done, so that you're like, it's implied. 

Scott
Yeah, and I know last night when we were talking, you were saying words along the lines of having full threads saved as a file is not necessarily the right thing which is why when I got the Hornet, well can we summarize it?

Tom
0:04:56
No, I was thinking more about that actually and what might be, it is good and it isn't just so long as we've got a mechanism to manage it and you know storing it in a folder where it's like one folder per day or something like that is really not a bad thing. I really don't think that we're going to use those threads very much and my caution comes from the fact that once we can write some code for Artifact that can manage those threads better and keep them around Then it's not very hard, but managing the threads and art in cursor can start to get a bit

Tom
0:05:45
A bit clunky because curse is not good at saving the threads Yeah

Scott
0:05:51
I was looking for any nice way of doing it and it's like there isn't one 

Tom
there isn't one and I am I Know I share your feeling that you like it's wasting possibly vital information, but I think for the sake of speed and brevity, the effort it would take to preserve them at this stage is not worth it, but I think that we should definitely work towards a artifact workflow

Tom
0:06:20
where those threads are always saved.

Tom
0:06:23
Yeah, and for now, I think it was a very, very brief, because it was end of day, prompt that I put in, which is basically summarise all the key points on all the threads all the way up. Yeah. 

Tom
I think that's great. And that was just a single copy and paste.

Tom
0:06:40
Yeah, and once you get an org or a project or a team, like you imagine if back in the Interbit days we had that being done for every person.

Tom
0:06:52
So what they had...

Scott
0:06:53
And did they report? And then you could just like... Yeah, roll it up. You point an eye at everyone in marketing and saying, what have you done today? 

Tom
Right, and everyone can see it too because in the higher up you go,

Tom
0:07:05
plus you can summarize them over time, like summarize all the work summaries for the last quarter, generate a shareholder report go yeah yeah and suddenly it's like okay that's all relevant 

Scott
now that's what I think we should do because of Cursa's ability to ignore folders, create a folder in the repo which is just the work reports but the summarized work reports. 

Tom
Well you can you don't have to ignore it in Cursa you can

Tom
0:07:36
just put them in there and then you just don't refer to them unless you want to yeah Yeah, yeah, I'm also the same thing yeah Yeah, I'm cool with that, and I think that for your own sanity. We need to give you like you know There will be some folders that we agree on you and I like gold definitions But I think you having a folder where you can just poke around at stuff is Healthy at that 

Scott
that was the other thing was there's nothing stopping us having

Scott
0:08:06
the equivalent of dev staging in life called definitions. 

Tom
So I think we might not be able to do that in pull request just yet but we can definitely have that structure in folders, That's no problem. And then you and I can sort of merge them in manually, like sit here, have a session, debate it, and then sort of do the merge using cursor. 

Scott
Right. Exactly. And of course, you can do it as an AI, of course. You can say, right, okay, prod were considerable folders,

Scott
0:08:43
do a diff on each, list the files that are different, show us what the changes are, and then we can debate. And then there will be another, it would be another AI command, wouldn't it? It would be show what the decisions were for each and then it's like apply, apply, apply, apply into prod. That sort of thing. Yeah, that sort of thing, yeah. Yeah, because what I

Scott
0:09:25
don't want to do is fizzle over your work and also what I don't want to do is, uh, at the end of the day... 

Tom
Yeah, so that's fine. Because, you know, uh, changing... Just, um, you should just, you should just go for it. Go, you know, no pun intended, but go for gold and then what will happen is each day I'll come in and I'll like poke back at it and be like okay here's some topics for the conversation like if you just do whatever you want to do and then I'll come in and see what you've done and try and figure out a way to reconcile it with what's there already.

Tom
0:10:02
already? 

Scott
Yeah, okay. I think I'll probably leave that with me and every time anyone says no pun intended, you know there's a pun coming. So leave it with me. What I'll probably do, because it's just a repo, what I'd like to do is to create a kind of staging area which is a duplication of gold. Gold doesn't change until you know we've discussed it we can do diffs. Yeah but this is... You don't agree? 

Tom
No that's fine just do whatever you want and then we'll just we'll just iterate on the concepts. Because and then we'll

Tom
0:10:47
just yeah we'll just take the time to clean it up periodically and make it this is our knowledge base, the reasoning. 

Scott
Yeah and the ideas, I stuck the scenarios and narratives which job to do today to get narratives into definition. 

Tom
Those are super useful. 

Scott
Yeah okay so what was your thoughts on that? Oh, this is something separate. Oh, that's your one. What do you think of that, man?

CONTRIBUTION/ATTRIBUTION

Tom
0:11:21
I read through that and I think that's pretty good. Like it's got work. It's got a lot of work. But my point is that there is some very basic assumptions we can make about the performance of different economic systems. Yes for different economic systems but the big nut that we have to crack yet is in reconciling different types of contribution. I don't think that's a problem at all actually. No problem whatsoever.

Tom
0:12:03
I don't mean, okay, you got the answer. No problem, what's the, well, yeah, I got the problem, I got the answer. 

Scott
Oh, excellent, you've written it down.

Scott
0:12:13
No.

Tom
0:12:13
Um. Ha ha ha. Don't, I went over it with you one time

Tom
0:12:19
and I didn't get any objections about it.

Tom
0:12:23
Do you want me to run you through it again?

Scott
Yeah, remind me, because at the moment, attribution, you can do basic attribution, like your code is actually used, a number of times it's used, a number of times it's referred, and so on, but that doesn't capture wider contributions that another attribution model or a more sophisticated attribution model might want to take into account. So we'll get a basic attribution model is yeah we could do that now but getting something that is there's just this thing like we use we use their dictionary of types.

<insert url>

Scott
0:13:14
Right, so these are all the dimensions of contribution that we're going to...

Scott
0:13:17
Oh yeah, and I remember this. No, that doesn't ask the question of how do you reconcile. So that's contribution types. 

Tom
Yeah, but the way to reconcile is... I don't think it's that hard buddy. I don't think it's that hard.



Tom
0:15:16
eigenvector... Yeah, I'm not trying to say that these formulas are final. I'm just saying that they are close, and that it is...

Tom
0:15:31
it is an implementation? 

Scott
Yes. And that's all that matters. I agree with you. And I saw, so eigenvectors are quite similar to impact crystals, but they do, it's an expression of how an impact crystal may be encoded, but it still requires the weights, and the weights
are the tricky bit. 

Tom
Yeah, no they're not they're not the tricky bit because we just get the LLM to pick them and that's it. It doesn't have to be right. Well no yeah we can get, I was saying we can get a really wrong That's fine and then we're off and then we're off and I promise you that the really wrong version will still be nanometers type precision compared to kilometers when it comes to the conventional capitalist model. I promise you that much.

Scott
0:16:34
Oh yeah yeah. Okay so if you can think of the ratio of a kilometer to a nanometer then that's like it doesn't matter that it can be improved. It's a starter for 10 and we should just implement it and if I can see what happens, it's going to be better. I'm quite well versed in eigenvectors. 

Tom
This doesn't quite capture everything I wanted, but the main principle I was trying to describe here is the fact that we create this matrix of relative contributions relative to each other and then we sort of normalize, like loop it again until

Tom
0:17:19
all the ratios, all the numbers match. So we just like close enough that there's some tolerance that we're like it's not worth trying to refine it more than this. And then you've got that, attribution is trivial. 

Scott
Yeah, that vector idea is a good one. And previously I've been talking about n-dimensional space for impact crystals, which involves n-dimensional space is there.

Tom
0:17:57
These are the dimensions. 

Scott
Yeah, but these are activities not value produced. 

Tom
Yeah, so the value of each one is where that matrix comes in. Yeah, exactly. But these are the dimensions of the depth dimension of the vector. 

Scott
And it's plausible to have for each of these activities to be able to reconcile them against a zero to one weighting. Yeah, normalize them. And normalizing between different ones is the... 

Tom 
And yeah, I think I think what's more The usage of the daily work reports is one way to sort of Like if you did all your work inside of artifact where you made a thread and then daily work report

Tom
0:19:02
Summarize what your threads were all about Then that's what gets used to calculate Some of the effort you put in on these different dimensions? The main point is that there's some kind of a transform

Tom
0:19:25
to go from the raw work, the effort plus the product of that effort needs to be transformed into something standardish. 

Scott
Yes, and it's that last part. Everything else, there's multiple ways of doing it.

Tom 
Yeah, and the standard thing honestly need not be that complicated. It can be just simply a rubric where the LLM goes through and checks off different rules.

Tom
0:19:50
Like, these are stupid, nonsensical ones, but did they turn up on time? Were they available when a phone call rang, like, you know.

Scott
0:20:03
My current thinking is, so I'm recording contributions and normalizing contributions of a similar type. That can be done. And, but normalizing between different types of contributions, my current thinking is along the lines

Scott
0:20:22
of how grumpy people get. What you should have is everyone… 

Tom
No, look, I think you're over cooking it, you're over cooking it because it's actually not your business to design the attribution algorithm. It's your business to design the system

Tom
0:20:44
upon which the attribution algorithm runs, but it is hubris to think that we are capable of making the attribution algorithm. 

Scott
I agree. And therefore, it follows that the version of attribution that we make should be the absolute bare minimum because we don't want to be in the business of making attribution algorithms.

Tom
0:21:09
That's not our business. That is a fair point. Okay, and I would want to extend that and say that during the past year, there are times when we have fallen afoul of being trying to come up with AI things because the temptation was there because we needed AI to be better than the tools that were available so that we could get our job done. But we must keep in mind that our job is not to make AI tools, it's not to make prompt techniques or reasoning workbenches or anything like that.

Tom
0:21:48
Some of those things we need to be at a certain level, but once they get to the usable level, we need to move on. That's not our business.

Tom
0:21:55
Our business is stucks.

Scott
0:21:58
Yeah, that's fair enough. And we went down the rabbit hall, because I don't know how we got into attribution, because we were talking about work records and just storing what you've done.

Tom
0:22:10
Yeah, yeah, yeah.

Tom
0:22:11
Okay, so why don't we back out of that and we'll just, do we agree that we're going to make an attribution algorithm,

Tom
0:22:18
but it's going to be just rough as guts?

Scott
0:22:20
Oh, we could make it any attribution model will be one. You know, for example, on these recordings, how many words came from you, how many words came from me? 

Tom
Anything at all, right? But any kind of data-related thing is going to be better than what we have right now, which is nothing.

Tom
0:22:41
And if we get the stuck loop in place, it will be improved. And there will be people that are far smarter than us and have had more experience thinking about these things than us that can deal with that niche problem. That's not our problem. 

Scott
It's a really interesting one though. 

Tom
They're all interesting problems my friend. But we must stay focused on Aladdin's lamp. I know.

Tom
0:23:03
We came to raid the lamp, not all the treasure that lay on its way to get there. By the way, just for the points of note, I haven't done any work on attribution at all. I'm not saying that yet. I'm just saying I know I know but now is the time for us to ignore our hungers to dive into these wonderful things we see around us now. 

Scott
They are not our business. That was almost poetic. Time to ignore our hungers. 

Tom
I can't get it across to you anymore.

Tom
0:23:38
There's a very narrow thing that we care about.

Tom
0:23:40
Okay, well let's get back to it then.

Scott
0:23:43
So, there's a couple of things in my hopper. So, we've talked about the refining, or at least recording how you and I work on the same tool. 

Tom
Yep, which is great by the way. Welcome, I'm so glad to have you here. 

Scott
The second order thing would for me would be your thoughts on actually what did yesterday

Scott
0:24:11
Yeah in those files Especially the stux.md in stux because that That even to my eye is wrong, how it's been expressed, but there needs to be a right way of expressing a stock. And then the narratives, what do we do with those?
I've got a couple of ideas.
And the, what's the other file I made? The NAPP scenarios.

Scott
0:24:57
So, those are the things I'd like to talk about. Okay. I mean, whatever you've got. 

Tom
The stuff I want to talk about is the model context protocol, which fell out of the clear blue sky just at a time when I was sitting there being like,

Tom
0:25:16
how should I make the API back to Artifact from this delightful new front end that we have? 

Scott
It's interesting enough about, when was it? Yesterday morning, my time is about 36 hours ago-ish. It fell out in the blue sky and I looked at it. And looking at, I went through the readme and so on,

Scott
0:25:39
saying that looks really quite close. And I went through some steps to play around with it, but that wasn't my key aim for that day, so I abandoned that after an hour. So your thoughts on that one, actually, let's start with that one,

Scott
0:25:53
because I think that's got legs. 

Tom
Okay.

Scott
0:25:56
So that landed like a day or two ago.

Scott
0:26:19
I was looking at the repo. 

<Insert URL>

That's what I stumbled on not the not the explainer So I've not read the explainer Let me pull up the piece that I wanted to talk to you about

Scott
0:26:30
Okay. So the architecture of the model context protocol it seems that the only thing is missing is NAPPS as a framework. But what they're talking about is how would user applications aka host processes communicate with various different NAPPS

Tom
0:27:17
running environments. They didn't call them NAPPs. So we could make a NAPP running environment or the standard environment that was compatible with the model context protocol

Tom
0:28:30
which would mean that every other client or host that was compatibile could now call our standard environment instance on Dreamcatcher.

Scott
0:28:34
Yeah, I agree. Correct me if I'm wrong, but my reading on this is that they are offering a protocol for various AI clients or anything you want to call external services, a similar way that we were talking about NAPPs being used to call API calls or artifact calls

Scott
0:29:06
or have those calls available. So you haven't gone as far or as deep in to the NAPP world because the AI can choose 

Tom
The appropriate AI API NAPPS is an extreme Move to make I think what they're trying to do is they're trying to capture them the

Tom
0:29:27
integration side of the AI boom and they're saying that look Let's open source this because they want to make it easy for people to switch backends and they want to make it easy for people to not feel locked in to one vendor or another with the obvious suggestion being please come and get locked in on Anthropic. 

Scott
Yeah, this is my thought, because the NAPP format, let me talk carefully here,

Scott
0:30:03
so NCP protocol can be supported inside of a NAP, that same NAP could support any other protocol that does something similar.

Tom
Correct. 

Scott
Without changing the NAP format. The NAP format is like the whole debugger. It's like these guys have come up with a protocol.

Scott
0:30:35
This NAP in the JSON says I can talk to NCP. 

Tom
No, not quite. Not quite. The protocol in the diagram that you made with the layers that showed the standard environment MCP would be how the front end talks to the standard environment of dreamcatcher.

Tom
0:30:58
However, we choose to surface it be it a web browser web page a desktop app a mobile app MCP would be how the front end talks to the standard environment The protocol on the wire is what that's about 

Scott
It doesn't also, and again I've only skim read this, it doesn't also allow the provides a method of talking to like a SQLite database or any

Tom
0:31:24
Yeah, but it purposefully stays agnostic as to what's powering the protocol on the server side. So it's purposefully made to allow you to do anything you want. One thing that I think is extremely interesting and of great relief to us is that to be able to make this protocol, they have made statements about the generality of what all LLMs contain, like prompts, tools.

Tom
0:32:08
Well, look, prompts is part of the protocol.

Scott
0:32:12
I mean, prompts are the obvious one, but what was the... 

Tom


Scott
Tools. Have they discovered anything that we haven't already? 

Tom
No. But what they've done is they've reinforced what we're seeing. Like, it's uncanny that we... 

Tom
0:32:30
Right, like this is almost NAPS. This is simply... Okay. 

Scott
Oh wow, that's heartening. 

Tom
So they've chosen that you can... The backing server of an MCP-compatible server compatible server can serve up prompts, it can serve up tools that an LLM can call, and it can serve up various other resources. And so I think it's quite profound that we made such

Tom
0:33:07
a sort of a statement of a similar type of an industry-wide need and started in earnest refactoring to build it and then along come X billion dollar these guys and they're like here's this was the piece that I needed literally I have a tab open on my desktop that showed my current best choice for how I was going to do the protocol that connected the browser to deno deploy or the standard environment and I was like not really looking forward to that one, but I'll just go and do this other stuff first. And then along comes this thing, which is the protocol for how to communicate from the browser. which now there is one protocol allows us to, whoever else advertises that this service,

Tom
0:34:02
that e-call, whatever it is, allows that protocol. But there's going to be other protocols. You know, that's the thing with protocols, you know. No, man, unlikely, because for there to be a new protocol of this kind, there would need to be a new type of AI. Like in terms of LLMs and the way that,

Tom
0:34:37
you know, token generating engines, this is all you need. And it's always gonna be that way. Yeah, well for now, I don't think we need to worry about that and see no I just I just think that we should take heart that we committed so strongly to naps and then these guys who are not idiots

Tom
0:35:01
made this thing that they're still missing maps well no like not really For a company this big, NAPS is too much of a change. But the protocol that they're saying highlights that the problem that NAPS aims to solve is a problem that everyone's aware of and they've captured a part of it. The issue with NAPS at the start is people be like, I don't want to be locked into the NAPS environment. It's not really meant to be like that, but that's a valid point, right?

Tom
0:35:41
And so if we're like, no, we're just, you know, we're MCP compatible, that's what our services, you know, come in play. Yeah, we've got the same, you know, shape of charter board. Yeah, and all that, what this means is that

Tom
0:35:57
because the standard environment is simply an environment that runs NAPCS, if it is MCP compatible and NAPS proves to be the value that we think they will be, then MCP and NAPS go hand in hand, which gives us a huge boost in terms of like popularity, kudos, adoption, or we'll get completely off and that's fine too but we are on the right track like we are looking at we are seeing what the industry is moving to a little bit before the

Tom
0:36:38
industry yes and you don't have to be years early because then you get called mad we're not far enough ahead that we can feel safe I don't think that ever happens. But if we don't go like the clappers to own the nap space and make naps. See naps are supposed to be here. Yeah, on that point, just as a point of amusement, I had a quote the other day that really refers to us. The difference between mad and being a genius is an audience? I would say it's also timing.

Tom
0:37:22
You need to be just in time to be a genius. If you're too early, you're mad. If you turn up right now with a flying machine. Right. You can flap up your wings. Yeah.

Tom
0:37:44
But not to waste too much time on this one.

Tom
0:37:48
I don't think you could. This is such a profound development for us and others.

Tom
0:37:52
I don't think you could please waste away. Well, in that case, can you take me into what you've learned about what it means say if you've got a database for it to be MCP compliant? I can do you one better than that. I was expecting this question and that's what I was browsing for just now. I have for you example MCP servers, file system, git, github. And that list is only going to get bigger. Fetch, right? So this is the kind of thing that they're expecting the MCP server to expose. And we're saying, well, we're doing a file system plus Git plus a computational environment,

Tom
0:38:43
plus we're also going to pass on to like Fetch and all these other things. There's a knowledge graph as well there, which is one of my favorites. Right. Right. So, yeah, this thing is the business. We not to point, you know, not to give ourselves a medal or anything, but we without hearing

Tom
0:39:11
bang on about the need for naps. We identified that need ahead of time. These guys have identified a similar need but they haven't gone all the way to naps. That might say that they're thinking about it and they're not ready to release it, I don't know. But the point is we are here and we are slightly ahead of the bleeding edge. Yeah. And that's a good place and a bad place, because it's like when you're surfing and you're just about to either go over the falls or have the ride of your life, we're kind of there. I think it's quite heady, isn't it? I'm pretty sure on top it's got more money than us. Mind you, they offer true jobs. Maybe you'll still

Tom
0:40:11
take me on. I don't know. I guess, sorry, that came out wrong. The point I was trying to make is that it doesn't really matter how much money you have. You can't bend the physics of the AI world. The minimum requirements are always going to shine through eventually and here's one example of them, NAPCS is another. And what we're trying to push is that the Dreamcatcher protocol is a third, which is the automated attribution demand verification. Which is a lot of our previous conversation about what is our gold nugget, which is the stuck loop.

Tom
0:40:53
The stuckity stuck loop. Yeah. This is TCP IP and we are offering, you know, uh, I don't know, a router. Well, we're offering something like web. Yeah. You know, and we're like, this web is an essential part of whatever you're doing.

Tom
0:41:09
Everyone's busy sending packets around the place and we're like, it goes a bit deeper. So, what work is required in order to, for us to basically jump on the back of NCP? Because NCP solves a whole ton of problems with, you know, we've got this hopper of people asking.

Tom
0:41:37
It would be glorious if the answer was, hey, just make whatever service you've got, this old thing in the corner or your database you're frightened of or this third party that you depend on. All you need to do is make it NCP compliant

Tom
0:41:57
and then you're into the stuck loop. So what work, what practical stuff needs to be done in order to do that? What does a wrapper, what does an NCP look like? Because it feels like a layer, so if the bottom layer is say see old Jenny the the database everyone's framed of they want to get the information out of it make it NCP compliant what does that mean? I guess

Tom
0:42:26
that means that you could chat with it but what you should be doing is running the Dreamcatcher which is MCP compliant with the Dreamcatcher connected up to that database So that it is technically being exposed as MCP, but we're trying to be MCP plus stucks and we're also trying to be We're also trying to be Into server MCP so as an example here

Tom
0:43:07
we're trying to be not just the method of talking to the client, but using the artifact protocols, we're trying to be service talking to service as well?

Tom
0:43:20
Yes, but that's the layer that we're working at.

Tom
0:43:26
I'm thinking more fundamental, when talking to some dude who's got a database right and saying hey, we could plug you into all this loveliness Jim catcher level What you need to do with that database is It's like dot dot dot Well, you could read it in first first and foremost you could hook up like a

Tom
0:43:52
some kind of query tool that would read the DB and generate a bunch of implied structure? Yeah, no, we can do that. Anyway, no, what I'm saying is, I'll read this in detail because I've only skim read it.

Tom
0:44:16
But in order to make, you've got a SQLite database sitting there, and you want to make it NCP compliant, presumably there is some kind of plug-in thing that they wire in, in order for the eagerness of NCP to be then exposed, that we can then plug into the Dreamcatcher talking to other MCP capable services. That is a valid use case that you talk about, but I don't think that's on our short list of valuable things,

Tom
0:45:16
but I could be talked around. Yeah, there's demand. Tell me the demand.

Tom
0:45:25
Just simply, how do I intelligence size my existing databases?

Tom
0:45:30
Someone wants to use the Dreamcatcher. They want to have a NAP. That NAP is a very simple one that exposes data on a database that they have been running for the last 10 years? Yes, so that would need some custom work to connect up to that database and then generate the NAP that is required.

Tom
0:45:49
There may be the possibility for a generic NAP that can go in there and spelunk through the database maybe, but I don't think it makes much difference to the way that that system is introduced so that sounds pretty much Entity is not really adding much into that so that particular on onboarding process it doesn't but what it does give us is this this guy's got an answer to a CTO or whatever who's like What's this dreamcatcher about and how do I know I didn't just make a second silo that my predecessor, whoever I passed this on to,

Tom
0:46:27
is going to have the same problem 20 years from now. And so the MCP is saying, well, yeah, but what we do is if we talk to the dream catcher using MCP, which is backed by this archaic database, then any other apps we build on top, so long as they're MCP compatible,

Tom
0:46:47
we can switch it out for something in the future because that protocol of intelligentized data is the MCP standard. Right, so to go back, you don't need to, but to essentially go back to that list of servers that's you know, I see light, they had you know scraping tools and that sort of thing. Essentially there's work to be done, which is presumably coding work, in order to expose an MCP compliant endpoint.

Scott
0:47:25
This one?

Tom
0:47:26
Yeah. Yeah, so there is coding work required to be done to connect up whatever you've got to make it present as MCP, but what I would argue is that you're better off to spend work to make a NAP that can digest your data and then run the Dreamcatcher because the Dreamcatcher makes NAPs MCP compliant. And so by making it a NAP, you're not making it MCP compliant directly or you could make it as a NAP which can then be run on standard software. So take the Archaic database and go from the Gymcatcher side.

Tom
0:48:18
So NAP wants to access and make queries to MySQL database sitting in someone's office. So what's the work? What's the implications of NCP in the work required for that to actually happen? We want the NAP to be able to get access The NAP is the coding work that is required

Tom
0:48:48
to access that database and when you run the Dreamcatcher standard environment to run that NAP on your local office premises then it can be accessed by anything else that can talk MCP but the work required to online that SQL Server is roughly the same for that one instance whether you did it with a NAP or not. The difference is that if you use a NAP it has more chance of being reused somewhere else and you have more chance of finding other people with a similar coding problem to you who can share your problem. Otherwise, you're going to be

Tom
0:49:41
building a bespoke piece of software that's going to run on a service on some archaic Windows server and it's going to be expensive and costly to maintain. But if you made it in NAP, it's portable. Yeah, okay. Yeah, yeah. Yeah, that argument stands. Yeah. And then additionally, let's assume that that's not your only thing that you want to AI-ify or whatever the hell the word's going to be for that.

Tom
0:50:09
And so your next one, if you had done the work to MCP it just for that database, then the next database is going to need some novel work done as well. And then how are you going to get the two of them to talk how you gonna take you know rollbacks and other things like that and that's the point of NAPs and the Dreamcatcher is that if it's one for one in a straight line race

Tom
0:50:39
between custom bespoke software and and custom NAP plus the Dreamcatcher it's not necessarily it's not that clear who the winner would be, but as soon as you've got two, it becomes, right, two or more, three and it's not even a contest. But that's convincing.

Tom
0:50:59
So the old MySQL server is still going to need some code in order to expose it. All we're saying is that work to expose it, use the NCP and use that NAP as an endpoint for your database and then you get all the goodness of the fact that you might have, you might do a company merger, for example,

Tom
0:51:28
and have a whole bunch of other machines, but it's the same, it's a fixed amount of work per bespoke end source. However, because we're using this protocol, there's a very good chance, and it's open source, that someone's going to have actually done most of that work for you, so you just need to wire it as opposed to disconnect.

Tom
0:51:50
Right, plus you can resell it. Plus you can gain access to resources who are familiar with how to do it. And importantly, if for whatever reason you've used gene capture NAPs and they're not to your taste, that work isn't lost.

Tom
0:52:24
Yeah. Yeah. Yeah, yeah. So this is, I mean, the Enterprise Service Bus kind of looks like a fabric and MCP, like what we're trying to make the Dreamcatcher be, is like an MCP fabric so that it can present as MCP to all these different entities who want to consume it, but they only have to talk to the bus.

Tom
0:52:58
They don't have to talk to each individual thing that's backing it behind.

Tom
0:53:02
Like it really-

Tom
0:53:03
Which is the point of a bus, yeah. Yeah, and the MCP win for us is that it allows us to defensively say that we're not trying to lock you in to a protocol. We never were, but because we were the only ones with our protocol, we are locking you in, whether we like it or not.

Tom
0:53:23
But now that there's this industry standard hurrah thing.

Tom
0:53:27
Yeah, that's more important than it may seem, first blush, because when you're trying to convince a company, an SME. They need freedom, they need freedom. Everyone is always trying to lock them in. Well, those two things I keep on going on about, fear of missing out and fear of fucking up. And the fear of fucking up is…

Tom
0:53:49
Fear of getting stuck. Yeah, it's like, here are these dudes with this Jim Catcher thing. I'm going to go through with a fine-toothed comb because I don't… But if what we're saying is a bit like a USB-C port. That's right. Plug it in and boom. And if you don't like what you're plugging into, plug it into something else. Much easier decision to make. Yeah. So I'm all for this. I'm all for this. All for this. Yeah. Yeah. So that's nice that

Tom
0:54:22
someone did it for us as well. It is nice because it's got a good name. It's got you know, another second mouse. Yeah That's a good mouse to explain Too hard. Yeah, and so really yeah that the standard environment just becomes a Way to run NAPs in an MCP compliant way It's a way to run them at all, but now we're saying that you just tack MCP on the front of it and people can start consuming it in whatever else they want to do. Ideally they'd switch over to

Tom
0:55:00
be native on the Dreamcatcher, but in the meantime, you know, we don't need to force it. I disagree, because at the sales level, having anything native is sticky. It's great for the person, you know, it's great for the dream character in this instance, and it's great for IBM to be sticky. It's shit for the person making the decision. Yeah, but if sticky is open and sticky has multiple vendors who can support it, it becomes sticky like TCPIP is sticky. Like TCPIP might be the stickiest protocol, particularly IPv4, maybe just the

Tom
0:55:43
stickiest protocol ever invented, right? Yeah, how many years have we tried to move to IPv6? Since forever, right? And some people have been alive for less time, so they can write programs and use IPv4 and have been alive has tried to replace it. So the point is that we want to be that open because we don't have any business interest

Tom
0:56:07
in being sticky. We want to be as open as we can. MCP gives us-

Tom
0:56:14
Well, exactly.

Tom
0:56:16
Large, very, very large companies want to be sticky. For example, Apple famously tries to make sticky by Having ports that only Apple cables can go into this right It's not they have the screw those guys European court to say no you can't do that right That's embarrassing right like when daddy told you often was like you need to play with the other kids like that's embarrassing

Tom
0:56:44
exactly So it's more you get the less sticky you want to be. Yeah, so I don't know how that really helps us, I guess. It's just that we can ride the wave of MCP compatible. Just like when Git first came out, and you can still see within the Git code base,

Tom
0:57:07
you can see that it is still compatible with SVN and CVS, which sounds funny. I don't know if you remember those source control systems because they'll bring back shutters yeah when you had to check out and check in yeah yeah I remember them vividly vividly right they're pretty good though I mean I'd say they're pretty good for the time. well honestly I must be going back to like I these are just bad things I would rather just not

Tom
0:57:41
even 1995 they were cool so were you sorry I just couldn't get in this right here we go look at this one this is the source code, get CVS export, get CVS input. This was modified last year. They still have these features in here. Get subversion, Perl. It's still in there. Why isn't that there though? Well, because it's sort of, you know... Some people are still running subversions.

Tom
0:58:23
The Inclusion's legacy is because... But when they first came on the scene, that was crucial.

Tom
0:58:31
Yeah.

Scott
0:58:32
Because who were they?

Tom
0:58:33
I've seen this time and time again at the data center level, where the CTO thinks it's more than his job's worth to actually make any change whatsoever. Yeah, that's tragic. You know, like you should shoot yourself now, but that's true. And so MCP gives us a way to align ourselves with industry standard if nothing else. I don't really know how valuable MCP is going to be for people to plug into this and plug into that. Why I think Anthropic made it is for a way that their models can process. And they were like, we need to do this so that we can access it more. They don't really care about fighting over how it happens or who's doing it or anything like that.

Tom
0:59:28
They just want it to happen. And that's why they made it.

Tom
0:59:31
Well, they're the first that we've seen. And the point I was making earlier on about why the JSON is important in this one is a bit like, say, if Dreamcatcher was a laptop, you know, it's like, what ports are you going to put in? It's like, ah, we've got a standard port, USB, boom. It's like, oh, we've now got USB-C. We can handle that. of people, for example, would never use the Thunderbolt port on their laptop, right?

Tom
1:00:01
But the port needs to be there so that people feel like they could if they wanted to. I personally think that running your app, whatever it is, Dreamcatcher native, will give you better performance than trying to plug in through some protocol. But if that's what you need to do to feel safe with our system and honestly I need to connect the browser up somehow anyway. Yeah, no, I'm the first one to the wall. It makes no difference, right?

Tom
1:00:35
And obviously they're not going to put our name up in this list, but we want to be in the noise about this so that as people are getting used to it and being like, oh, MCP, MCP, right? It'll take a few months, but if we're sitting there with like, we are Dreamcatcher and we are NCP compatible, you know, like we can be involved in the ecosystem. Yeah, exactly. And we are not NCP reliant. No, that's right. That's right. And we might

Tom
1:01:08
even be able to be an offering so that if people want to get their job done using NAPS, then it's beneficial for them for whatever reason to be able to plug MCP into whatever they're doing and then use NAPS to do the rest of the stuff.

Tom
1:01:24
They might find that a good solution.

Tom
1:01:26
Yeah, and also I can already see in the sales cycle, I've been talking about, you're dead, bring out your old servers, all your data stuck around and all we're saying is make them NCP compliant and you've got all the goodness of Dreamcatcher but also being NCP compliant so you're not stuck with us, you could go to anyone else and oh by the way it's by Anthropic, everyone knows the name Anthropic or every CTO should. Give me your tired, your poor, your huddled servers.

Tom
1:02:07
Give me the Richard Riffues of your teeming. I know a guy who is making extraordinary coin right now on a very niche server that IBM produced back in the 70s that seems to be running most oil rigs in the North Sea and there's like two of them left, they used to be like half a dozen but the other ones have died. So in the sales cycle…

Tom
1:02:43
Yeah like we want to you know Swap out Betsy who's done the perfect no no and we want to come in gracefully as well We want to plain ice with everything else that's there but ultimately we want to be the bus and we want to be the bus for Data transmission as well as computation and we want to surround Every other service and then eclipse it because if we control all the I oh

Tom
1:03:10
We effectively control the service and we can swap it out for something else yeah yeah but remember the real thing is we've got this nugget called the stock loop yeah so okay so how do we get so this is all fun like NCP and that's so I think we're in agreement so I don't know what work your required to have these, you know, not on the client side but on our side to receive SP compliant protocol into an app. That's down to you. I guess, well, I guess our first example is the tracking guys, because I have to connect up with their

Tom
1:04:09
existing accounting system. And so, I don't know if it makes sense just yet, but it might be easier to just turn that system into an MCP compliant thing, and then... Then we need to be compliant on our side. Then we need to call into it. Yes, I'll think about it a bit there.

Tom
1:04:33
It'd be definitely cool to make the CRM and then show hooking up Claude to it using Anthropx front end and be like, here is Claude connecting to the CRM running on the Dreamcatcher because it was MCP compliant that's why it worked. Yeah so that chain would be the three box thing that is already in hand and then behind the scenes we've got NAPs that reach out to different AI models. Yeah, but they just look like tool calls because they're running as drones.

Tom
1:05:25
That seems like a really parsimonious and least resistance route to everything. Yeah, and then it means that people can bring their own front end. We're making it so that we don't require people to fully embrace us. They can have already embraced someone else like Claude and then they just connect this thing up and they start to use the Dreamcatcher. We don't need to own it all at the start, but we do need to get our foot in the door

Tom
1:05:57
and that's one way to do it.

Tom
1:06:00
Yeah, but I would argue we shouldn't want to win it all, ever. We're gonna. That would be nice, but even as a matter of philosophy, offering the Gym Catcher as the gives real value beyond someone just using NCP by themselves to link up their own thing into one model. Yeah, it connects them, introduces them to the drug

Tom
1:06:34
of a social innovation network using the needle and spoon that they're most familiar with. Social innovation network. That, I like that phrase. Okay, cool.

Scott
1:06:52
Either way, we're in agreement.

Tom
1:06:56
We need the protocol anyway because we've got to connect the browser and our apps up to it. We do need to be at least playing nicely with the other people in the sandpit but I think that there is only room for one blockchain on the planet and if it isn't us it'll look like us and we'll either merge with them or they'll merge with us or whatever but MCP is only needed while there's okay well I guess you always need to browse a bit but it's kind of like compatibility with other AI systems is only required while the fight is going

Tom
1:07:43
on. When there was a fight over SQL, before Oracle put out SQL, there was a bajillion different ways to do data querying. Some of them had some compatibilities with others and others didn't. Some were trying to play nice and others weren't and then one language came out or one paradigm came out and eclipsed everyone and the world has never gotten off of it and the guy that came up with it is the second richest man on the planet. So you know like you can you it's okay to disagree that we're not going to take over

Tom
1:08:23
everything I don't need you to believe in that, but that's what I think of when I see this system and And that's that I mean we can Sure But then You know someone open source my sequel. Yeah, we want to but we want to be the standard. We want to be like TCP. The world is being held back by the lack of a general means of collaboration. We're not trying to own it like it's ours.

Tom
1:08:59
We're trying to produce it so that it gets adopted. In the area that we're pushing on,

Tom
1:09:05
which is rapid innovation, there only needs to be one highly efficient machine that is provably the most efficient or closest that is ever going to be.

Tom
1:09:18
Yes However, we're talking at the social innovation network layer which networks with network effects tends to end with one dominant player.

Tom
1:09:38
Yeah, one attack all game.

Tom
1:09:40
But similarly, the TCPIP or the USB-C layer, that is necessary, but Facebook doesn't own any rights to TCPIP even though it requires it. So I think this is a great out of the blue sky drop on us because it means that we don't have to do it. Yeah absolutely. There may be others, I mean there was you All kinds of stuff, broadcast, ring networks. Exactly, but that's not our fight, we just accept that.

Tom
1:10:31
So we're fighting at the social innovation network layer and it is beholden to us then to be able to be compatible with as many MCPs is coming out. We need to be as open as we can to get going, even if our ambition is to displace all.

Scott
1:10:59
But yeah.

Tom
1:11:01
Well, ha ha ha.

Tom
1:11:03
No, not even that. It's like we just need to all stop wasting time doing things that we can, like these formulas are not nearly complete, but somewhere in there is a formula that says that the absolute maximum economic efficiency you can possibly get has some kind of formula, and the dreamcatcher as we have it now is not 100% there, but it's closer than whatever else we can find.

Tom
1:11:36
It's sort of, you know, given what we've been talking about, it's sort of like a protocol for innovation.

Tom
1:11:43
It's an innovation protocol, that's exactly what it is.

Tom
1:11:46
Yeah, so someone else could come up with a different attribution algorithm and perhaps that's, you know, better lines incentives and they get faster and so on. But the network effect at the Jim Catcher level is, well, network effect is king always. Yeah, it's king. And so this, like, these numbers are obviously skewed, right, but filling in some

Tom
1:12:14
of these formulas for capitalism, socialism, and the dreamcatcher, these are example formulas and example numbers concocted and skewed to show a point, but there is some formulation that you can make that shows the relative efficiency of these different methods of coordinating economic activity. Ours, like, there should be a very good reason why we are 15% less than optimum. You know, obviously, like, socialism is, like, you know, missing 90-something percent, you know, like that's that's what I mean When I say we want to take it all over we need a system in the world

Tom
1:12:57
That is as close to pure theoretical maximum efficiency as possible I I don't think we're gonna get there hundred percent, but we can damn well do better than what we got now Well, I think I'm measuring it start right? Yeah, yeah. Because otherwise it's just a bunch of people asserting stuff. Yeah, yeah, so anyway I feel like I'm gonna just end up going around in circles talking about that. Well I think again we're in roaring agreement on that one. I'll leave it to you about what we need

Tom
1:13:31
is I will implement that in the coming probably maybe a week or two. It's actually they have incredibly helpfully, they have already made much of what I need.

Tom
1:13:48
Mike, thanks guys.

Scott
1:13:49
And open source too.

13
1:13:51
Yeah, good on them, right?

Tom
1:13:52
Yes. Dudes, dudes.

Tom
1:13:54
and it would be safe for me to start proselytizing about the value of NCP compatible I think yes, but I think what I would suggest to you is to use, have a go with Claude and use it first I've installed it, you've got the SQLite example thing.

12
1:14:22
Oh, you've already installed it and run it?

Scott
1:14:24
Yeah.

11
1:14:25
Can you show it to me?

Tom
1:14:26
No, I can't because I've got my Macbook is on its period. what the live stream needed to hear. But, um. That's terrible actually, I should have said that. Yes, too late now. Apple address.

Tom
1:14:48
Well,

Scott
1:14:50
what now?

10
1:14:52
Okay, so,

4
1:14:54
well that's quite a

Tom
1:14:56
biggie. The next thing was your thoughts about what sent over last night. In terms specifically of the stuck, hash, hyphen stuck dot MD in stucks. In that the narrative generated a whole bunch of naps

Tom
1:15:25
that don't exist. So that is by our own definition a stuck. We would like possibly, you know, in that. All right, so what's the, sorry, what's the question? Where and how do I, oh, and you were going to do some minor edits. Did you do those minor edits on this?

Tom
1:15:52
I did, I did, yeah. Okay, good. So, why is ActorStuck still in there then? Oh, I didn't mean I was going to change that. I just meant that I was going to, because you'd copied and pasted directly in from the output and I just cleaned that up, that's all. Oh, alright, okay, so what we're saying last night was actor's stock is a second order

Tom
1:16:18
directed down to say a tour map. Are you trying to make a definition here that replaces the definition of stucks in domain? No, I'm trying to give an instance of it that makes sense given that really quite quickly generated a whole bunch of maps that may or may not be of use, however, given the narratives, the narratives require them, it's like, where do we stick them? And a quick review of the format of a stuck, because the stuck is...

Tom
1:17:10
Are you saying that you want to make a stock?

Tom
1:17:14
Yeah, because I've got a stock. The first stock is the stock-housing stock. There are many others. If you look at the narrative or in the list of NAPs that were generated yesterday, it's like where do I put these? I'm sort of with you, but I'm still a bit confused. What is the purpose of the document

Tom
1:17:43
reasoning stuck, stuck, stuck? Right. The reason of that was I dumped that in there and you see if you go down, this is probably not the best one to look at actually. If you look at the, if you go up one. Can you tell me what I'm trying to do? I'm still not clear on what I'm trying to do. Right, I've identified in my head a whole bunch of stucks. I want to put those stucks somewhere in a format that is actually a stuck. So we've been talking about stucks, we've been talking about a stuck loop. And you're saying that you don't know where to put them. Okay, well in the

Tom
1:18:29
stucks folder is a great place and since you're the first one you might as well call it gold stucks. Okay. And then so how I would go about that is that I would write the stucks in any format that just came to mind. I'd write them in no format like I just Turn on the voice recognition System and I just scrape so I just say I just blurt it I'd blurt it out in each one I'd be like this is a suck about this thing and I really wanted this and it didn't do that and I was sort of

Tom
1:19:04
Annoyed I'm not sure blah blah and then once once I had once I had like All of them like let's say you've got six in your head. I don't know what goes on inside your head, but six It's about a dozen A dozen? Okay, that's a lot. And then I would then use the long context chat to say Read in these definitions. I want you to Look at these stucks and turn them into some kind of a format given that the stucks are used as described in these definitions

Tom
1:19:46
and then you allow it to come up with it because what will happen I guarantee you is if you do it it's going to come out nested like more levels deep than Dante's Inferno and you do I do not like my nest. You do love a good nest, don't you? But that's fine. I love a good flat.

Tom
1:20:11
So somewhere in the middle, somewhere in the middle, Claude can sort it out for us, right? And that was kind of how I arrived on the format of definitions. It's an important nuance in the art of LLM interactions is that if you can allow the model to do what it wants more, it will perform better for you by a long way. Exactly. I'm feeling rather silly now,

Tom
1:20:37
even having raised this because it's so obvious. We've got the definitions of what the gold definitions can do. It knows about stock. All I need to do is now we've got some instances and that will be enough for it to propose a v01 format. Yeah, totally, man.

Tom
1:20:51
And then actually generate those format for each one and then apply and then we're off to running with... I'm feeling slightly stupid. Man, I feel stupid every day. Don't you worry about it. I'm feeling slightly stupid.

Tom
1:21:05
I feel stupid every day, don't you worry about it. It's such the obvious way of doing it.

Scott
1:21:09
Okay.

Tom
1:21:10
Cool, I want that done, what's next? I can't wait through all this conversation. Now, I guess we've already talked about our workflow, flow which I'll propose a thing to do quite like the staging area so we'll see how it works. Go for gold. What I like the most is that you and I are working in the same space and I'm willing to sort of tolerate pretty much anything so long as we're working in the same place building

Tom
1:21:43
up on the same set of definitions and not like dumping them out the fucking car every so often right? I was also going to tidy up a bit, you've dumped down, see there's transcripts and so on, that doesn't seem like a top level thing but that's just my kind of you know, the OCD thing. Yeah like you can change that, all I was trying to get at is that there's probably a working folder for every induction of stuff yeah and That all those folders should be hidden in or tucked into some higher level folder again

Tom
1:22:38
Yeah, and I swear the reason that this is very sticky cursor is Just that at here's what I'm talking about is really good. Really good. You have a slightly different layout than I have. What do you mean? Do you? Wait a second. No, actually, no you don't. What are you doing? You've just made some tab to have decisions or something. It looked weird and also is white because you know you're a nice guy.

Tom
1:23:19
I'm black because you know the darkness of my soul. But this is hard. I think it's because you're making up for how white you actually are. No, I'm not white, I'm pink. I'm Scotsman.

Scott
1:23:36
Translucent, I would say.

Tom
1:23:38
I'm blue until the one month of summer and then I'm pink and then I turn back blue. Come on mate, it's not a month is it, it's come up with with no actual what's the word for it no it does interesting things hey like it says things that you like Okay, all right, so, well that kind of bombshell of me being a complete idiot has kind of wiped out the rest of the things I was going to talk about because it's all I need to do. So I don't have anything else. Perfect.

Tom
1:24:36
at the end of the day I'll do that summary of thread thing, text you over where I've stuck it and that will give you a view of what we've done. What that will allow you, when you get up in your morning you can read through that and if anything looks weird... Hey, read this! Cross platform credential sharing.

Tom
1:25:00
Where did that come from?

Tom
1:25:16
This was an example that I asked it to make. I was like, come up with a base format and then give me a few examples of that format being in use.

Scott
1:25:23
That is cross-platform credential sharing. Need for secure credential sharing between homebrew platforms,

Tom
1:25:31
which were in the definitions to reduce redundant API authentications. That's pretty good like that's actually a problem. Domain definitions is definitely the... And then it made up some stuff which is a good act as it likes to hallucinate. 12 homebrew platform operators explicitly requested this. Multiple instances of duplicate API usage detected. Oh, what's the solutions here? Implement an encrypted credential fault.

Tom
1:26:13
Develop blah blah blah blah blah. Okay, value estimation. Oh, that's bold. 40%. This thing should go into selling investments. 40% reduction in API authentication cost. How does it come up with that? Ask it. Ask it. You know, say you state 40% reduction in API authentication costs. Step by step, take me

Scott
1:26:39
through your thinking.

Tom
1:26:50
That's a rude question to ask it because I'd ask it to make it up but... Yeah, yeah, no, no, no. It can reason about this reasoning. Here we go. You were right, the question is specific. Now let me break that down first. Identify current call. Uninsure man. Consider any cause. Consider new evidence. Okay, I apologize. 34% reduction was premature. There you go. But yeah, it can reason about its own reasoning. What model are you on? You're on CLAWD. Yeah. Interesting. Well, you can't do long contexts in R1, but we'll be able to once I've hooked up that front end. Yeah. But yeah. But that

Tom
1:27:34
it is that kind of flame edge between backward looking derivative AI and forward looking, you know, whatever you want to call it with the human brain. And I do think that is actually Oh yeah, this I think is an important thing to recognize.

Scott
1:28:01
Oh yeah, I don't know where to stick that.

Tom
1:28:04
I think it's what we're doing and I think we should spend more time on it. Like instead of trying to get our platform so we can use our platform, it's not actually, I think we fell into the trap there of we liked the thought of our platform because of the AI Howls, like if I think about what was useful about our dream to platform it would have been like 95% thanks to open AI and 5% thanks to us and so because of that we should be using the AI as much as we don't waste too much time

Tom
1:28:53
doing copy-paste and repetitive stuff, we can use the AI to do reasoning tasks that are beyond us previously, where that reasoning is about business direction and other such complex considerations. Yes, I agree, and it feels a bit like,

Tom
1:29:11
you know, when you get a new laptop and it's super fast and it's got loads of stuff and for the first month you're just in this glow of having a new toy.

Tom
1:29:25
The honeymoon.

Tom
1:29:27
Yeah, and then you've got to get down and do work. I would highlight one I sent over which was just a thought at the end of the day about tokens. And I have no idea, it feels like that thought should be not just lost in the ether, but

Tom
1:29:46
I don't know what to do with it. I think that we are going to pause this WhatsApp thread one day soon, so maybe that's enough.

Tom
1:29:56
ideas folder or maybe create a folder outrageous ideas or not now ideas. It would be good to stick it inside of cursor because having it, yeah sure we could parse WhatsApp fine but it's going to be parsing. I think that you should keep a separate repo for that just like I keep a separate repo because the danger is we got to keep our shared space clean. Yeah, but it's a bit like, I agree,

Tom
1:30:24
a shared repo is probably the best place, but a place is necessary because I don't know whether there's any value in these two thoughts, but a bit like your inventor's notebooks that you've been keeping for the last 20 years

Tom
1:30:41
or whatever it is. It would be good to put it into somewhere. Yeah, I know. I guess that's probably the function that I think of most when I think of artifact is the ability for me to be able to just waffle on about an idea just by speaking and then have it turn it into something reasonable and reconcile it against definitions and things that have come before and Find a good place to put it. So that's definitely a tool that I think of the most I call that tool Vince Invenor software like that's the inventors notebook basically

Tom
1:31:28
I'll create a repo Separate repo just inventors notebook. Yeah, so so my my repo things in there I maintain two such repos the first one is You can find it Here in This is in our company repos on the network. Okay, if you look at the inverted capital backup branch

Tom
1:31:53
You can see that this commits every time I make any kind of change. If you wanted to see whatever I was thinking about for the previous whatever, you just go into the disk and you can see everything that I thought of that was worth writing down. So what I really want to do is be able to point an AI at that and see… Has Tom ever thought about what a different way of talking is.

Tom
1:32:27
Oh right, or what's Tom's opinion of this thing here, right? Yeah, yeah, it's funny because I was also thinking about once we can connect up emails, I thought it'd be really funny to whilst you're getting an email drafted for you to talk to someone you could also draft the response that was going to come back for the current email because you've got all the stuff that they said to you

Tom
1:32:54
and then you can work out and then you twiddle your sending thing to make that change to what you want.

Tom
1:33:02
That would be awesome because in terms of signal to noise, Getting an AI response, it would need a lot of information about both recipients. Not that much. It wouldn't need very much information to be much better than you already. Oh yeah, that's true. Not the person or you, but any given person. the

Tom
1:33:31
Prompt would be something like I'm writing this email. What's the likely response and Then you've got a virtuous cycle there where it's like that response is like I've already told you about that last month Yeah, well you just go through and you're basically saying I don't want him to say that I don't want him to say that I sort of want to say this and then the bots able to grind through like however many

Tom
1:34:04
loops it takes to make that happen. That's really nice. That's something similar to what we're talking about here. Yeah so I can see how so basically this is gonna sound super fucking petty almost but one of the the entire points of why I have been working so hard to make Artifact and it's not to discount the work that you have done or anyone else has done But where I personally get my like the thing that I'm heading towards is to be able to have the inventors notebook nap So that it does all that kind of stuff so that I don't have to

Tom
1:34:43
Think about it anymore years ago in you know where I'm talking about in Minks in the bar in Minks where we were the only sober people in the room and only non-prostitutes in the room as well. You first took me through your

Tom
1:35:19
Inventors Notebook. That has been this thing I've been assuming that you've been

Tom
1:35:28
after. Right that is the thing I've been

Tom
1:35:33
after this whole time yeah that's what I'm saying. It's not a secret, well it's not widely known. Now it's on record. It's not a secret it's just that's what I want now there's a lot of side effects like if you can achieve that there's a whole range of other useful things you can do but my personal delight will be that system because it would just relieve me of so much toil. Oh, no, but, and, what would be great is, now we've got cursor. Maybe I'd, is this open, this repo?

Tom
1:36:05
Yeah, this repo's open. I run two in Vena's notebook. The other one is dark. You can see it. I'll share it with you if you want, but it's not for public consumption. constantly, I'm constantly thinking about these things and to be able to just record and transcribe

Tom
1:36:11
and put in an idea without expecting a response. But then, eventually, when the context window gets enough, we can see where our thinking is pointing. I don't think we need massive context windows to do that. I think that we need just some sort of entry-level looping algorithms that go through and just sort of tear apart all our everything

Tom
1:36:40
into nice tidy ideas or atoms, and then just, you know, like I would love to be able to have you come in and be like, show me Tom's work report. And then it went through all the commits to the Inventors Notebook for today, and it was like these were the new things that he thought, these are the problems that he found, this is the work that he did, you know, like, and you could go through. It could be, I'm thinking about a different use case. I'd like to, well, for example,

Tom
1:37:09
over saying, what the fuck's a token? Because the idea came when you sent over... What's the different use case? Say the different use case. So the different use case is an idea just before I was going to bed last night. I was looking at the tokens on CLAUD, tokens on O1. I was thinking, well, token sounds like a unit, but what the fuck is it?

Tom
1:37:42
And is there an arbitrage where you could get a smarter...

Tom
1:37:46
Now, this sounds like you're talking about the, like, what is the use case? That's the idea.

Tom
1:37:55
No, no, no.

4
1:37:56
Sorry, no, this is an example.

Tom
1:37:57
I don't want an example. I want the use case.

Tom
1:38:00
Can you take some time and tell me. Yes, okay, I'll go up on. An idea that occurs to me, what I would like to be able to do is put that somewhere, point an AI at it through Azure and say, has this sort of idea been raised

Tom
1:38:21
in Tom's inventor's notebook.

Tom
1:38:27
Right, but taking that to its natural conclusion, what you really mean is anyone in my social innovation network, how novel is this, who else is on it, that's what you want, right? And then ideally, to simplify it again, you want to say when you wake up in the morning, what has the social innovation network come up with that I might be interested in while I was asleep.

Tom
1:39:00
Yeah. Is there anything that you could use? Your news feed is actually all these novel bits of information that the AI has ground through and been like novel, novel, novel. You'd like that. You'd like that, blah, blah, blah.

Tom
1:39:14
And so you're actually scrolling through a social news feed

Tom
1:39:18
of these cool ideas.

Tom
1:39:20
Right.

Tom
1:39:21
And then that would probably spark another idea. But the ideas need to be messy. So it's like take a transcript of, you know,

Tom
1:39:32
talk about all this, blah, blah, blah. Well, you just blurt it out. You just waffle on.

Tom
1:39:35
You could be as indirect.

Scott
1:39:36
Yeah.

4
1:39:37
Yeah.

Tom
1:39:37
Yeah. And then it's available for your newsfeed saying, oh, yeah, he's probably saying this or, you know, random other guy depending on how big this is. Yeah, that's the thing. That's the thing to make. That's the thing to make because that's like, I would find that incredibly useful to see what everyone else was thinking about and to contribute myself. I would find that delightful. Imagine if, I don't know, our old friend,

Tom
1:40:05
UC was on this network, and this morning, I'm thinking about XXX, and it's like...

Tom
1:40:11
There'll be some kings amongst those, like, there'll be some that you're like, this dude is clearly a genius, the amount of stuff that they come out with, but we've got to build that system. I don't know why the hell it's not there already.

Tom
1:40:23
Like, I really don't.

Tom
1:40:24
I think we can hack it with Kershaw between the two of us and see yeah, I think so yeah Yeah, and see and it's the the thing is when I dump stuff in is poorly formed And it's not really for discussion, but you know it's not something that I'd want to right But you don't want to you don't want to lose it. You don't lose it But if you had an idea yeah, but if you had an AI that had a bunch of definitions it could probably tart it up to be actually

Tom
1:40:53
pretty cool or Allow you to see it in a way that you're like, oh, that's good except and so you can straw man your way through it By just picking faults and what they I did. Yeah. Yeah, which is easier

8
1:41:05
remember when you were in

Tom
1:41:08
The Scotch skunk works and we're up in the crypt. Yeah. And there was an idea and you brought your phone, you talked to your phone and so on. Yep. It's like putting that into an area.

Tom
1:41:22
That's what we need. That's why I was like, have a look at this friend device, the Omni necklace thing, because you should be able to just walk around all day and that's all you do. Yeah. Interesting.

Tom
1:41:37
I've got quite a strong social pushback from the family for having that. Yeah, I know. You probably just don't tell them or just hang out with people who have agreed that they want to be – like the OMI thing should be like the dream catcher where we could both turn on and it's like, well, you know, we've committed to being okay to be recorded and transcribed and so now... Exactly. And the thing with the paradigm around cursor

Tom
1:42:16
about regard this, disregard this and so on, we're like, okay, I'm not going to sit down and I have this idea. What's Tom thought about this? Tom was thinking about it a few years ago. Clearly this is the thing that if I had nothing else out of all of this effort except that one thing that you described there, I would call that a great deal.

Tom
1:42:41
A great deal. I think we've got the tools.

Tom
1:42:45
you made the narratives necessary to describe that system and the different use cases starting with the ones you just laid out now and make us a set of stories that describe that thing in progress and figure out what NAPSA needed?

Tom
1:43:05
What I prefer to do is to start dumping stuff down into this repo. Can Cursor look at two repos at once or is there only one repo? I haven't found a way for it to do that, but it can if you open the parent folder

Tom
1:43:25
and then you end up opening both repos, you know, like you just open it one folder higher, that's all.

Tom
1:43:42
Yeah, okay, alright, I'll have a look at that. So you can do it that way. In order to get to what you just asked for, what I would do is I would start using it, and so in using it, that would spark enough of the narrative of how I want to use it, because this is a stock, this is like, this is a direct stock.

Tom
1:44:05
Yeah, this is the mother stock.

Tom
1:44:07
Scrappy as hell, kind of no, but not really. So it's the refinement look and the refinement look would be, okay, well, let's get a really shitty version up, which we can do now through the cursor, because it's somewhere to dump it. And then see how it's used.

Tom
1:44:30
And then those uses are basically renders, and you go, ah, well, actually, this would be a good thing to do. And then we can get to the point of getting the use cases and therefore the stucks for the naps that are needed in order to make it actually happen.

7
1:44:50
Yeah.

Scott
1:44:51
Sounds good.

Tom
1:44:52
Sounds messy as hell.

Scott
1:44:53
That's how it is.

Tom
1:44:54
That's what innovation looks like.

Tom
1:44:55
Yeah. But if we can make a machine that takes messy and makes it clean.

Tom
1:44:57
Yeah.

Scott
1:44:58
Okay.

Tom
1:44:59
Then the world can live within our dream. That's right. I would count that as a side hustle because we're now, the priority is on the Dreamcatcher, however, starting using it. Yeah, I don't know, that's the thing, like, sure, sure, the Dreamcatcher, but actually personally I'm like, I need the Inventor's Notebook.

Tom
1:45:29
But yeah, like the Dreamcatcher is at least the inventor's notebook and then it's some extra stuff on top. The inventor's notebook is, why don't you describe that? Because yes, the Dreamcatcher is the way to get stuff done from scrappy ideas. Where do those scrappy ideas come from? They can be mega scrappy. Right, and then the key being, the social network aspect being two people, scrappy ideas, help them find each other, help them refine, prepare it to help a third to move it forward.

Tom
1:46:20
That's the network piece.

Tom
1:46:21
And then you get close enough to something, it's like, oh, that could be a thing. Let's yeah, make a stock and then Into the gym catcher and then got the virtuous cycle of the gym catcher improving stocks improving stocks Quitting naps and then is done. Hmm. So what I'll do is I'll have a think about how I could get a lightweight social network feed going in that chat interface that I've been prototyping because that'd be sweet to like it not

Tom
1:46:54
just be all about chats and you turn up and there's like a you know a social feed and you're scrolling through interesting things that Scott found yesterday, interesting things that Ben found. But to be honest what I'm really interested in is not reading interesting things as effectively a feed what I'm interested in is going in AI and seeing something like What's you know Tom been up to that is anything to do with things that I've been up to right

Tom
1:47:24
Okay, as opposed to reading through You know so you want to have a chat where the chat has knowledge about your friends Because we both agreed to share our data by way of a friendship, a database connection of sorts. Exactly, because otherwise I could be reading through stuff that's no relevance or of huge relevance and then you've got the filter problem for the human brain.

Tom
1:47:57
So let's work on this. if you're okay, I'll do it. I'll just open a folder, I'll call it, you know, Scotch shit or whatever. Don't swear in the repost, please. Okay, don't swear in the repost. I do swear quite a lot. I'm an ex-sailor though, so. You are an ex-sailor, and look, I can't, it's just that the commits are literally forever. Like, you should not be a potty mouth in eternity. You should be a potty mouth when it's going to be thrown away, but Git is sort of forever, and it's just not the best work.

Tom
1:48:35
I totally agree, and I will. I just found potty mouth being quite an endearing phrase. It's quite cute. Well, I really do hate to be the one to break this to you but it actually is.

Tom
1:48:55
Yeah, I wouldn't actually call it that.

Tom
1:48:57
I'll just say Scott's ideas and then I'll just dump text into that. No need to read them, no need to check them, but then we can point Kershaw at them at some point and go, hey, we've just done this thing with Dreamcatcher, is there any of these ideas that would be pertinent to the golden definitions? There's this small nugget thing here that you've said,

Tom
1:49:32
Scott said there, Tom said here, you all seem to be thinking along the same way in a really messy way. Maybe you guys should talk about this. That sort of thing would be really useful. But for now, I'll just open a folder if it's okay.

6
1:49:50
Yeah, man.

Tom
1:49:51
Go for your life.

Tom
1:49:51
And start dumping stuff into that.

Scott
1:49:54
Is dumping allowed as a word?

Tom
1:49:55
If the colonel dumps his memory, then we can dump our ideas. Anyway, I don't have anything more for this morning. It's actually the joke when they call it a Colonel dump. It shed itself. Guru Meditation as it's blue screen. Guru Meditation.

5
1:50:30
I love that.

4
1:50:31
I'll stop there for now.

Scott
1:50:32
Yeah, yeah. Yeah, yeah.

Tom
1:50:33
Let's just forget.




Transcribed with Cockatoo
