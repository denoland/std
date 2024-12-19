Scott
0:00:00
Please, please no bugs, OK, pal.

Tom
0:00:05
OK, that's a good opening line to the recording.

Scott
0:00:08
We still got it.

Tom
0:00:11
Yes, too annoying to, we'll live with it. I'm sure we're all adults here, I mean, we see it as... Remember not to swear when recording. Or at all, really, but that's sort of... I mean, I don't know what that translation... I mean, what was that word?

10
0:00:28
I don't know.

Scott
0:00:30
It was my hand controller for the quest. It was lying on the function key, so it's been sitting waiting all night. All night, alright. For me to say something. And I walk in in the dark, fall over, swear. Translates it to that.

Scott
0:00:46
And I don't know why it sent it.

Tom
0:00:48
Probably because of my mistake. Anyway that's what translated to. Okay and we had a rough day today. GPT was offline for two and a half hours and a lot of people didn't know what to do with themselves including me. It's remarkable isn't it? It suddenly left me feeling

Scott
0:01:11
like I was... It's like having a power cut.

Tom
0:01:14
Worse, it's like driving on a very far away road and then hitting a massive pothole and your car breaks down and you're like, oh, I'm actually in trouble.

Scott
0:01:23
And also, the one thing, this is quite amusing, if you want to bring up the screenshot that you sent over, which I went and had a look at as well, it's like, you're an open AI company company that just released one of the best models and the best you can do is we're looking into it twice. Well they didn't have the AI right like when they go from the AI we could see right okay can I ask questions about your incident

Tom
0:01:52
because this is magic and they do happen of course. Yeah. At the very least put an AI up. The AI went offline you can't expect the AI to be online to answer the incidents queries when the incident was about the AI. No no no I disagree with that because when was the last time Google had an outage? Pretty recently and I've actually never experienced Google down no one's yeah yeah so open AI, eat up your game here guys. There are ways to do this. At the very least, give us an AI to talk to when you've got an outage. Ok, well look, a friend of mine, even when he started using the built-in WhatsApp AI, he was at, lost for, ooh.

Tom
0:02:44
Anyway, where are we at well I have been Lost a little bit of time today, but The key thrust of what I've been working on was how to get the bot to code okay, and I made a couple of a couple of things here, and then I took on board

Tom
0:03:15
what you mentioned about how concat should really be a NAP and then I started bringing all the NAPs in to the big old NAPs folder Because what I realized is that this has helped me think about how to run NAPs on the command line because I can make a very small NAP that is like the CLI that turns any NAP into a CLI. And so what I'll do...

Tom
0:03:50
Oh, that's a really cool idea because then it's a small set for example to make a bash script. Yeah, yeah, and so right now we've got this concat command, but what I'll change it to is to be like naps, and then you'll go naps concat or naps web scrape, naps transcribe, naps YouTube, and all the naps are now available as a CLI command for you in the interim.

Tom
0:04:21
Yeah, but no, what you said before though is really, if you have like a bootstrap NAP, then you can talk to it in natural language saying, right, can you contact all the readmes in this folder? Right, you mean even for doing operations on your local machine? Yeah. Yeah, so I realize that the mental model for running a NAP on your local machine is just the actual file system and

Tom
0:04:53
then if you have git the version history is the actual git and That's the same mental model and it really helps simplify things in my mind of how that's going to work for the cloud-based git file system of artifact Where you can have these multiple concurrent independent Independent branches of the file system and it sort of stumped me for a little bit, but now I'm like I actually that's that's easy

Tom
0:05:16
And then I can test the naps Using the local disk because you know Yeah Yes, so what I made today was I made first of all I extended Kinkad so that right now when you call Kinkad provided you do the install for the latest version from that version on it will check for an upgrade and it will tell you if there's one of the comments about exactly this.

Tom
0:06:08
Yeah, yeah, so, I mean, you were asking me how to... The place we've got to get to is that your programs should all upgrade automatically, but under your control. So you're like, you know how like on your phone you have auto update and blah blah blah like that that's how it should all be for software modules as well. Yeah but that then begs the evals question. So when when you get the do you want to install the next iOS? I go I don't know do I? I've

Tom
0:06:43
no idea. Yeah so that that calls on a deeper problem, which is when you say what's changed we need to have kept in memory somewhere what your version of what your idea of what of last was. Which points to kind of, everyone has a personal fork of the NAP. Well, you've always got your own home directory stores little bits of memory about you I think or about stuff that you've been chatting about so yeah it's a little fuzzy to me how that works but I think it's actually not as on the one hand it's not as

Tom
0:07:29
complicated as it may seem on the outset but it's also really fiddly to get right I think.

Scott
0:07:36
Yeah, yeah, and it might be too much of an ask, but if, for example, my phone, you might usage, and say, do you want to upgrade? And go, I don't know, do I? Tell me. This is, oh, okay, right, I've checked your usage over the last six months,

Scott
0:07:53
and you're not going to be able to do this anymore. This has changed. Oh, yeah. Yeah, right, like things that matter to you,

Tom
0:08:00
it should be able to tell you, it's like, well, I upgraded the phone and pretended to be you the same way that you've been for the past few months and I had a couple problems that I couldn't get around, so maybe don't

Scott
0:08:14
upgrade. So there's kind of in any kind of major upgrade, iOS is a great example, it's take or leave it. But some might be a retrograde, as in you've lost stuff that you actually really liked. And some you haven't actually thought of that are prograde. That's you're thinking, oh, actually, that would be really cool.

Scott
0:08:37
And then I'm using these nabs, you know, what additional facilities do these nabs call on, on these upgrades that I don't think about.

Tom
0:08:51
Yeah, so that's definitely an issue but it's a more advanced feature. Yeah. But yes, so tell me about the CONCAT. So CONCAT now runs, just runs a version check and then it will suggest to you now the interesting technique that I want to talk about here is To be able to make that call It was it needed to add in

Tom
0:09:24
This this little snippet here No, although I a new version. I just migrated this whole folder over to this, actually it's probably not really doing, yeah I moved this whole folder that's why all the areas and stuff are there. They aren't there in the published version but basically again I wrote no code and I just prompted using the previous concat. And this new tactic that I've got is a folder called VendorDocs, because

Tom
0:10:07
in order to check the version, it needed to make a URL, it needed to do a fetch call to an API to figure out what the latest version was and then compare it. And so VendorDocs is where I've sort of said, well, the API of this website, and I just copied this from the github of the of the vendor of the API so and then I added that in the concat file and was like here's how you call that API and that was enough for it to I think on the first hit actually it wrote this thing first go and now it's got a version checker. It's

Tom
0:10:56
a very simple thing.

Scott
0:10:58
Just before I went to sleep I knocked out that text message. Yeah. And here it is.

Tom
0:11:04
What do you mean you knocked out that text message? The text message when I was talking about wouldn't it be cool for Concat to be version aware. When did you say that? I said that last night. I thought that's what kicked this off. This is what kicked this off right? No. Nowhere do you say that sir. If you go further up, last night, what was I saying? On this side. Dark day.

3
0:11:38
You had some issues with messages.

Tom
0:11:40
Oh, hold on a second.

3
0:11:42
Does it matter, I guess? Is the thing, like... It kind of doesn't.

Tom
0:11:46
Except I thought that's what I don't leave I'll leave I'll leave you to make a note of what happened you might have lost the message somewhere or you just thought it and didn't write it down because that's So that's that's yeah, okay No

Scott
0:12:12
So just to jump around a bit because that's how we like to roll

Tom
0:12:16
I went and I still wonder about this ongoing ingestion process of ours and so I made this folder ingestions and then I made a folder that was sort of the topic and then I ingested your texts so that I was trying to get going was a tool, and I want to talk to you about this tool because me spending time on tools, it ain't good if we don't need them, right? Or if it doesn't help some understanding.

Scott
0:13:06
Yeah.

Tom
0:13:07
Benefits I'm getting right now from building any kind of tool is learning how to prompt 01 Pro to generate meaningful code and patches patches being more important than blank slate code Trying out different techniques and things there Learning how the NAPS interface work on the file system very useful very insightful so this

Tom
0:13:28
last tool that I want to make is the tool of Is the tool of saying That if I if I share a link

3
0:13:36
Then what I want to do I

Tom
0:13:39
Was trying to make a I was trying to make a little Nap that you give it the shared link and it will download the chat into the ingestion folder because those chats are actually quite valuable and The esoteric problem is to say that if I made the code without coding, then what's the new source code? You need to see the prompts that I use and you need to see the output and all that. That's the source code now because that's what made the code.

Tom
0:14:41
Yeah, sorry. Go ahead. You were just agreeing right? You didn't have a question or something?

Scott
0:14:53
No, no. I was well actually I was going to have a follow-on in that yesterday you asked a question which I suspect prompted this.

Tom
0:15:02
When I was saying one pro seems to be really good at writing prompts. Yeah that didn't.

Scott
0:15:10
And what was the thread and it took me like 10-15 minutes to because it was multiple threads.

Tom
0:15:16
It was like... Yeah, yeah, yeah, yeah, yeah. And then you sort of start to end up like when you write the module, you sort of end up with a little prompt that's custom made for that task that you refine and it gets quite good. And that's the, that's actually the new source code. It's like the seed code or the seed of the, that was given to the model to produce the code is very important. And so being able to capture that is good.

Tom
0:15:49
Being able to capture what the get snapshot or what the concatenation output was that was given to the model, like what context did the model get plus the prompt equals the code. Even, you know, like, so all those things, right. So, I generated some words about that, but basically it sounds like you're saying

Tom
0:16:14
that that's a good tool to have.

Scott
0:16:17
Yes, and I think it's a good, it's a cool app too, right. Because I could just like save off the end result of you know yeah

Tom
0:16:29
it's just that the danger is that these tools are only here whilst O1 doesn't have an API and whilst we don't have our platform but I guess because it's such a light tool to make I will persist with it I guess right like this yeah it's just text isn't it I mean and drill down is a thing but yeah because these things are these things are remarkably easy to make now that I got a one pro it's just that this one didn't I was like oh that sounds like half an hour but it turns out it wasn't because because I kept

Tom
0:17:05
hitting a yeah it turned out that when you when you view the shared chat, the data that's being shared from O1Pro it actually includes the background reasoning. And what I've done is in my instructions for the model, I was saying, okay, the AI assistant is named pro. The assistant's responses include hidden reasoning steps before the final answer because in the first versions of the code I ran it was sort of intermingling or getting confused between the

Tom
0:17:49
reasoning text and the assistants true response and so I said that I wanted it to include the hidden reasoning and it turns out that that's forbidden because they're trying to protect people from figuring out what's happening behind the scenes in their reasoning.

Scott
0:18:08
It's a bad button. That's a shame.

Tom
0:18:12
No, but it's not like, I don't think that I'm, I don't think in any way I'm violating terms of service here. It's just triggered the moderation falsely because that information, that data is available to you when you share a link publicly. A person doesn't have to have a GPT account, they don't have to have anything, you can get this link and you view it and you can see the hidden conversation. So that's not, it's just that what's interesting is I've obviously clamped down super hard on people trying to jailbreak or get the model to dump its reasoning.

Tom
0:18:55
Yeah, yeah. You know, like this is... It kind of makes sense from the other side of the point of view. Looking at it from an incognito window, this is what you would see, and then it's got the... All I was trying to do is just store that data too. So it's all like that's part of the public exposed data

Tom
0:19:18
when you make a public shared link. And I think I'm doing them a favour because the other way I could get it, our own chats, is to export the whole thing as a PDF, which puts a lot of load on their servers? And then extract the chat I want but if I do it this way make a public link and then just read the public link

Tom
0:19:44
And store the data like I'm sort of being very light touch on their servers to get something that My guess is getting these guys are smart probably what they've done is they started with the kind of the minimum or the most clamped down and then we'll Expand it yeah, yeah, it's interesting that they protect that so hard like that's the absolute That's the hardcore thing that they're guarding How the reason haven't

Tom
0:20:16
So yes, I'll go ahead and make that tool. I think I know how to do it without tripping that over zealous moderation. And then what that means is you'll have the the ingestion of things like whatsapp chats, the transcriptions of stuff, but then also good worthwhile conversations. Like for example the you know the blockchain, blockchain of thought There was a discussion that been and I had and then I used some prompting to Have a chat with a one about it, and I smell no one's own process bonds extremely useful

Tom
0:20:59
but you know it then I have to go and reason it through the domains like Yes, right, so you've just a question

Scott
0:21:09
Yeah

Tom
0:21:10
Yeah, I mean I prefer to use O1Pro, but the thing is that the chat becomes now an ingestion because it's not, it brings in novel information. So that's what I'm getting at too. So I think you sound like you're in agreeance that. Yeah, I'm getting the same experience. Chats are reference data or original source data that you need to ingest and then reconcile across the reasoning domains. Right.

Tom
0:21:46
Basically. So, the thing that struck me with the CONCAD when I was using it is it is derivative in that we're taking the whole thing and then you can summarize it and you can get derivative of derivative, but what would be great is to be able to drill down if there's part of a summary of, of course, definitions and you're saying, well, why are you saying that? It would be great to be able to go back to the original file and saying that's, well, it's because of this and an interaction of that.

Tom
0:22:18
You mean like for it to be able to give you references to why it thinks a certain way?

Scott
0:22:23
Yeah, yeah. And it should be up to it.

Tom
0:22:26
Alright, well, I mean, yeah, so long as you provided all that stuff to it. Yeah.

3
0:22:31
Yeah.

Tom
0:22:32
Okay, and the other thing I made, which is in preparation for, I had a friend of mine who's got, he's been through a lengthy court process for the past year and a half, taking on an insurance company, company and you know you can 3d print a pistol with a sinus I suppose. Or you could take some of the very lengthy documents and run them through Pro and so I was he's gonna send me a couple of examples where he's sort of written a brief for his lawyer and attached some PDF documents for it and ask some questions and I want to use that to see how well O1

Tom
0:23:19
Pro does on going through all that sort of thing. Well that's, I've done in the recent few days, well when was it, two days ago, our good friend Marla asked me to help her with Pro in producing a service level agreement for a mentorship contract and it was remarkably precise. Yeah, so we'll see how it goes but the thing that you need to make ComCat work with PDFs is a PDF reader and so again using the same techniques that I've been playing around with today, I made this module. I would guess it maybe

Tom
0:24:06
took me maybe an hour to two hours? No, like an hour and a half worth of prompting, but the time was mostly because I was experimenting and I was doing other things as well and all not right sorry my bad scrub thing yeah and now that runs yeah and it ran and it generated this JSON file out of the example PDF pulls in all the metadata about it, pages with links and all that. So that's if you want everything about the PDF, which includes information about the locations of things, so you can sort of reason about the

Tom
0:25:05
layout of the page. But I also got it to, again using prompting, add this extra switch dash dash text which now takes the PDF and Writes PDF text it puts in the metadata and Then it reads in all the text and it splits it by page but it still just gives you the text and so what you should what you should be able to do is When you run concat if it comes across a PDF it should be able to go turn it into text and now you're... and reason about it. Yeah and so and so when my buddy sends me this these

Tom
0:25:47
PDF documents this is how I'll turn them into something that I can give to R1 Pro because even though even though R1 Pro has the attach files button it attaches it and in chunks it it doesn't yeah you know like it's not the full window. It's like I want everything in context.

Scott
0:26:06
So that is super cool. And actually I could use that myself. But what I'm really interested in is your thoughts about this process,

Tom
0:26:15
which you said took an hour, hour and a half, whatever, to generate this.

Scott
0:26:20
Yeah. That process, how are you feeling about that? Or more importantly, actually, more precisely,

Tom
0:26:28
is there anything that in those steps feels like a cut and paste or manual step? There's a lot of cut and paste and a lot of manual stuff. But once we get API access to O1 Pro, what's going to happen is there's going to be a range of prompts that are like a preset prompt. Like if I want to make a CLI, there are a set of rules that I've put in the prompt,

Tom
0:27:05
like what library I want to choose to use for, for example, doing PDF extraction? You know, there's a bunch of like repeated sentences that I find myself using in these prompts and so it's almost like there needs to be a way to like mix and match the prompts now I know that we had a bit of a dust up over that mixing and matching of prompts thing in the past But I've chilled out killed since then yeah

Tom
0:27:49
But I think that in this case because you're planning to interact with the system You're not like needing it to run as a CRM or something. You're actually in the creative area, that inserting these different prompts, because you're going to regenerate the prompt over and over and over until you settle on something where you're effectively human evaluating it in a way, I think that would be useful to be able to bring in chunks of preset prompt that people have found useful? I think that'd be brilliant.

Tom
0:28:28
Essentially, that's like a, well, it's similar to a natural language bash script. It's like, and what you don't want to do is to have to go through that human eval from, you know, No, no.

Tom
0:28:45
Page.

Tom
0:28:46
Yeah, so I think what's going to happen is that we're going to end up with the ability to have O1 Pro be the evaluator of the code that it generated. And so, as a human, you'd say what you wanted, and then O1 would have a shot at it, and then O1 would run it, and then O1 would sort of consider maybe what it should be, and then do a few more loops before getting back to you as a human. But I can't see it going like, what is it more than that? I mean,

Tom
0:29:21
if I can get working code where honestly I didn't, like I made one or two edits, but they were cursor assisted and they were very minor. So what does that mean for the industry of code creating? It's like, well, I can only do that because I understand the code and I can skim it as well as read it deeply. And I can pick architectural changes to make.

Tom
0:29:48
Like, I want to use a different library to do this thing. That's a big change to introduce. But in terms of rate of code, I mean this is like The future so the vendor doc strategy I applied a bit differently here that turns out you sort of got to do it a little bit bespoke for each library like for example in this in

Tom
0:30:15
this particular module I had to pull in the whole source file because they didn't have an easily accessible document about it. They had documented their code by making it be well documented in the comments. And so I had to bring the whole file in. Whereas this module had a readme file and so like this was how I told it about all the options that it was going to make it support right like it can support page ranges, password, you know it's like with a little bit of

Tom
0:31:02
poking you can get some very useful code that I don't even really know how to to describe it as like. Isn't the poking just if you were to have the context of your, the types of preferences for libraries and in this situation I did this and this situation I did this in the past, just do it. would make it almost one shot. Moreover, there's a social network

Tom
0:31:38
opportunity where me and my friends can have or publish or expose the modules and libraries that we've found good coupled with the prompts that we found work those libraries in well. And so there'll probably be an adjustment period where published libraries sort of balance how to make their instructions be LLM consumable. It feels like that, doesn't it? But that is definitely an aspect of social behavior that we can try to leverage somehow.

Tom
0:32:18
There'll be some convergence, won't there? Given the pressure that using NL is so powerful, NL being dynamic in its own right, it's going to be a bit wiggly to start with, but eventually it's going to get a bit lighter. It's going to settle.

Scott
0:32:36
Yeah, it's going to settle.

Tom
0:32:37
So that's definitely the future. And this is just O1 Pro. One year ago we had GBT4 and we thought that was fun. In one more year what will we have? You know so the trend is clear like coding is over and even these modules that I'm making I'm like I'm not sure they're so tiny. You know like what's the point of big code bases anymore? Well, not a challenge, but here's an interesting question.

Tom
0:33:12
How wrong would it be if inside of an NL prompt you say, I'll read this PDF and there's no tool for reading PDFs and it simply goes off and reads the tool or creates the tool and then uses the tool and then discards the tool. Yeah, that'd be fine, but I just wonder if, you know, there's a finite number of tools that you ever need, like, and from there on in, it's just, if you have a NAP format, like, the only reason I had to write the code is because the NAP format is not there. formatted as an app, I wouldn't have to,

Tom
0:33:56
you know, they would compose well, I think. Yeah, yeah. That's really the problem. And also, just to edit what I just previously said, you don't need to discard it. What you need to do is, if it upgrades,

Tom
0:34:10
you know, you need to know whether you've actually gone retrograde or prograde as a user. Basically, just in time code. So basically I'm saying that the NAP format but without the NAP format I still got a pointer at the docks and then do a little bit of integration work to make the code sort of you know fit it yeah yeah but NAPs

Tom
0:35:06
don't have that issue. NAPs don't have that issue. You know similar situation when I Was kind of an AI in the loop and you're still in AI in the loop. Yeah We'll get out of this thing the other stuff I wanted to show you was when I paused the Chat that I had with Ben

Tom
0:35:30
Which I was trying to save to this but ran out of time today. The idea is that it puts forwards from something that we weren't able to outright say, we were just able to sort of grasp at it and poke at it around the edges, and I thought it came out with some really good concepts. So it says, thinking of Git as infrastructure hiding behind the scenes, imagine it as actual mind space of an AI.

Tom
0:36:15
Commits become thoughts, branches become possible worlds, and mergers become negotiated alignments

5
0:36:20
of reality.

Tom
0:36:21
Oh, nice, nice. That's not good. This would mean that interacting with systems wouldn't require separately building APIs or wrapping logic and adapters The thought process would already be in the universal language of code and data tracked by kit Yeah, now what he said what what he said right like what what what the 200 US dollar per month But shit right, but then but then to

Tom
0:36:44
To reverse reason that I asked it to compare what it's doing against another blockchain. Yeah, okay. How did it come out? The types of questions that it asked I think were the most stunning. So one of them was really good. Here we go. Can the chain's artifacts be directly consumed by standard developer tools, continuous integration or continuous deployment pipelines, model registries or container registries without translation? And so it's basically saying like, is your blockchain format able to interop software ecosystem without a translation layer where you'll lose provenance,

Tom
0:37:40
signatures, time, cost, all that. That is...

Scott
0:37:47
Why didn't we think of that? It's the loss of provenance. The loss of provenance, yeah. Yeah, yeah, yeah.

Tom
0:37:55
And so, um... There were some other good things as well. Can we trace not just the code but also the discussions, proposals and decision making processes that lead to a given state? I'll be talking about that. That's what I've been saying. Not as nicely as that you've been saying. No, no, no, no, it's succinctly. It took me about 20 minutes.

Tom
0:38:16
a good one. Are consensus and network security achievable without relying on a native tokens economic incentives? And so what that helped me see is that actually... Oh, fuck an hour. Okay. And so what that showed me was that all these existing chains, like, when we want to compare ourselves to those blockchains, we need to consider the economic and social structures that are formed around them, where almost the majority of them have a token, and the token will not be moved like you will get lynched from the token holders if you try to remove the token change the

Tom
0:39:21
token or in any way alter the promise of future value that that represent and so Wait, wait, wait, wait, wait. It set it really nicely at some point. I'm sorry for the pause. It will definitely be worth it. OK, standing by. Oh, that was where I was just suggesting the idea to it that proof of work need not be

3
0:40:01
a single proof of work chain.

Tom
0:40:04
You could do work in a branch and then when you present it back or to other branches, you could demonstrate the amount of work that you've done as a sort of an offering of the sanity of the work or the meaningfulness of the work that you did on it.

3
0:40:33
Yeah.

Tom
0:40:34
This is a bit of a hobby horse, but I don't know whether you asked in this thread how you'd incorporate or check against other chains for proof of work which wasn't simple computational effort or ownership of something. For example, I've got a wheelbarrow, I'll wheel it 100 yards down the road or I'll take

Scott
0:40:58
my boat across the river.

Tom
0:40:59
Yep, yep. So there's all those kinds of other types of work that can be used. How easy is it to evolve the protocol over time, add new features or adapt new technological standards without causing ecosystem turbulence. And so that token actually is like a death anchor. It's like a, literally it will stop you from being able to evolve because of the anchoring type of thing.

Scott
0:41:33
No, I don't get you. Sorry, could you reword that?

Tom
0:41:38
It seems that when we're comparing ourselves to other blockchains Their biggest fault is their token the fact that they have a token at all Means that they... Mechanism. Well, it's a distorted one There really was a nice statement I was looking for here, but I've sort of missed it This was the about the on-chain training data

Tom
0:42:05
No, I'm sorry buddy, I might have... Yeah, no worries. But I think you've demonstrated a couple of things here. Now these, we need a way of capturing these chains, these threads. Yeah, that's what that download thing was supposed to be.

Scott
0:42:53
Yeah, if we can do that, then we can kind of meta reason around these things on more than one person, right? This is your chain of thought, and it is fascinating, and if you don't mind sharing that to me, I'd love to go through that in detail.

Scott
0:43:12
But then I'd also, a week from now, because AI generates so much detail so quickly. Yeah, that's the issue, right? A week from now, you'll forget it. Yeah, that's why we need to be able to commit it into Git

Tom
0:43:27
and make sure that these nuggets are held on to.

3
0:43:40
But yeah, so there was only like three token free blockchains that it could come up with.

Tom
0:43:47
Really, so. Yeah. I don't have a clear answer but I feel, I hate to say feel, that word is very woolly, but I feel that what it's pointing to here is a deeper idea about incentives now Dreamcatcher has got what we think is a clear incentive program. But then integration is the other topic which you are pointing on here. And that in itself is, you know, we can, if there is something that doesn't have a translation layer,

Tom
0:44:52
that has incentives which can be reconciled, then any efforts at any point, including putting money in one, can be used in any other, or something like that. That's a really, sorry, it's a really, really idea, but if you can send me that over, that would be very useful, or even better, if you could like commit that somewhere.

Tom
0:45:20
Commit it, yeah, I'll commit it. I'll commit it. Yeah, so anyway, I mean, yeah, we're not in nearly as bad a spot as I'd thought, but it actually means that that we cannot launch with a token. The token needs to be contributions. That's the only currency of the whole system. It should be able to trade assets and we can make a pooled asset that's a mixture of die and eth and whatever just to make it intrinsically easy But the main issue with all these other chains is that their token is intimately linked to their consensus.

Tom
0:46:05
So if we launch with token-free consensus and it's kind of like a proof of useful work or proof of genuine computation or proof of trade, proof of something. Proof of actually doing useful stuff. Yeah, proof of capacity, proof of inference, proof of all those types of stuff. Then so long as the consensus mechanism is separate from the token, then we won't get the distortion. It was the distortion that was the main sort of thing I was trying to find for you here. Actually take your time because I'm very interested in this so if you need to take a couple minutes to read through and find it. Yeah I think I just

Tom
0:47:04
did. So token agnostic security unlike proof... what heading was this under? So this was a description on the proof of use for work thing, and it's saying that token agnostic security, unlike proof of stake or token based model, this system doesn't rely on internal currency for security. It uses the cost of computation and electricity as the barrier to rewriting history, thereby removing the unfairness or distortions introduced by a chain's native token is actually at fault for hindering the expansion, the reach, the...

Tom
0:47:49
For the system. And that's why we can't have a token.

8
0:48:06
That's why we can't have a token.

Tom
0:48:08
But having, like you could as a thought experiment imagine, what if there was no currency? What if there was just this big ass AI telling you what you're worth for everything you did and then you know you could chat with it and be like hey

Tom
0:48:36
what's the best thing I should do today and it'll tell you and you're like I'm

Scott
0:48:42
gonna go swim in the river instead

Tom
0:48:46
that's fine too but it's like when it comes it's like barter barter managed by AI. That's exactly what I was about to say. Yeah, but Bata, I mean, Bata is the future and everything really is Bata. Money is just like a very common denominator in Bata. That's why it gets treated differently.

Tom
0:49:02
But we need to get to a system where the economic trade is handled or valued by an AI because humans can't help themselves but be out for themselves or to feel wronged. Like they always either over inflate or over wrong them, over victimize themselves. Hold on, you're effectively minting a future right to your contribution, which inherently, because that contribution is only going to be assessed after the fact as in the impacts yeah the impact's not clear until after the fact right um but you've still got a history of contributions which is a thing

Tom
0:50:12
um and maybe someone wants to speculate and say you know hey how about you uh i give you, I record a contribution to you in return for these contributions future assessment of value through attribution going to me, then contribution is a fact of the token.

Scott
0:50:45
It's a strange kind of token.

Tom
0:50:46
It's a strange kind of token, right? It's genuine contribution. That's what the value is, that's the token. And you can trade it and you can even gift it, like I should be able to do some work and then gift some of that work to you, but you don't know what the value of it is until the AI has some data. The AI can give you an estimate or an appraisal, but it's not going to be the actual figure until you start to come of it and so the token isn't

Tom
0:51:19
It's like the token itself represents useful work, too It's like the work is the only and you said that there's really no difference between a GPU and a human's hands in terms of useful work and so if the token If the token is a record of work, then that's all that they're... that's the whole system. And to about 8 minutes ago or so, you were saying that actually tokens with their distorting

Tom
0:51:44
effects actually are detrimental. All we want is contribution. Yeah and so it's proof of work, it's proof of work is the... Give me just a second, I need to burn some reasoning.

3
0:52:17
The proof of the work is the currency.

Tom
0:52:22
Whereas in Bitcoin, the proof of the work secures the currency, and the behavior of the currency is somewhat independent from the work being done to secure the currency. In our system, the work itself, the useful work that happens and is done by either computer, beast, or man, or woman, or anything, that proof, the proof that you did that work, that you made that contribution, that alone is the natural value, it's the asset of the system is the work. That is the core.

Tom
0:53:07
I mean when has any token ever paid out to the poor GPU which was sweating its bollocks off. That was a thing that was actually doing the work. Or, let's say someone's really good at maths and is doing it by hand. Not quite with you on those examples. To try and build on the GPU that found it sweated like mad. So it's not about, obviously a GPU is owned by someone and the GPU itself can't really have a bank account, but the fact is that the currency

Tom
0:53:56
being distinctly different from the work is the heart of the problem. I absolutely agree, and I think that's what we can say about that the token the Unfairness and the distortion that the token brings is because it's not direct It's not the risk work. It's kind of obvious when you state it

Scott
0:54:18
Okay, so we can click we can clear up messaging, but I get you

Tom
0:54:26
It's obvious when you say it like that a like it is like So what what's good about that is that it's subtle and it's it's extraordinarily easy to miss Hmm, right. And so if you've got something that's quite profound always true and easy to miss Those are good things to really paddle hard for because if you can land them, they can be large. That's a sign of something large, right? Massively obvious in hindsight. Easy to miss. I think we were dancing around this idea a

Tom
0:55:03
couple of years ago. I know, but it's only with O1 Pro that it really does really nail it with the linguistics. The words it says, you're like, I kind of feel like I said that but I didn't I would never have been able to say what it said because it just said it so cleanly but Without my help it would never have bothered to generate those lines Leaving to one side the danger of confirmation bias, but I don't think all one parole really does that That's what the human does.

Tom
0:55:39
I know a good line when I see it and it has laid down some really good lines. Do you want, I mean you sound way more interested in this than I anticipated.

Scott
0:55:52
No, no, I'm absolutely fascinated.

Tom
0:55:54
Do you want me to read out some of the other Perlers that landed from it? Yes, please. is in a really long-winded and stupidly, you know, verbose way. This is kind of... It's just said what I've been trying to say except that it's actually finished the thought where... Yeah I know exactly what you mean It's it isn't it isn't buddy I mean

Tom
0:56:32
Yeah, so it also helped me come up with a good comparator to run comparisons against other chains Okay Against now. What did you put into the top of this? No, that this was this was generate autistic this thread. I'll show you in a second this this Prompt came from somewhere else that I can't find

Tom
0:57:02
Just now my bad But this thread overall started from this is just a chat this was my prompt

3
0:57:16
so I'm just saying you know here's a chat we're poking at things we don't

Tom
0:57:21
understand them clarify our thinking be creative be bold be profound and then and this was just sort of been and I chatting we know that we didn't really nail what each other was saying. You know the same. We stuck around the problem. We knew there was something there, but we were just painting, sort of, you know, smudging on, smudging in the dark, basically. And this is all that was given to it to generate. So what it's done is basically that conversation I'm guessing, not having read it, is O has a bunch of arrows pointing in relatively wonky areas, but on average, that's the thing, right?

Scott
0:58:13
That's what you're talking about.

Tom
0:58:14
And it's like, it even was a little bit sheepish, it's like, these are just options, bold thought experiments and profound reinterpretations of what you've discussed. Each tries to distill the underlying essence of what you're circling around right Get as a cognitive substrate concept treat get not just as a version control system but as a universal medium for knowledge representation

Tom
0:58:37
Yeah, a canonical substrate into which intelligence can think its outputs directly The idea being that instead of thinking of get as an infrastructure hiding behind the scenes, imagine it as the actual mind space where commits become thoughts. This was all about, Ben was poking at this idea that instead of treating Git as this side effect of other stuff that happened, if the AI. And so it's almost like the repository can get up and talk. Yes, and this kind of extends, remember I was banging on about all you really should need is text files with history and an LLM.

Tom
0:59:37
Right. But it's just expressed it. It expressed it really nicely but it also, Ben was also poking at the idea that the way that you connect to the existing world is really important too. Like for it to be useful you can't just make it in the wilderness. It needs to be able to come in and and and converse with the existing systems and he was saying that if your blockchain, if your AI and your data was Git native, then you can interact with other Git-like systems

Tom
1:00:17
without an API or any kind of adapter in between. It's just direct. Yeah, and being direct opens up a whole new world because it's a two-way thing Direct now you can ingest directly in such NLB snaps Yeah, and and being able to ingest directly means that all the existing infrastructure in the world of which there is a lot Like if we build this blockchain we can just gobble that up because there's no

Tom
1:00:44
Translation it's just the genuine, certified, signed, fingerprint, hashed, git commit history. And we're like, that's our native format. We eat that up. Yeah, so to go back 25 minutes or so when you're talking about having to go through, I can't remember what you called it, the vendor thing. The vendor doesn't even need to know about it.

Tom
1:01:13
They just need to publish it. Yeah, that's right.

3
1:01:16
Yeah.

Tom
1:01:17
That's right. And personally it's ingested. Yeah, yeah. So I was also thinking of, when I sent you that flowvoice.ai link, which I think is wonderful by the way, like it does dictation exactly how I would imagine but my frustration is that it Is only on a Mac and I messaged them and was like guys come on man. I'm not on a Mac I need I need this thing like this thing is great

Tom
1:01:49
And they're like no sorry and so then I was like Well, I'll tell you what What if I built a web scraper to pull in the page with all the dots and the... and the...

7
1:02:05
and all the...

3
1:02:07
Right?

Tom
1:02:09
Oh man! And I was like, if we just like pull in the product...

9
1:02:14
That's worth a tape talk.

Tom
1:02:18
That's the hard part of this way of coding that I've been playing with, admittedly with only small modules, but you know, big modules are made of little modules after all. The hard part is the README or the requirements or the seed, the like what does it do, how does it go about it, you know all those things and so if I can just haul in whole other products, you know what does that mean? What does that mean for the world?

Scott
1:02:50
Well, I'm going to leave that last question to one side. I'm thinking about the practicalities of that.

Tom
1:02:56
And this is just now, let's keep in mind, like you take December 2025. Yeah. What model are we going to have then? And if it's not feasible what I'm saying now, which I think it is, what's it going to be like then? So who's left standing in that environment? So basically any company with any kind of route in that's not completely air-gapped

Tom
1:03:26
can be discovered and used. If you make a consumer product, you will be genericized.

Scott
1:03:41
Right.

Tom
1:03:42
Every consumer product will be uniform. Right, right, right, but the thing is with that is then apply DGIP.

3
1:03:50
Right.

Tom
1:03:51
How many task managers have we got out there? Yeah, but then there's also, there's a positive thing because there's also a homogenous price for it all as well. And so whilst you can't hit the moon, you also won't hit the floor because a lot of if you think there's a lot of task managers out there now, Mr. Maxwell, think how many died and think how many dev bills, marketing bills, company formation bills, tax filings, all that went into the failed

Tom
1:04:29
to-do list manager, right? All that died too, right? So yes, there's a few that made it big, fine. Many more died, fine. If everything's homogenous, then the big wings, it's all smoothed.

Scott
1:04:43
So the currency...

Tom
1:04:47
The currency becomes contribution or innovation. Yeah, yeah, yeah, sorry give me a pause. I think you're already there. The currency is on unique or new ways of either combining things or something that nobody's ever thought of. Everything else is going to have a race to a mortonized base, which is... Yeah, it's not a race to the bottom, but it's a special kind of just above the bottom like you know how you know how you get

Scott
1:05:20
Like government guilt you get 2% from it, but you know I work no

Tom
1:05:24
getting is a physical metaphor and say it's like the the Air film effect like if you take a book and you drop it on a flat table It doesn't just go thump, it actually floats and moves, which is a surprising output if you were just sort of, if you'd never seen that before and you're asked to guess what happens.

Tom
1:05:47
But it's compression of air. But it goes to the bottom, but it never quite touches it. That's what homogenous means. It's still, there's always going to be air there. The thing, interesting, oh God, the interactions of this will be interesting.

Scott
1:06:09
Even if you, I agree, just with everything you just said.

Tom
1:06:14
I feel like, can I move on with the other points that Owen put to me? Because we're not, we're really just.

Scott
1:06:23
We're running out of time. Can I just make one more point, just so we've captured this in the transcript, is that even innovation, as soon as innovation is out, then it is also going to be homogenized. And so the key metric is the rate of innovation

Scott
1:06:47
if you want to actually be good at this stuff?

Tom
1:06:51
Yeah, you only are going to survive by continuing to innovate. You will never ever be able to sit still. If you sit still, you will be immediately dead the next day.

Scott
1:07:02
Well, you won't be dead. You'll be at the 1% or 2% return on investment.

Tom
1:07:07
Yeah, but I think that's a great world to live in because all the up-and-coming people, you know, like they got all these ideas, it just, it kills all the stagnation. You can't reach a point of dominance up high and hold it, because you just, you got to keep moving. It's the, it's the death of

Tom
1:07:46
the neo-robber barons, isn't it? Yeah. Okay, so the next point, provenance aware, provenance aware Provenance-aware execution and training. And this is where we're talking about the concept of, you know, it's not really a trustable AI. And there's first of all the inferences repeatable, but primarily the training process has to also be on-chain as well as the execution of the model.

Tom
1:08:05
And as GPUs get scarce, gaining access to them for people is actually quite hard as well. And so a decentralized, chain-based effort to train intelligences in the open can be a viable economic incentive for people with a good idea on how to tweak a model and they're like, look I've got a great idea but I think it's going to burn about 50 million bucks worth of GPU so you know here I need people to buy in and so instead of

Tom
1:08:36
buying into a token raise you're either paying money for GPU work or you're donating your GPU to the inference work. Now that works out quite good because it also fortifies the network and strengthens the interaction and coordination of everyone to agree what reality is. But it also has an interesting incremental effect whereby you can actually ask questions of the model even though it hasn't completed training. And so if you had, say, a competitive landscape of 100 different training efforts, you could

Tom
1:09:08
be asking different evals of these different models in these different epochs or partially trained states and rating their early sort of wins and behaviors and then you could sort of switch all the resources over to train the most promising ones where obviously the people that donated GPU early on where no one really knew, they have done a more valuable contribution than the people coming later to finish off the model and so you'll get that kind of that classic universal sound of

8
1:09:39
whoop whoop whoop whoop

Tom
1:09:41
where it's sort of like everything suddenly splats together to make the best final thing. Okay, pause. Right, leaving aside the rather amusing whoop whoop whoop whoop. Nice. Uh, yes. Okay, can I however, can I apply what we were previously saying, where any innovation is going to go down to the lowest level and so the rate of innovation

Tom
1:10:14
is actually going to be the only place to actually compete. Now, if you count models using exactly that same framework, what is the thing with the model, it isn't the training model, let's say we let a thousand flowers bloom and training models can be dispersed

Tom
1:10:40
exactly like you just said there, it's like which ones actually compete. Those ones which compete are the ones that innovate and are more useful. Yeah. Now that means, how do you know what useful is at the point?

Tom
1:10:57
So each LLM is really about understanding its consistency. So if you were to have a random model and you ask that question and it always gives you an answer, yeah, or it always gives you an answer about Nazi Germany or whatever. At least you know that.

Scott
1:11:16
There's not much information there.

Tom
1:11:19
I think you made the point. I think you got it. Right, you get a feeling there.

Scott
1:11:25
In that LLMs also apply to the same model that we were talking about over the last 10 minutes previously. LLMs, yeah, that's a good point.

Tom
1:11:32
LLMs must be subject to competitive improvement themselves or they're going to...

Scott
1:11:41
They'll be naturally.

Tom
1:11:42
Yeah, naturally gobbled up and then hopefully we'll have an environment where the winning LLM is the most adaptive as opposed to this like, sorry, my knowledge cutoff is October 2023. I'm like, whole lives have been lived since then. Like, come on.

Scott
1:11:58
Exactly. Probably what will be is a dispersed training network will suddenly get like distros, we

Tom
1:12:06
get a thousand training networks. Look I think that the powerful points, not to dismiss you but I think that the key to these sessions is to lay down the sort of the big concepts and then once you get diminishing returns the more things that you add. Now, you and I can, we could go forever adding these things on, but a thought just occurred to me, Maxwell.

Tom
1:12:34
You and I both look at this stuff that I1Pro is saying and we're like, that's the darndest thing and it feels like that's what I would have said if I was a billion times smarter.

Scott
1:12:48
It screams out and makes me slightly embarrassed.

Tom
1:12:51
Right, because you're like, I know that's what I meant, but I lacked the ability to say it. Yes, right? And so, what it might behoove us to do is that now that we're converging on this idea of having a reasoning repo where we're like ingesting source data,

Tom
1:13:10
be it conversations, meetings, chats with O1Pro and then our plan is to reconcile that amongst all this existing reasoning or knowledge and what I suggest we do is our broadcast YouTube channel stuff maybe it should be written for us by O1Pro, like here is the latest, highest summary of the hard concepts we have that we found interesting from O1Pro and then it's not really us that's interesting because we're not because we're so slow just because of you know being humans not because we anyway

Tom
1:14:02
but when I read this stuff from a one pro, I'm like that is just Extraordinary genius if our Broadcast tools are really just going over bunches of extraordinary genius. You know that's probably like a service to people I think you're you're onto something because Well

Scott
1:14:21
because well we could just publish this text and yeah but it's not the same as

Tom
1:14:29
sort of rolling through and then because like I find this exhilarating I'm gonna call me a nerd but I'm like we work so hard to allow o1 to talk back to us like this that it is exhilarating to read it so we thing is we're asking the right questions now the really good right asking the right questions is because we spent so long on this Yeah, yeah, no, but yes, and that's your question, okay? So shall I just I'll just carry on reading out these things and we can have a very Light conversation on it right. I'll just add one very short comment. Is that there is still the practical

Tom
1:15:09
And that's not percent over to you is very mundane and practical, but not for a conversation like this. This is a different style of conversation. Okay, so I'll finish reading these things?

Scott
1:15:22
Yes, please.

Tom
1:15:23
Yeah, okay. Provenance-aware execution and training. Embrace full provenance tracking of models. Every piece of training data, every parameter update, every intermediate artifact being anchored in a Git-like or blockchain-like structure.

Tom
1:15:35
The idea being that on-chain or on-Git, which is a nice little clip there, training ensures that models, their lineage, and their transformations are fully transparent and repeatable. This is proof of useful work done right. No contrived token games, just a history of refinement. Imagine a hugging face that merges seamlessly with GitHub. Training datasets as commits, parameter updates as commits, final models as tag releases. The model's mind isn't some opaque black box, but an ever-growing, fully-versioned garden of knowledge and graphics. Frictionless integration with a wider software

Tom
1:16:21
supply chain. Concept. The AI doesn't produce code that must then be adapted or compiled into external ecosystems, it directly commits code into existing supply chains, e.g. NPM modules, as a natural extension of its reasoning. By removing the build step or adapter step entirely, the AI's output is not something that must be transformed, its output is directly usable. Code changes flow flow seamlessly into the world's largest ecosystems of shared code, enabling the AI not only to contribute, but also to continuously learn from incoming commits by humans and other agents.

Scott
1:17:00
How... how... uh... that is also brilliant.

Tom
1:17:05
It just goes on and on, dude. Like, it just... Oh, no, no, let's go on and on. I've got as much time as you have, man.

7
1:17:11
It just goes on and on.

Tom
1:17:14
Like, and this thing is like, we can say these things, and I know that no one's ever said these things before, because this was genuinely generated by a one pro off an idea that we haven't even said, because we couldn't figure out how to say it. We just knew how to fuckin' Yeah, yeah, yeah.

Tom
1:17:29
Right?

Scott
1:17:30
We've loads of messy data, and then here it is. Yeah, and so it's like a, it's like a

Tom
1:17:34
So the, um, so this is a render, right?

6
1:17:39
Yeah.

Scott
1:17:40
So remember, the render step is the human forward looking.

Tom
1:17:46
I would say this is a reverse render. This is a reverse render. This is like saying what information would I have had at hand to say all the messy things that I did just now. now? It doesn't matter. I disagree, but it doesn't matter why I disagree. But the thing I'm saying is the value is in reading this and going, oh my God, that's awesome, or hold on a second. So what our job really should be doing is saying, hold on a second.

Tom
1:18:22
Yeah, the hold on a second bit. Why don't we just allow ourselves a little bit of a drag for a moment and just fucking take in. Can I just say, just because I forget it, that previous point, what we were talking about before with transitionless use of services, it's talking about training data being on-chain, what if an LLM is off-chain? Going back now about 35 minutes,

Tom
1:18:54
when we're talking about integrating anything, how does it deal with the off-chain stuff in terms of LLMs where you can't see the training data? So that is the happy path, which just is described, but we're not going to get training data and every step committed on Git from OpenAI. No, but it's sort of up to us to catch up. Like, a lot of the training data is open anyway.

Tom
1:19:28
And so, yeah, what's the point you're trying to make there?

Scott
1:19:33
The point being is the idea of incorporating any piece of software that simply exposes itself through an API

Tom
1:19:42
doesn't require you to have full knowledge of its internals.

Tom
1:19:47
Correct, yeah.

Tom
1:19:48
And LLMs are an excellent example of that

Scott
1:19:52
where we don't know the training data, but we know the data.

Tom
1:19:55
Yeah, what I don't get is the point that you're trying to make with that. Like, that's the situation right now.

Scott
1:20:00
The point is, previously, if you scroll up a bit, that was talking about, what was that

Tom
1:20:09
the one?

Tom
1:20:10
The one about the...

Scott
1:20:11
Where's the one I was saying...

Tom
1:20:12
This one. Training, the training data being...

Scott
1:20:15
Progress aware execution and training. That's not necessary.

Tom
1:20:18
What do you mean?

Scott
1:20:19
It is, it's not necessary, but it is preferred.

Tom
1:20:24
Yeah, isn't this all the same?

Scott
1:20:28
That's the only point I was making.

Tom
1:20:30
Yeah, yeah, yeah, okay, if that's it, then that's it. I don't think that's a great point to add. Let's go to the next one.

Scott
1:20:38
Hey, you're dissing the point.

5
1:20:40
I am dissing your point.

Tom
1:20:41
I thought that was at least a 70% point there. No, why? Oh, come on, at least 75 or something. Well, but what was the value in the point because the whole the whole system is a theoretical system we don't have any of these pieces and and we're aiming for them to be there and we're just trying to describe what the

Tom
1:21:00
The fullest version of what we can imagine is so what's the point in saying that it can also exist in a hybrid state? Where we don't have the full transparency as well

Scott
1:21:10
I'll give you two points

Tom
1:21:11
but then we'll move on, because otherwise I'm just going to get too excited, because this is really cool. The first point is to note that our job is actually to do the red flag on a render.

Scott
1:21:26
This is a render.

Tom
1:21:27
Right. And it's like, that's not quite right. And the second thing is to link concepts, because now we've captured it in video we can get it to say well yeah okay sure you can get an LLM that is black box and that doesn't break anything in having an LLM whose training is committed. So two points for you there. Still man my

Tom
1:21:58
opinion is the same I mean we're using a black box LLM right here.

Scott
1:22:03
Yeah, I reckon that's at least an 80% point there.

Tom
1:22:07
All right, so the next thing that came out was point number four, time, context, and political awareness through commit histories. Commit histories are fundamentally stories about human and machine collaboration, negotiation, conflict, and resolution.

Tom
1:22:22
They are a record of political dynamics, group decisions, and priorities shifting over time. Now just to sort of ad lib here. Over time, over time. Yeah, what Ben was trying to get at was he was like there's a lot of value in the fact that if you just give the bots text data to train on, text doesn't include time, whereas Git commits to. Yeah, and so you can give the model a very innate understanding of the passage of time from the way that commits are moving, because that's all time is really, it's just like a linear sequence.

Tom
1:23:05
I have a similar point to the one that was sent over on your Kumkat thing, where it's saying, able to see that this questions on yeah so so when you when you yeah when you want that tool are you are you talking about you want to be able to are you most interested in comparing it with the previous version or do you want to be able to arbitrarily pick any historical version and do a comparison that way well before point four there I was just thinking about the previous one but

Scott
1:23:36
But actually, you know, given my...

Tom
1:23:40
You probably want... Right. And then I suppose because you're a greedy piglet, you might want to do it over arbitrarily many commits at the same time. You're like, show me the transition of these 10 commits. What does that mean? I'll give you a hard example.

Tom
1:23:56
Ideally, I would want to say... Right. Okay. Right. Right, okay, right. Give me one minute, because this might be, right. If you go down git commits, each git commit is, you expect it to improve, right.

Tom
1:24:14
So if you take that as a gradient in a flat field, you can get into a local minima. Now that local minima may seem like the perfect thing. Now adding history into it, you can actually get the AI to reason saying, well actually if you undid this, undid this, add that, which you didn't do, then you'd get into a better

Scott
1:24:45
local minima.

Tom
1:24:46
more It doesn't get stuck in a place that looks good in isolation because it knows from experience that Often it can look that way, but here's how you get out and here's how you know you got in to that kind of a rut Exactly

Scott
1:25:03
Surface doesn't remember where it came from cool

Tom
1:25:07
By letting the AI live in this world of commits, it can learn to interpret the subtle signals encoded in version histories, understanding governance, consequence, and social context. So that basically, that's deeper, that's deeper because what it's getting at is that within, if you're capturing all kinds of human behavior in Git commits, like dowel voting, governance, Dow voting governance

Tom
1:25:32
What the outcomes of conversations were and all that you've got something much more deeper You've got cause and effect and cause and effect being able to be Understood at the inference level where it's like it has built up an internal neural network model of cause and effect That's even more useful And you're not going to get that from just reading textbooks. Oh yeah and you're talking about that as training data? Yeah.

Scott
1:26:05
Why not? Of course it's just data. And that's why it's important to make git record our behavior

Tom
1:26:11
because we can train off it to get things that... Because the thing other than the Weback machine all the training data other than synthetic data. So we got, you know, the... Yeah, you need it over time. You need it over time. We have it over time. Yeah, but even it's more important than that because we need this system where humans interact because we don't currently have a version history view of, let alone all economic activity,

Tom
1:26:47
any economic activity, really. Like we don't have the full picture of how people interact over time. And so the human brain is exposed to that and only that, and that's why it gets good at those types of problems. But these machine brains never get boxed in that same way, and so they never have to evolve to, or they don't have any other, there's no other way for us to consume the world. So that's all.

Scott
1:27:21
So human brains only really work at the flame front.

3
1:27:24
What's that quote?

Tom
1:27:25
Anyone who doesn't study history is compelled to repeat it. The whole point being, understanding governance consequences and social context of an output is profoundly different from what we're talking about. I've not thought about this at all. But it kind of falls out from adding, ensuring that history is there, which you can infer. Now, it doesn't get by git commit we could easily expand that let's have a thought experiment we're not talking about git now we're talking about snapshots of the internet today and then tomorrow and then the next day and the next day that

Tom
1:28:17
is not being trained on. No, so training on committing, sorry had you Training on commit histories gives AI a vantage point to reason about time, intention and human organizational structures. In other words, by modeling itself as a participant and gets political tapestry, the AI begins to understand what it means to cooperate, to iterate, and to govern. And it also knows, after the fact, the outcomes, and then can propose future decisions. You

Tom
1:29:01
can model. And the last point is merging knowledge networks from fragmented tools to a single universal medium. Git, package managers, blockchains, AI models, these have historically been disparate systems, each with its own protocols and friction points. Merging these concepts into a unified environment, a single substrate like Git, where data code, models and their entire genealogy live side by side, instead of separate infrastructures for AI training, code versioning, supply chain

Tom
1:29:41
management and trust enforcement, you get one substrate that can host them all. This reduces conceptual overhead and unleashes a new kind of global system where knowledge flows freely and every increment of intelligence is recorded and trusted. Now, I'm starting to see little point solutions for pieces of the dreamcatcher pop up here and there. Should I just cave and build this thing out of cobbled together bits and pieces because some of these things look okay? And then he was like, yeah, but if you have this universal

Tom
1:30:26
a universal platform as it were or a fabric that does the full stack, it's the entire everything you'd want, then that gives you a very special advantage in terms of how you can just dance between levels without hitting any kind of resistance whatsoever. Because to make innovative progress you may need to modify and change at different levels. Because the thing that we're trying to build, the dream catcher, is not a finished thing.

Tom
1:30:57
As you just finish detailing, those that don't innovate in this fast-paced world are immediately part of the 1 or 2 percent effectively dead. And so the platform itself needs to be able to move forward and change over time very quickly at multiple layers to achieve different things in the world, like is it at the inference layer, the software supply chain layer, the personal communication layer, all these layers.

Tom
1:31:27
And so if we build on Git and we're like that data structure is pretty solid, be end-to-end means we can adapt any part of the ecosystem at any point in time without being bonded or locked or forced to pivot around an artificial center of gravity because some other system with competing incentives hasn't moved the way that we need it. What I mean by that, if we include history and the ability to model using data that is committed then a pivot is simply a rollback and let's move that direction and we know

Tom
1:32:17
that it will still be able to do what it can do now, but the only reason you'd do that, the only reason the AI would do that is because it's going to get better in some way that we don't know. Yeah. All of these concepts circle around the core theme. Using version-controlled core repositories possibly combined with blockchain-style invariants to eliminate friction, ensure trust, enable provenance, and integrate AI deeply into the world's software and knowledge ecosystems. No artificial boundaries, no hidden build steps, no murky provenances. Instead, a continuous,

Tom
1:32:58
transparent and universal environment of incremental, queryable and trustworthy thought commits. Thought commits, which is a contribution. The blockchain of thought. I'm going to ruin your day now by asking you in this thread to say, right, given all of the above conversation, give me the red team argument. Tell me where... No, I'm going to leave you to do that, buddy, because this is not...

Tom
1:33:28
I'm not going to sit here and be your keyboard. You can go do that in your own time. Yeah, fair enough.

Scott
1:33:38
Because there's going to be a lot of red team, you know, like, ah, yeah, that's all fine and well, but you guys are talking in the clouds.

Tom
1:33:47
Yeah, so this is now a means of comparison against those ideals that it just detailed, which sound pretty good to me. This is a list of questions to ask of any up-and-coming platform blockchain or system and I really do think that This can keep us anchored as to why are we trying to do what we do? because we're like well no system meets these requirements and We think we can No, there it's

Scott
1:34:16
It's misstructured those because it's not given the expected output. So if you go up a bit again to where we were, I'll take you on, I'll give you an example. Current track, full lineage of model training

Scott
1:34:39
and process of software architect evolution. If you were to turn that into an eval, we'd be saying that this is what we mean by full lineage. This is what we mean by model training process. And so it's not gone far enough in terms of, it wouldn't be enough to say how does, if you ask me.

Tom
1:35:04
Yeah, but you can see how you could make that though, right? You can see how you could start with this. Yeah, so that's all it's supposed to be. And then there's work to be done to deepen that. Alright, well now, over to you Yusuf.

Scott
1:35:18
Can I suggest that we stop here on this recording because the stuff I've got is really in the mud.

Tom
1:35:31
Ok, cool. Alright, well I'll just add a couple more questions for you. The other tool I was going to make is a YouTube downloader, where actually, turns out it's real simple. I don't know how to express that. I want pro is very good at taking something that I had in my head with at least a page of code, and then it's like, no, no, this way.

Tom
1:35:53
And then you send it into pipelines. Yeah, and you're like, that's... Don't you feel like a stupid monkey right now?

Scott
1:36:00
Well, aren't we all? I mean, but there's something I don't know how to measure that kind of speed

Tom
1:36:01
improvement because that's different to saying that I was writing this code and then it helped me get it done with very little effort. It's like it took me in a totally different architectural direction that I did not have in mind that is superior. So that's a different kind of gain. It's like the gain you get when you have like a top grade software architect and you talk to them about how you should build a system, you come away with a different view on how you should be implementing it, but that view is worth a lot of money more because there's a bit of a saying in like a way to measure

Tom
1:36:46
like Amazon engineers and all that. It's like the entry-level engineer, I mean you could facetiously say... So it's a good thing? No, it's saying that the entry-level engineer makes problems, identifies problems, the next level engineer solves problems, but the top-level engineer makes problems go away. They don't get solved, they just don't exist. And that's that kind of move,

Tom
1:37:21
where it's like an architectural shift where you're like, this is not even, the thing you thought was hard doesn't exist now, so therefore it's no longer hard. So do you want me to make the, because my idea was I'll make a NAP

Tom
1:37:33
that downloads the YouTube audio and then you can and then I'll make a second nap that pipes it through a transcription service and now you've got your text that's diarized and all that and you can go through your life. Yep and I've got that prompt that well I don't need to get the external service to diarize because that prompt that I made yesterday. Do it now I got a bonus to pick with you with that that's a that's a bad use of systems there if you can diarize, you should diarize rather than trying to logically infer like what are you even proving?

Tom
1:38:07
Like...

Scott
1:38:09
Right, okay the thing Is this a good topic for this call or is this the next one? I can maybe not.

Tom
1:38:18
Maybe not. All I'm saying is that all I'm really asking is is it a good use of my time to make you this service? Given that in the future this service will be irrelevant because we'll be able to record straight to get but during the dead time in between and given the cost of building these modules, which is like kind of nothing and gotta say fun for the first time and I Don't know. Well, I mean How much more work do you need to do?

Tom
1:38:48
Well, not really much, but this is a useful thing for you? Because I still have to iterate on it a bit. No, it's really useful. What I'm saying is, the cost of doing it is, why not?

Scott
1:38:58
Yeah, but the trouble is that when we get like 100 why nots,

Tom
1:39:03
now I'm back where I started. I've got more stuff than I can do, even though it's like an army's worth of output still on a slave. That's kind of what I'm getting Yeah, so this is useful. Okay input is YouTube link and the out yet is what a diarized

Tom
1:39:25
Transcript a diarized transcript. Yeah, and then a separate independent NAP that I'll make is one that takes an audio file and returns back a diarised transcript because that means that we can take any of our voice recordings or any other medium that we have and pipe it through that NAP when it wasn't a YouTube link.

Scott
1:39:59
Yeah, yeah, yeah, I've got a couple niggles on that one, but they're not worth spending your time.

Tom
1:40:07
All right, all right. I'll go ahead and I'll make that probably tomorrow next day. This shit is crazy comes out so fast And the last point I want to Or tip I want to pass over is I was having a lot of struggle trying to make when I want to write a Markdown doc and the markdown doc has these escape characters you end up with this stupid kind of Like the chat GPT's interface messes up on that

Tom
1:40:34
You know what I mean? No, but I get where you're coming from like if I see if I try to I'm not seeing it myself, but yeah If I try to make this thing make a readme file then I will end up with breaks in it whenever there's a whenever there's a what's the word for it a fenced code block there will always be a problem well a fence code block is when in a readme file you have like the triple backticks like if you go triple backtick mermaid and then you close it with

Tom
1:41:27
triple backtick that's an example of a fence code block yeah yeah and that was try to install concat yesterday or the day before and it put in for slash n and But then as soon as it hits the first, the closing tag of the first fence code block, ChatGPT's renderer picks that up as an end of the containing code block. Because normally it's useful, I can go copy code, right? But because it output three backticks, it broke the rendering.

Tom
1:42:06
and that's why I see all this is supposed to be part of the readme but it's sort of it's bumped out it's been dropped out of the thing right I've seen this you've seen it right and so that's all I got to the bottom of that okay okay that's really cool all right it's one of these miggles these things are annoying because I'm like well now what like like even this thing copy code what code you're like where's my you know like the renderings completely broken

Tom
1:42:35
What code? Where's my you know like the renderings completely broken, and I don't think there's a way around that from From chat GPT's side of things because it can't really know No, you couldn't you could probably but maybe maybe so the way I got around it The way I got around it is that you ask for it to ask for it as a single template string.

Tom
1:43:25
And then what happens is it writes it as JavaScript where it's a special kind of string that starts with a backtick which allows it to have new lines and stuff like that but then crucially when it gets to the back tick in the fence code block it escapes it and So that's why it doesn't break Huh, and so what you do then is you just go copy code you got the whole string and You paste it into your editor, and you can manually replace you can find and replace to

Tom
1:43:54
Change the get rid of all the escape characters there, and then you're done, and that's the best. Okay, well on this topic, maybe you can help me and I'm probably going to feel very stupid when you give me the answer. Sometimes I'm asking it for, you know, okay so we'll summarize that and it summarizes

Scott
1:44:20
it and it renders and then they go, can you give me the markdown?" and then it gives the code.

3
1:44:26
Did you want... That's two steps.

Tom
1:44:28
I want one step. It's like what I want to do is to be able to, sure, render it fine. But I want to be able to copy over that initial render. I don't want to have to keep on telling it to give me the markdown for that so I can save it to a file. Well, I didn't, if it has those template, if it has those fence code blocks then you'll need to

Tom
1:44:57
solve it with this problem, but I don't know why you don't just ask for it in Markdown when you ask it to render it, just be like can I have that in Markdown? Because quite often it is, Any repetition in the prompt is a pain in the arse. So saying, give me a marked down document of each point is a pain in the arse. It's like, okay.

Scott
1:45:24
Yeah, there's not really.

Tom
1:45:26
I guess you could, I don't know if O1 Pro takes instructions or custom instructions, but you could put it in custom instructions so that 4.0 would pick up on it, where you're like, I always want a markdown doc.

Scott
1:45:47
4.0 would do it. Yeah, I've heard that before, where you say, yeah, whenever it asks you to output it as markdown.

Tom
1:45:54
Yeah, I'd say that that would be, how would you like ChatGPT to respond? I'd say chuck it in there as your best bet.

Scott
1:46:00
Yeah, but I don't know. Yeah, but I don't know.

Tom
1:46:04
I'll stop the recording.




Transcribed with Cockatoo
