Tom
0:00:00
Do the publication. Okay, you're on buddy. Well, I don't have a computer. Oh God, Christ almighty. Okay, so what do I do? Bring up those two images that are sent.

Tom
0:00:12
That will probably be the best thing and I'll talk you through it. It has to do with definition domains and how they interact. I've probably ignored that one part because I'm going to speak through that one. Yeah, that's a really shitty diagram. Okay, so, the, you notice in the repo that I made a folder called domain and then inside of domain there's domain DCI and called Jim Catcher. Now the reason is, when you're talking about the DCI...

Tom
0:01:00
What is the DCI? I thought that we had agreed that DCI would be renamed yesterday. Yeah, I haven't renamed it yet. Okay, I think you're heavily over indexing on the word domain. What does the word domain mean? Domain means definitions.

Tom
0:01:15
Why don't definitions mean definitions?

Tom
0:01:19
Well, we just renamed it domain.

Scott
0:01:22
It's a domain.

Tom
0:01:23
It's the inside of this domain.

Tom
0:01:25
So domain means definition, okay.

Tom
0:01:27
Which one do we want to go on?

Tom
0:01:30
I think domains. Domains is good. Do you want me to have you committed at the moment? Or can I do renaming now?

Tom
0:01:39
If you like. Ok, let's fucking do it. I prefer if you do it using an AI to make sure that it goes through. I'm only going to change folders. Ok, don't worry, I'll do it. Can we do it now so that I know that it's stable?

Tom
0:01:59
Because it bothers me when a folder structure is out of whack. Go for it then. Okay so I'm gonna move... Sorry I'm just gonna commit my stuff. Yeah I killed this. You always put these little fucking folders in there. Did I? Yeah. I thought that was in my ignore. There was no gitignore. to ignore it that far. That would be why that keeps on coming up. No worries.

5
0:02:27
Full pan.

Tom
0:02:29
Oops.

8
0:02:31
Whoops a daisy.

Scott
0:02:33
Yes, it's mostly the concept because I think the concept has got legs.

Tom
0:02:37
But also, interestingly enough, from our previous conversation on domains, The question is how to construct definitions in an area where you could have namespace clashes, you could have concepts that are similar but not identical, you could have concepts that are identical, but you want an AI to consider two, three, maybe more domains at once.

Tom
0:03:09
And if you make it ambiguous, it goes off the rails. Right, so you're saying that you want to use domains to narrow the intellect of an AI. Right. And then even within those domains, you might have what you were calling filters and views, where you want to even further constrain it down. Exactly.

Tom
0:03:36
But domain feels like a good holistic piece of knowledge. Yes, and it is self-coherent. So, I'll let you do your renaming. I've generated a start for 10 definition. So tell me what is ideas? Ignore ideas for now.

Tom
0:04:05
Okay, that's just a dump space for things that are actual ideas because I got some stuff in there. Whatever. Invent a notebook.

Tom
0:04:13
Why is the invent a notebook different to ideas? Because I didn't move any of the ideas over to you, but invent a notebook is basically ideas for each of us, transcripts, when dumping the transcripts, progress reports and so on.

Tom
0:04:29
Okay, so what's the point of the raw folder

Tom
0:04:32
if everything is contained within it? Raw is just stuff that has had no thought against it, but it's like, oh, that could be useful. But there's nothing next to raw, but you've put a lot of thought into things and burned a lot of tokens on it Is it superfluous to have the raw?

Tom
0:04:55
Demands because okay, we could talk about invention or book another time, but we don't share them

Tom
0:05:00
Okay, so I've taken I've renamed domain to be domains, and I'm going to rename domain DCI to be To be decentralized AI, decentralized AI, right? Yep.

Tom
0:05:10
Another practice, get move domain dci to be

Scott
0:05:23
Why not just right click and rename it? Because otherwise it doesn't show up, it shows up as a delete and a create in git

Tom
0:05:33
But if I do get move, then it preserves in Git how the provenance of the items came to be. Otherwise it just looks like delete and then add.

Tom
0:05:45
But get move is like...

Tom
0:05:47
I didn't know about that. I've been just renaming. Okay. So we're just ditching a bunch of history there. It does sort of figure it out, but this way definitely gets it like it figures it out like if you like moves if you do that rename and then you modify it a bit it might lose it because it actually has to guess at the relationship get move domain dream catcher?

Tom
0:06:58
It's almost like it's the market place, isn't it? But we've used that term elsewhere.

Tom
0:07:03
Is it the stuck loop? Is this the domain of the stuck loop?

7
0:07:07
Um.

Tom
0:07:09
Dreamcatcher because I thought that once all the domains were combined that was the Dreamcatcher.

Tom
0:07:14
Yeah and we've never really got to the bottom of that. Let's put in, what is it? It's the Stuck Loop. Because these are all the participants in the rules by which the Stuck Loop occurs.

Tom
0:07:28
But it's also the discovery of NAPs. That's Stuck Loop.

Tom
0:07:32
So, the discovery of NAPs and use of NAPs. That's Stuckloop.

5
0:07:38
That's Stuckloop. Stuckloop includes...

Tom
0:07:40
No, the use of NAPs where there's no Stucks involved. It's not Stuckloop. Consumption is part of the data that goes into... Yeah, I guess we could call it Stuckloop. Yeah, I see what you mean. Stuckloop is really a component of the Dreamcatcher economic system. It's like the market square, isn't it? It's like where everyone meets. Uh, yeah, the innovation, this is just innovation. Innovation, yeah. These are the definitions that relate to the innovation domain.

Tom
0:08:18
about right? Yep. Interfaces, what's domain rules? Right, that's what I want to go through and check with you. Okay, well hang on, what's, right, what why, what does domain mean in this, in this title? Explain to me the meaning of the title. Rules, so we've just moved the name domain to domain, so domain rules. I'll go through and make sure the internals are all correct. You don't need to do that. But these are what it is to be a domain. It's a definition of a domain, which is like a meta definition. And this is this file more appropriate to be put inside of the reasoning domain?

Tom
0:09:22
It could be that it's reasoning about the reasoning. Yeah, yeah, yeah, yeah, absolutely. Okay, so we'll call this the reasoning domain. Yeah, okay, good. Right, so what that is, again, it's strictly asked, but it is a definition of what it is to be a domain. What it is to be a domain of reasoning. Yeah, what characteristics do you need to follow

Tom
0:10:09
in order to be a domain such that, and I'll go into the dot, dot, dot later on. You need to skim through this. You also need to define what consistency, coherence, and correctness is because you say those terms very often so much that they've lost meaning to me.

Tom
0:10:28
I'm very happy to do that.

6
0:10:31
Yeah.

Tom
0:10:32
Now it's a separate...

Tom
0:10:33
So that would actually be a definition inside of the reasoning domain.

Tom
0:10:37
Right. Exactly.

Tom
0:10:38
Okay, we're getting somewhere. Yeah, yeah, yeah.

Tom
0:10:41
We're getting somewhere. Okay. And actually, each of these probably could be split out into definitions.

Tom
0:10:46
Yeah, yeah. So you'd have like this top level sort of summary and then you'd have the more expanded types of

Tom
0:10:54
rules there. Okay, hey, this is getting somewhere. Yeah, okay, so in order to be a domain, I'm simply asserting this is the kind of standard anyone who wants to create a domain needs to do it. And this is not rocket science, right? Just don't do circular references, be self-contained and so on. But inside of a domain, as long as it is self-consistent, crack on.

Tom
0:11:22
You don't have a namespace clash, you just, you know, if someone else wanted to create a domain that used the word stucks, crack on. But you need to define what stuck is in your world. So then if you go to interfaces, domaindreamcatcher, domaindci, interface.md,

Tom
0:11:46
which also needs changed in terms of the name, of course. This is actually a render of what was previously the domaindci and domaindreamcatcher, saying what is the lingua franca if these two domains want to be considered by one AI? This is the, we've agreed that, hey,

Tom
0:12:06
I'm using this term, you're using that term, and here are the diffs, and here is the additional information that makes it work. So sometimes it would just be a straight one-to-one. It's like, you call it tomato, I call it tomato. They're both the same definition, right?

Tom
0:12:27
We'll call it, you know, tea. It doesn't matter. It could be that one definition is longer, includes a number of concepts than in the other domain, in which case, okay, the interface would split those so that they were self-coherent.

Tom
0:12:53
So that interface allows two domains to just go wild inside of their own domain so long as they are actually logical and be combined with another domain and have an AI understand what the fuck you guys are talking about. Which is why I was talking about lingua franca. It is the common, you know, the common language in order to have two domains that are both logical in their own route. So you're

Tom
0:13:31
viewing an interface as a reconciliation or an adaptation between two domains that have overlapping concepts, but because of the rules of reasoning requiring that the definitions be complete, but I think there's actually another property

Tom
0:13:54
you're not mentioning, which is that they be sparing or, you know, like they be brief.

5
0:14:01
Yes, parsimonious.

Tom
0:14:02
Well, I don't know if parsimonious. Minimal, right? Minimal. Minimal. Yeah. So because they're minimal, you can actually have two concepts that talk about the same thing but share no overlap in their definition because they describe a bigger thing than was necessary to talk about in the domain that they were being used in. That's what you're getting at?

Tom
0:14:24
Exactly.

Tom
0:14:25
And the interface relates the two together. But what you've done here is you've done a reconciliation, but there's another type of relationship that can exist, which is a dependency. In the innovation domain, the payment processing relates to the decentralized AI internal currency or cryptocurrency bridging components because the payment, the value transfer or asset transfer within the innovation domain is enabled by the cryptocurrency bridging in the decentralized AI domain.

Tom
0:15:25
So that's indicating a dependency linkage as opposed to a same-same.

Tom
0:15:32
I agree and I'll show you in a second on my scrappy notes. I'll not go back to that but yes exactly what you just said okay okay so well this is getting strong dude this is getting strong isn't it so that is one instance of two domains can I just take a brief a brief second I got it um I got to upload this file here because it'll take forever because that was a very long time that we spoke. Yeah, go for it.

Tom
0:16:06
God, it is. Yeah, that was a long time, wasn't it?

Tom
0:16:11
Yep, that was a heavy one.

Scott
0:16:15
Yeah, I felt like I was being a bit of a cunt there, but I could just see the end. I was

Tom
0:16:19
like, it's there. No, no, no. It's there. I could see it. It's valuable. And, uh, interesting enough, we're getting much tighter with our discussions. Yeah. I'm gonna drop it right smack daddy in

Scott
0:16:51
here Whoa No

Tom
0:16:57
Okay, maybe I'm not maybe I'm gonna drop it I can't hey Just drop it there and then send it over later on. Because it's not public. Yeah. Necessarily. Did we decide?

Tom
0:17:20
Oh no, we decided we didn't care. Yeah, that's right. Okay. Now, so, what we've got here now is

Tom
0:17:31
we can prove using AI that a domain makes sense in itself without imposing any kind of format or naming convention or anything else. Yeah, that's so funny, right? It doesn't even matter. And then we can get it to another domain with the same kind of internal whatever. Yeah, internal consistency. And then the AI generates an interface between it as a lingua franca

Tom
0:18:04
and saying, okay, so here's what's shared.

Tom
0:18:07
I think you're using the term lingua franca wrong.

Tom
0:18:09
It's probably wrong. I don't know. Why do you use that term? Because of Nassau. Right, so it's not really... Common language between speakers. Common language.

Tom
0:18:20
Languages are different. Yeah, okay, I see what you're trying to say with that, but you're not, that's missing something. Because you're not trying to

Scott
0:18:38
replace

Tom
0:18:40
either language on either side. You're trying to translate,

Tom
0:18:48
and you're trying to... Maybe translation is a better one. Yeah, something like that. Domain 1 talks Chinese, domain 2 talks Romanian. So what's the use of these things? Are you saying that, like can you guide me through an example of where you'd want to use an AI that uses the interface?

Tom
0:19:10
the scrappy diagram, not the written one, the other one. The written one is just my notes. Yeah, okay. So, what it allows is you can create these definitions, which we know can create good stuff if you point a single AI at just that definition.

Tom
0:19:31
So, we can create these domains, and we know that if we point a domain, an AI at a domain, then so long as the questions are within that domain, we get very good results.

4
0:19:44
Right.

Tom
0:19:45
Now, if you want to expand that and say, well, if we want domain one and domain two as the topic, generate an interface, and then you can point the AI at the all three, domain one, domain two, and interface. Why would you, if the interface was altered in meaning to be the overlap, like the union of the two domains, then wouldn't that be sufficient?

Tom
0:20:22
Why would the AI benefit from having... At the moment, all I've done is the interface, it shows the diffs and areas that needs to be reconciled. I think what it really is, this thing you're poking at, is an intersection, where the idea is that if you want to talk with an AI that needs to know about both domains, the intersection is the reconciled and related combination or union of both of them together and then you just feed that in and that's the thing

Tom
0:21:02
that you can see. Yeah, yeah.

Tom
0:21:04
So instead of doing just diffs, you're doing… Yeah, well otherwise you're sort of, you're naturally going to be passing in more information than is necessary by giving the AI... Like, one of the principles that we're drawing upon is that we've learned that if you give the AI too much information, even if it is correct, it degrades the quality of the answer.

Tom
0:21:30
And so, passing in both domains when what you really want to talk about is the union of the two domains. Yes, you're absolutely right. It's an easy change to make. I went with just diffs, but basically you're saying reconcile and produce. I've had to create a new domain. It's the conjugation between two.

Tom
0:21:57
Conjugation? That's the wrong word. No, that is the right word. I was just like, where did he learn a word like conjugation? But the conjugation is dependent upon the original root domains, you can build other domains that are entirely dependent on everything below them. You know, like the artifact implementation domain is entirely dependent upon the artifact domain. And so it would be a derivative.

Tom
0:22:59
That's interesting because what you could do there is say if you've got one domain which is sub-coherent, is dependent on a number of, let's say three sub-domains, sub domains and you're interested in only the kind of master domain and one of those child domains Then you could generate an interface and ignore the other two because it's not interesting you're not talking about that

Scott
0:23:27
Yeah, but you need some way of preserving the lineage in a way that I imagine if the

Tom
0:23:37
AI needed to dig, it could then look at the parents. It's like you're inheriting from these other domains.

Tom
0:23:47
the domains, what is, what domain, inside of the domains there are definitions. And inside the definition is a statement about which domain it belongs to. Right, and so really each domain needs to be turned into a NAP. That NAP has an AI agent that can converse in natural language specifically about that domain. And so if in a conjugate NAP, the need arises to know more about a specific domain that is marked as being a parent, then that NAP would chat using natural language to the parent

Tom
0:24:46
NAP to ask it a specific question rather than trying to become the expert in that domain, it would take advantage of the agent-like nature of a NAP to ask a question, right? Yes, but also the benefit of interfaces is a child domain doesn't need to have any idea of say a universal namespace dictionary.

Tom
0:25:13
No, because it's domain dependent. Yeah, it's domain only. And then that means that depending on the use case, we can either the NAP that represents the conjugate can talk to the user directly, or we can transfer the user. The complete user can be transferred over

Tom
0:25:32
to the parent NAP and continue the conversation there, right?

Tom
0:25:35
Exactly, or you stick your AI at this subdomain, because actually that's the more interesting one. Right, yeah, right.

Tom
0:25:44
Right, right, right. And so really what you want is you want these experts around. So when you go and do anything else, you can pull in a range of these experts, because you might not... Like, to produce a conjugate is a lot of effort to and so you might want to produce like not a conjugate but just have

Tom
0:26:07
a collection of agents on hand and that's different to having a conjugation because you're like well I'm not going to build the conjugation but I've got these. Right, you can have pre-baked, right, because these are just files. They represent NEPs, they represent agents when they're published.

Tom
0:26:29
Exactly, exactly. And there's one other concept. You see on the right hand side, I put Domain 3, Domain 4. They've each got their interface. And then as those two interfaces

Tom
0:26:45
can interface to Domain DC in this case through another interface and it's the same thing. It's exactly the same thing but you're getting what domain 3 and domain 4 know and what domain DC knows through a single interface that you can point an AI at and it is coherent and you get good results. It's like domains is the same as programming because they look like package dependencies or class dependencies. AI can point at is entirely NL. So you don't have to publish your API protocol.

Tom
0:27:35
You just say, here's my definitions, here's my domain. This is what I think. This is my domain knowledge. This is my domain knowledge. Yeah, and it means that when you call API functions or tool calls that are included in a NAP

Tom
0:27:52
that has reasoning attached to it, the chances are that your consumer is going to be able to figure out more accurately what's going on.

Scott
0:28:13
Yeah.

Tom
0:28:14
So, yeah, like I think that every NAP should really come with a little bit of reasoning if it's a sufficiently complex thing. So I mean, the CRM would need to come with reasoning, describing what terms are and how they relate and how processes work and all that, right? Like, that's basically the statement of the system,

Tom
0:28:36
which is starting to knock on the door of business rules. Yes, well, it's interesting because what we got with domains and interfaces, if we take interfaces as a conjugation of domains and therefore it's like a just-in-time domain, perhaps. What you've got now is a vector where you can point a single smart AI at it of any kind and it knows what you're talking about.

Tom
0:29:05
And so the reasoning of models as they improve and so on, doesn't change any of the structure behind this. No, like no matter how smart an AI gets, it's not going to eclipse the reasoning. It might refine it a little bit or give you some insights that a human didn't get, but it almost needs to be there even because it's the only way that humans can actually understand what's going on. Like as a human, we need the reasoning in there

Tom
0:29:43
as well as the AI at the moment needs the reasoning.

Tom
0:29:47
Yeah, because like a single bot, no matter how smart it gets, you've still got to understand what you're actually talking about.

Tom
0:29:55
Yeah, and that's really the value, right? Like all these companies, it's like if you can have something that has private data that's of use to the AI that gives it a superior

Tom
0:30:04
result then that is very, that's critical, that's a critical value add. Now the interesting thing that was starting to emerge on this and I'm less sure about this but it seems to just fall out for free is, I mentioned, an NL version of TCPIP in in that any domain can talk to any other domain

Scott
0:30:32
by creating an interface and then pointing an AI at it.

Tom
0:30:35
No. Any domain can talk to any other domain by talking to the...

Tom
0:30:44
Sorry, let me rephrase that slightly. I'll tighten up the language. An AI can reason about the conjugation of any two domains through the creation of an interface. What? We just agreed that a conjugation is the interface,

Scott
0:30:57
I thought. Yes.

Tom
0:31:00
But you've got the interface is like a just-in-time domain

Tom
0:31:04
that involves the conjugation of two or more domains so that an AI knows what you're talking about. But it is completely agnostic to what those domains are. It could be anything. You could pull in any domains that you want into a conjugation and then point the AI at one thing and you know it's going to be self-consistent and the AI is going to get good results. Now, you lost me, you lost me. Why would an interface in a conjugation be different? No, no, I'm using, we're just starting to use conjugation as a replacement for the name

Tom
0:31:57
Right, but the interface is not meant to be generated by a bot on the fly, because the interface contains novel information not present anywhere else. Just like a reasoning domain, the point of it is that it contains novel information not already contained within the LLM's knowledge. Yes, but the whole point of the conjugation is, sure you can have them generated before and so on,

Tom
0:32:27
but it allows an AI to talk about, with specificity, using the information on any domains that you want to bring into that conjugation. I'm not getting it well either I think. I need to go.

Tom
0:32:56
I think that I've sort of run my course for the day actually. Yeah, cool.

Tom
0:33:01
I'll continue to think about this, but there seems to be something really interesting here about having domains and having a method of an AI consider any collection of domains it cares about. Yeah, yeah but considering a collection of domains is different to considering the interface between the two domains because the link or the interface between them is not obvious from just looking at the two of them. So therefore the AI will be

Tom
0:33:54
unlikely for two very well formed domains where the information is terse, coherent and complete for that domain, if you just give a bot both domains, it won't be able to deduce the relationship between the two of them in some areas. Yes, but that's not what I'm saying. But I think we're getting close to this stack and I've just had a phone call from Judas, so I probably need to go as well. Let's pick this up tomorrow. Sounds good, buddy.

Tom
0:34:32
I'll keep thinking about this one, but the important thing is it follows up for free. If you get a definition of what a domain is and what a conjugation is, it seems to follow up for free that you can combine any number of these things. Now, some of them practically might not make sense, you know, talking about...

Tom
0:34:57
All right, sounds like we started talking about it again.

Tom
0:35:00
Yeah, yeah, yeah. But let me think about it some more. Okay, buddy. But there seems to be something that's for free here that could be quite interesting.

Scott
0:35:07
Okay. Okay.

Tom
0:35:09
Right, I better go and find out what I...




Transcribed with Cockatoo
