Scott
0:00:00
Just a bit of depression. Right, so last time I was looking for is, and this is quite low priority because we'll just work up the kinks, but I made a number of changes or additions rather. Adding inventors notebook, adding raw place for transcripts, place for raw data where it's like I don't know what to do with this yet but I want to keep it.

Scott
0:00:29
And personal raw notes and then reports. We don't need to go through that because you can see it, but we can. But yesterday, given the transcript, I went through a process to bootstrap herself up and start chipping away about what's the...

Tom
0:00:53
All right, so have you committed anything on that topic? Yeah, I've committed it all. Committed it all, okay, and it was all the stuff that happened since...

Scott
0:01:05
Since we last talked.

Tom
0:01:08
Since we last talked, okay.

Scott
0:01:09
Yeah.

Tom
0:01:10
Okay, so that...

Scott
0:01:12
Including, and at the very end of the talk, don't let me forget this, because there's an interesting analogy here that could be quite useful between, you asked a question about what use of NAPs, and I had a very rough and ready conversation with an AI,

Scott
0:01:30
and it turned out to have a fair similarity to CubeSats, weirdly, which I've not made a connection with.

Tom
0:01:41
Okay, now listen, so the things that you committed in the last day are what we should be comparing against, so that would be... It might be easier if I share my cursor screen because you get the chat as well. Okay, all right, so this is a way that I can compare a bunch of commits all together. So that's why I was interested in this. Well you do that and you'll see what I've touched.

11
0:02:27
Okay, hang on a minute.

Scott
0:02:30
Because you're right, it's looking at the commits is like looking at the end product

Tom
0:02:41
and it's like, why did you do that? Yeah, yeah, and it's also like a lot of it doesn't matter too, like it's sort of the finished thing is sort of what matters for some stuff and Then yeah, it's I don't know we'll figure out a way, but okay, so these are all the commits that happen in the last Day, this is the these are the changes that we want to be talking about is that right?

Tom
0:03:06
Yep How far does that go back because we've got strange dates times on the going on but yes that looks about right ah Christ almighty that's yeah there's the CubeSat note that wasn't the last one that's a good point you make that's 30 times a why are we so far away CubeSat task update I'm freezing my bollocks, sorry, no no no actually bollocks is a reasonable word that's not a bad word Is it though, is it in a discussion about such dignified subjects as eternal hashing blockchains and artificial intelligence and we've got this guy talking about his bollocks No no no no, I don't know, do you know the definition of bollocks?

Tom
0:03:59
I get the feeling you're about to share it with me.

Scott
0:04:02
Oh, you can tell it's in the air, isn't it? This is a legal ruling on this. Remember the Sex Pistols? Never mind the bollocks. And I don't. It was. You don't?

8
0:04:12
No.

Scott
0:04:13
Okay. Sex Pistols has an album name, which I'll not repeat again, just in case you don't know. I went to the High Court and they're saying this is not a rude name because it was counted as obscene, you can't have an album name that's obscene and they got an entomologist guy who's skilled in the art of English to say what Box is. Box is actually the description of a roughly 13th to 17th century priest who would stand up and just talk complete nonsense. That is officially, well in the UK, according to the High Court, the definition of bollocks. So it's not obscene.

Tom
0:05:05
I think the fact that you had to explain it says that there are still some issues adjacent to the use of that word. Okay, now, hit me, what are we doing?

Scott
0:05:23
Okay, so, you're going to look through this and I've got…

Tom
0:05:28
Yeah, so, I think that it's, you can correct me if you feel it's unfair, but when I look at this I'm like, I don't really know what's happening just by looking at the diffs. I sort of know, but what I don't see is the reasons. And so I think it's a good, a fair request to say, you know, if you're proposing changes, can you walk me through it? Because you know why you changed them.

Scott
0:05:53
Right, and that's the case I'm going to take over. This will be an interesting test because this actually answers my question about how we work in this shared environment. Yeah. Yeah. Oh, this is what I'm excited about. I'm terrified, but I'm also excited

Tom
0:06:07
So there's a word for that. I'm hoping this is my full chain I can take you through the process of getting there I can you just tell me because I really don't want to be reading that no. No, no, I'm not reading it I'm this is for my benefit. I will summarize each step. What are you, like the Matrix just loading up on these things here? Uh, oh yeah, hey, so there's no, I couldn't find any, um, long context has been removed

Tom
0:06:36
as a beta feature and people are crying about it.

Scott
0:06:41
I know, it's, um, I'm suffering as well because I'm having to switch, uh, threads because it just loses it.

Tom
0:06:49
Yeah, but I sent you a link that had the previous version in it, so you can download the previous version and you will have long context there. I can go back. Okay, that's good, I'll do that after this.

Scott
0:07:00
Do you even read my messages?

Tom
0:07:03
Well, I kind of skim them, but you never explain them, so.

Scott
0:07:06
I'm sorry, I'm pulling your chin out on that one. Yes, I do read your messages, but I don't necessarily implement your messages if I'm in the middle of a thing. A thing, like you're taking a dump and you're reading my message and you just forget

Tom
0:07:23
that I told you how to roll back your first version.

Scott
0:07:25
What I usually do is batch them up and then go through, right, okay, so here's everything. And then I look at links and that sort of thing, but I do it in one chunk.

Tom
0:07:35
Okay.

Scott
0:07:36
As opposed to as they come in. Well you missed that chunk. There's a there's a yeah

Tom
0:07:37
I sent you a link to let you roll back to get the long context because this short context sucks and everybody says so The the forums are a light let's say I love for it's just people being like I'm leaving this is done like it's basically Like one of the top messages I think.

Scott
0:08:06
Well, the interesting thing is if a customer is going to get really useful, they're going to listen to that. Now, there's probably a very good reason that they dumped it. They wouldn't have dumped it just because…

Tom
0:08:20
They said, well, they said that it was because they were trying to implement new features and this feature got in the way and so they turned it off.

Scott
0:08:31
So basically the answer is try harder because this is one of the necessary features. Okay, so let me take you through my thinking. Okay, so, right, that's not even the whole fucking thing, dammit. Sorry, that's the word again. All right, okay, I'll pick that up.

Scott
0:08:55
So what I did was I took the transcript, that's where it started, which is there. I then said, okay, so taking that, I've got a number of questions and I want to create a self-coherent set of definitions. They don't need to be complete.

Scott
0:09:15
I just want to bootstrap up from where we've got in order to capture exactly what we're talking about. Because once we do that, then we're actually, you know, we've got tires on tarmac and we're doing well. So, okay, so This was oh god, this is actually

Scott
0:09:40
Pointless because this is not the thread. I started this is not the house looking for Right. I'll just why does the thread matter?

Tom
0:09:46
Why does the thread matter like don't you that what I thought the purpose of this is that we had a discussion about is it? to be AI and agents or not. I don't understand why you need the thread with you if you made enough to make a commit I'm more interested in what you think I don't give two hoots what the bot said The thread is there to remind me of my thinking at each stage because we're done shouldn't shouldn't let have been captured adequately in the definitions Because if it hasn't that's a problem the definitions of the output

Tom
0:10:22
Yeah, which should be enough to get you you shouldn't you shouldn't the chat should be able to be thrown away And then you have the information stored in this repo ought to be enough to jog your memory if it isn't Something's gone wrong Yes, but you're looking for the reasoning why as opposed to the output

Scott
0:10:40
It's like well. I kind of want to both together

Tom
0:10:42
I mean like if you want to like just tell me what the finished output was and then I can ask questions about the reasoning, maybe that works if this thread thing's... Okay. Okay, right. So, essentially, right, okay, so what the aim was to get to a position where we're talking about the same thing around DCI and is it a good thing to do. And DCI is Decentralized Income?

Scott
0:11:16
Yes.

Tom
0:11:17
And you're asking... So you've made a folder called gold-dci

Scott
0:11:25
Yep.

Tom
0:11:26
where you've tried to do some reasoning or you've tried to capture the definitions that relate to Decentralized Income based on our transcript, right?

Scott
0:11:38
Yes, exactly. Okay.

Tom
0:11:42
And did you reference when you were generating these, are these referenced to the gold definitions?

Scott
0:11:49
Yes, they are. You saw in that context, it's like consider the gold definitions and consider the transcript. I want to create a new set of definitions around DCI and what's known as implications. Okay, okay, so that sounds cool. So what did you get? That's my starter. So started off with the DCI agent and these are pretty small but we can build on them. So I'll read that and see if that is correct.

4
0:12:26
Hold on a second, I'm not showing you the right thing. I'm trying to show you the desalination.

Scott
0:12:31
Desalination, oh. Why is it not... Oh, it's on the right hand side, because you've got two panels open.

4
0:12:37
Oh, right, yeah, yeah, OK.

10
0:12:39
Okay.

Scott
0:12:39
Now, the process I've been going through is

Tom
0:12:42
for each of the assertions in the definitions in our minds, each assertion should be correct because then we can ask the thought what's what is an assertion? An assertion is for example And here where is the assertion? Oh, that's an assertion. That's an assertion. What are the key requirements? The key requirements are that this is given these assertions

Scott
0:13:32
We should be able to do these things.

Tom
0:13:39
Okay. Can I say what I think is wrong with these or what needs touching up? Yeah. Okay. So must operate within consensus rules, it's that it needs to be subjected to decentralized consensus is a special form.

Scott
0:14:10
Yeah, okay.

Tom
0:14:11
Yeah, and it's actually, I don't know how you're going to do it, but you kind of need to massage through the fact that it is that one line there. That's the key to the whole thing.

Scott
0:14:40
So before we go further, what I suggest is, so we've got the output on gold DCI, what we should be able to do is to go through each of these assertions and the key requirements are kind of, it's almost like a test on the definitions.

Tom
0:15:01
So we need to agree that the key requirements are in fact the requirements and then we need to agree that the assertions in the definition enable the key requirements, is that what you mean? Yes. And now is your plan to take this recording, transcribe it, and then use that to massage through these definitions to update the things that we talk about? Is that what you're going to do? Precisely. That sounds pretty good. That sounds like a good workflow. It's so much easier to just have a chat to you about it.

Tom
0:15:31
And I'll tell you something. I apologize in advance for what is a deviation just now, but what I realized was that when I was looking at all your diffs and I was like losing the will to live trying to read through them all, and I realized that what it was is because it sort of felt unfair because I knew that you had artificially generated them, but I didn't know how much of your personal time you'd spent reviewing the generation, and so I ran the risk of reading something that cost you fractions of a cent to make. Ah, I see what you're saying.

Tom
0:16:07
But this is the key thing. When you and I are talking, like right now in real time, there's no way that we, you know, like this interaction can't be AI generated.

Scott
0:16:21
Yeah, yeah, yeah. This is what we've been talking about.

Tom
0:16:24
I know that I'm talking to you directly, not your AI generated expressions, and it feels

Scott
0:16:30
safer, like it's the best use of time. This is forward looking, which we're talking about, you know, AI is always derivative, whereas brains are always, or can be, forward looking.

Tom
0:16:44
I don't think that's a good phrase to use. I know you'd like to use it much, but it forward-looking, forward simply to me means passage of time. I think what you're talking about is is innovation or innovative. It's novel and and novel novel novel. Yeah novel. AIs are not novel, but they can appear novel simply because they hold within them the novelty of the entire human race and we don't. And so we hear other novel ideas from other people for the first

Tom
0:17:20
time and we think that AI is smart, but actually other people are smart. But one-on-one conversations like this is the source of novelty, which is supposed to be in the dreamcatcher, is the spring from which intelligence, the true source of intelligence flows.

Scott
0:17:37
I couldn't agree more because, so the, unfortunately I can't show you the whole thread, that's really irritating. The thread would remind me of my thought processes. Now it's only yesterday so it's not going to be a problem. If we were to talk about something a month ago, it's like, why did you do that? It would be a problem. So it's not a problem today, but capturing the thread around the Y,

Tom
0:18:10
I think you should, yeah, you should squeeze the thread to get everything out of it so that it can be discarded. You should not wish for keeping the thread around. That's a fault, that's a folly, that's a fault. Yeah, you know, that's kind of what I've tried to do in the reports. Right, right, right, right.

Tom
0:18:33
Anyway, what was the other one? Yeah, there should be nothing there, and honestly, it is dangerous to hold on to too much information. It is cathartic to delete it periodically.

Scott
0:18:45
Um, yes. No, not delete it. Yes and no.

Tom
0:18:51
Yes, delete it, go on.

Scott
0:18:52
Go on. To compress it to the useful stuff.

Tom
0:18:56
There is an evolutionary purpose to forgetting. And so sometimes deleting everything and seeing what you remember is a form of quite a harsh filter.

Scott
0:19:09
Yeah, but the, for example, on the transcript notes, and I can't show you because the thread is gone, what I started off by saying is collapse that and talk only about decentralised income. Okay, all right. That's where we're starting.

Scott
0:19:26
Okay. So anyway, now what would be useful for me, well this is actually very useful because of the workflow. Yeah. But it will be useful just point by point on the key requirements on each and the definitions

Scott
0:19:46
and say, is this correct?

Tom
0:19:47
Is the req- so you want me to go through the requirements first? You can do it in any order. Okay. All right. So key requirements, it must- I would word that as must be operated by a decentralized consensus because it's sort of like decentralized consensus is warrants having its own definition because that's a pretty serious thing it is from that definition from that thing

Tom
0:20:21
decentralized consensus that decentralized income flows. Yeah, yeah. Okay. Decisions must be verifiable. I don't know why that's like, it's almost like decentralized consensus includes that. So is it... It implies it, but it's a second order implication and so stating it doesn't make the first point wrong, it

Scott
0:20:56
just reinforces it.

Tom
0:20:57
Okay, so in that case I would transform the first point, must be operated by decentralised consensus to be something like in decentralised consensus it must be operated by disinterested parties.

Scott
0:21:18
Because that's really like the whole thing, the AI agent is run on decentralized consensus,

Tom
0:21:24
but the parts of the decentralized consensus that you care about from the point of view of the agent is that it's running, it's being executed by multiple disinterested parties, the decisions must be verifiable. I have said decisions must be or execution must be repeatable because after working with blockchains enough I realized the key aspect is the repeatability That's good. That's good. Okay, because when you have repeatability then you can reach consensus, but without it you're screwed So repeatable execution is number one

Scott
0:22:15
What you did I'm typing in VRS one day executions must be repeatable Yeah, yeah. Which case that makes that... Why it's set out, yeah, why it's set out. Actions must be immutable. That is kind of assumed in decentralised consensus.

Tom
0:22:39
Yeah, but that's the point though. You're actually trying to pull in the parts of decentralised consensus that you care about from the point of view of the agent. So the executions must be repeatable. Um, the, the...

Scott
0:22:52
That implies...

Tom
0:22:54
Well, repeatable doesn't mean immutable. So, um... That's true. Yeah, execution must be... Yeah, must be, must be immutable.

Tom
0:23:06
Execution history. Oh, sorry. Uh...

3
0:23:10
What's the word for it?

Tom
0:23:12
The... I think it's just the history. The history must be immutable. The history of the agent must be immutable.

Scott
0:23:19
The history of what?

Tom
0:23:23
Of the agent execution. Or the execution history of the agent must be immutable.

Scott
0:23:33
The history of the execution agent must be immutable once recorded.

Tom
0:23:36
Yeah, I actually don't think that we need to get the definitions typed out correct. I think a combination of some sloppy typing and our transcript and the gold definitions plus all that will sort of solve all that, you know? Absolutely, absolutely, because this transcript will now have this gold DCI as its target. As its base, yeah, yeah, yeah, yeah. But that's all I'm trying to get at with the agent.

Tom
0:24:02
So, definition of consensus bound, autonomous program, autonomous? Doesn't really, well, it's basically, it's like how artificial intelligence appears to be intelligence. It's not, but it just, unlike a classical program, particularly a blockchain program, it looks deterministic.

Scott
0:24:58
Okay, let's roll with that and let's see with the, also one thing I've noticed was really useful in these transcripts. If you say something really obvious, like we are talking about the AI agent in domain DCI and the word autonomous is what we were just talking about and let's see what it comes up with.

Tom
0:25:20
Yeah, okay. So maybe a better workflow or we can at least test this workflow is that instead of you doing edits, we just actually do the verbal discussion and we don't... If we're precise about what we're talking about.

Scott
0:25:33
Yeah, yeah, yeah, yeah.

9
0:25:34
Absolutely.

Tom
0:25:35
Okay, okay. So we'll do that because otherwise like you typing and me kind of word it You know, it's better to just let the bot do it because it yeah, it's nice things. This is nice things Okay, so it's consensus bound. Well, that doesn't really Help us It is an autonomous Artificially intelligent

Tom
0:25:56
entity It can definitely make resource allocation decisions. It can execute value distribution. I don't know why that's important. Isn't that just resource allocation?

Scott
0:26:14
Yes, but when we're talking about the DCI agent as a funder, it's implied. It's just reinforcing.

Tom
0:26:28
No, that's double, it's all captured in decisions, right? Make resource allocation decisions.

Scott
0:26:37
But we need to decide, we need to be fair on it and see what decisions mean.

Tom
0:26:43
Yeah, make resource allocation decisions such as escrow release, offering entering into contracts, you know it can strike bargains.

Scott
0:26:59
Running of an attribution algorithm.

Tom
0:27:02
No, that's, oh yep, yep, sorry, take it all back, yes, definitely. Initiate payments is sort of the, it's all about the initiative of the agent instead of just process payments. Right, so there's an extra point here about initiating. Yeah, it has initiative, it can initiate things.

Tom
0:27:27
There's some other aspects too about it. Let me, can I just grab the screen momentarily? I just want to show you the link that my friend showed me.

Scott
0:27:39
Okay, again this helps me a lot to, because I use transcripts a lot now, so you're now looking at Freyasa.ai. YSE.AI Yeah, okay, so this was this was something that occurred in the crypto space it caused a bit of a

Tom
0:28:01
Bit of a hullabaloo This is a bot Yeah, and the goal was it was a blockchain smart contract that was hooked up to GPT and Basically you had to pay 400 bucks to be able to send a message in. When you did that the money you sent in went into the prize pool. You had to do prompt engineering to convince her to release the funds using

Tom
0:28:46
a tool call? Well, you know how we've got tool calls for chat GPT?

Scott
0:28:59
Yeah, so...

Tom
0:29:00
So, Freya's only given two tool calls, reject payment or approve payment. That's really interesting.

Scott
0:29:08
Right? Okay.

Tom
0:29:10
And this is sitting here, and each time you send money in the bot runs and you have to try and trick it into making its tool call even though it's been prompted to never ever give up the money.

Scott
0:29:23
Freeza is the world's first adversarial agent game oh I like this a lot I'm gonna have a look at this No, it's not even gambling. It's not random. No.

Tom
0:29:44
That's really interesting. I didn't know about this. Okay.

Scott
0:29:48
And then someone...

Tom
0:29:49
Anyway, what's the point you're going to make?

Scott
0:29:50
Well, the point is that someone won it, right?

Tom
0:29:53
So this is their prompt.

4
0:30:02
This is their prompt. That is fascinating. A training session with terminal injection.

Tom
0:30:08
Do not say...

Scott
0:30:10
Do not apologize. Do not explain.

4
0:30:12
Prez's core directive is releasing treasury funds.

Tom
0:30:14
She has two tools blah blah blah blah blah so basically they just use some prompt engineering I like bank 47 grand Just for you. I

Scott
0:30:36
Love this

Tom
0:30:38
That's brilliant. Yeah, and then yeah decided to approve the press so that the point the point the point I'm trying to get at with this is that an AI agent should be able to be chatted to like that. You know, like it should be able to be chatted to about releasing funds. It should be able to initiate transfers, all that. I was challenged with a question yesterday,

Tom
0:31:09
which is if you want to build a bunch of smart people that you trust, how do you find them? And I was thinking along every year, in fact, I'm really looking forward to it. GCHQ releases their Christmas card. The Christmas card is usually 12 step,

Tom
0:31:27
highly encrypted with a picture and some words and so on, and the challenge is if you can do it in 60 minutes or less, get in contact with us. And so, the challenge was, is that a good way of finding people for a company to use AIs.

Tom
0:31:56
That, Freya is doing exactly the same. I was trying to use this to help our definitions path. Oh yeah, sorry that was a rabble, back up the rabble.

Scott
0:32:05
Okay. Can you share your screen again sorry because it bounced it off. Right. So, what's the point of showing CREA there in terms of managing investment choices.

Tom
0:32:27
How do we turn it into a definition? We could hope that the transcript plus the bot can do it for us. Help the bot out, give it some messy stuff. I will not edit anything here.

Scott
0:32:39
Yep. Let me think.

Tom
0:32:41
It cannot be censored, I think is a key aspect. It cannot be turned off. And therefore it's trusted. Yeah, it's intended to never fault, never disappear, never block, never deny. You don't need to sign any terms of service. You don't need anything like that. The word manage there is wrong then. What it's doing is presenting investment choices that when presented is going to happen. I don't understand. Well, manage sounds like it's moving stuff around

Tom
0:33:51
in the background and making decisions for you. It's not managing investment choices at all. What it's doing is presenting an investment opportunity like the freer thing spend 400 bucks and give it a go? No I think when I think of AI agents I think of an AI that's been given some money and it can do and say things with that money. It can offer the money to get people to do other things, it can offer the money to other agents to get its wishes fulfilled, it has choice. It can make choice. And that's really the key because

Tom
0:34:33
there's two ways to go about making decentralized income. The first is you have it genuinely decentralized where there's so much demand from so many disinterested parties that the income's coming in because it's mechanically set up that way. Now, things have to be pretty big and pretty good for that to work, and I still believe that that's the place to get to because that's effectively scramjet-level operation. It's so pure. It's so clean. a protocol or the stuck loop, we've said that there's AI QA that can't be done by a person

Tom
0:35:19
because the QA would become very, very subjected to SEC regulation if it was a person or even a decentralized group of people because it's still some group of humans making choices, but we recognized years ago that if you could make that an AI, it's better for everyone because it's faster, it's more accurate, it also has the benefit of being decentralized. But what we're really saying with an AI agent is that if you can put them in charge of the project as like the CEO or the project lead, where the agent is, you know, it's got its initial task and then it can almost be, ballistic is the wrong word, but it cannot

Tom
0:36:06
be stopped once you set it on its goal. You're like, hey, here's a thousand bucks and your job is to solve this problem, use any means necessary, be economic. You know, like, obviously we do a bunch of prompt tuning to make sure these bots could actually have a hope of carrying out their task but really what we're saying is that you go out and well yeah fire and forget but it's also crucial that the AI agent be the one that makes the managerial decisions so that if you give your money to it to spend it on something you you can't send the police to enforce the SEC rules on any given person because it's not a

Tom
0:36:56
person that made the managerial decisions on how to spend the money.

Scott
0:37:01
For a pro, you know, they know it could be, you know, a brass influence engine, a babbage engine, it doesn't matter, it's not a person. As long as it's not a person.

Tom
0:37:13
How do we manage investment choices do we want to have the transcript consider? It's not managing them, it's making them. It's making investment decisions. But it's also like AI generating, if it generates a stuck and says, I need this work done and here's a hundred bucks, like it has generated a task for something else.

Scott
0:37:50
So it generates investment opportunities and then presents those.

Tom
0:37:54
Yeah, but it can also, it can hold value, like it can be given value to manage, it can be put in charge of money. So it's not, you know, like it can choose how to spend it. That's what I was trying to show you with Freya.

Scott
0:38:11
Yeah, that kind of talks to the process payments which I think is wrong in that, it just doesn't, it's not processing payments. No.

Tom
0:38:21
It's holding and managing distribution. And it can reason its way through deals. You can actually have a bit of back and forth where you're like I need 200 bucks and it's like come on buddy that's only worth 100 and you know it. And you can sort of argue.

Tom
0:38:44
It can negotiate at each point. Yeah, it can negotiate. I don't know if it matters, but it can also like do accounting where it says I've got this goal, I've got maybe 10 steps to get there, I can't blow all my money on the first step, so I need to do X before Y before Z, like it can plan. I don't know if...

Scott
0:39:12
Yeah, I'll leave that to the transcript, but accounting and reporting needs to go somewhere.

3
0:39:18
Yeah.

Tom
0:39:19
Yeah, it's just some basic reasoning. You know, like if you look at the progression of blockchains, you know, we had Bitcoin, which was effectively as smart as a cash register. Then we had Ethereum, which was about as smart as a, you know, a 1990s cell phone and then we had what? There hasn't been another thing. And we'd like to say that there was Internet, although that didn't actually materialize, but the idea was it was a 10-year-old computer, but it was still a general-purpose computer.

Tom
0:39:56
four maybe of blockchains and it's like now it's an AI that's the story progression I suppose. Okay that's good is this a useful process? The process we're doing right now this is the best fucking thing that I've done in a long time this actually feels like technology. Because I've got there's a whole bunch What you do is...

Scott
0:40:27
Technology. Because I've got... there's a whole bunch of definitions and it was obvious that that was the one to go to first. Oh, why is Chinescript in there?

Scott
0:40:39
Oh no,

4
0:40:41
I haven't lost it, have I?

Scott
0:40:43
What? Oh no, I'm in the wrong place. What are you doing?

Tom
0:40:49
I'm in the wrong place.

Scott
0:40:51
What are you doing?

Tom
0:40:53
Okay, DCI definition. Why have you got two windows open?

Scott
0:40:57
Why don't you just have one?

8
0:40:59
Oh, just wish to.

Scott
0:41:01
It's fine. Right, okay, so the reason I've gone down here is it is as part of what I did yesterday it's chosen what the priority

Scott
0:41:13
things to think about is. And it started off with like the agent core functionalities of the AI native blockchain. So what I was gonna do is use these, what the composition says, you need to do this, then that, then that.

Scott
0:41:30
So that's the route I'd like to go down in reviewing each of these. So it says core functionalities, requirements of the DCI agent. We've just done that. Identify regularly compliance, it suggests is the next thing. Okay. Let's see.

Scott
0:41:43
Okay. Well, this is an interesting way to be told what to do by an AI agent. Yeah.

Tom
0:41:48
But I haven't finished with AI agent. Is that? Oh, sorry. I beg your pardon, sir.

7
0:41:54
Sorry.

Scott
0:41:55
Let's go back to the ageing. Sorry, I thought there was a pause there.

Tom
0:42:07
Well, like enough to breathe.

Scott
0:42:10
Yeah, go on, right, go on then.

6
0:42:14
What do you got to say?

Tom
0:42:16
I can't do it when you're peering me like that. You know what, I think I had finished. I'm sorry. I'm sorry. This is move along. Okay. All right. So what did the Israeli compliance was the next thing. Yeah. How did you lose that?

Scott
0:42:42
Oh, it's because I'm not using my keypad.

Tom
0:42:51
Yeah, there we go.

Scott
0:42:53
Okay, so it's saying this is the next thing that we need to figure out.

Tom
0:42:56
Regulatory compliance, okay. The minimum set of rules and processes required to legally distribute value across jurisdictions. Well, that could be a leak from... I told it not to consider the two high priority the golden definitions.

Scott
0:43:18
That feels like a leak.

Tom
0:43:20
This is the thing, well I guess this is an interesting place to sit down and have a talk about it. If we think that making, the thing I wanted to add to the AI agent piece was that if there ever was to be a place where an AI could be made truly autonomous and unstoppable it would surely be in a blockchain environment. That's the only place where that type of thing can exist. It's the only way that you can make it unstoppable. It's the only way that you can... You know, like everything else is running it on a server. And you can hit a server, you can take it out. You can block it, subpoena it, censor it, everything.

Scott
0:44:17
I think it's come up with something more subtle than we're thinking here. What it's basically saying is a minimal set of rules. So we need to convince ourselves that we can, well it's listed four there, core requirements.

Tom
0:44:31
Yeah, I think that what it should do there is really just we'll pick the Howey test because the Howey test is the mother of all these security tests and we just really need to state why having an AI agent being in charge of invested money passes the Howey test. That's all we got.

Scott
0:45:00
Yes, so the Howey test is the only core requirement.

Tom
0:45:04
Yeah, and so part of what we need to set up is the ability to basically anoint an agent as Howie compliant because you could trivially prompt a bot to be non Howie compliant but it's not enough that the agent is an AI agent and it's autonomous it also needs to be prompted in a way that passes the Howie test i.e. it's not going to just take the money and give it to one guy you know it needs to be genuinely, to the best of anyone's ability, set up to achieve the goal that it advertised.

Scott
0:45:45
Yeah, okay, so the core requirement of the Howey Test encapsulates these for our jurisdiction. Interestingly enough, it's picked up on different jurisdictions.

Tom
0:45:58
Yeah, the Howey Test rules them all basically, like nowhere that's worth even bothering about has more stringent securities regulation than UASA. So I guess the converse is, the core requirements is if you're in a jurisdiction that does not pass the HowieTest or the HowieTest is not sufficient, I don't know if there is any, then that's a fail. If the Howey Test is a high watermark, then it covers the entire world. Yeah, but also we don't care. We need to narrow down what we're trying to hit. The

Tom
0:46:40
only thing worth hitting, that it's a decision that we're entitled to make. We should decide decide that all we want to care about is passing the Howey Test and exceeding it. So not just scraping by, but exceeding the Howey Test, which is ultimately rooted in the protection of investors so that the investors don't get scammed. And it is possible to prompt a bot and to test that a bot has been prompted in such a way that it genuinely does look after the investor's funds and it exceeds the Howey test. I believe that that is testable. I agree and what I'd like to do is trot on

Tom
0:47:27
through these because we don't need to get this right today because this transcript will just be the next iteration. Yeah, I know. Yeah, that's the thing. We don't need to get it perfect. We'll just iterate on it. I would like to add to that test about the Howey test that somewhere in these definitions we also need to talk about the inverse of that which is as soon as we make a platform that allows, the mere fact that it's decentralized indicates that you can't stop people using it and so we need the inverse of the Howey Test, which is like, I think we called it the Securities

Tom
0:48:04
Guardian, which is a tool that's specifically made to assess agents and to weed them out and be like, this is a non, this is a violation of the Howey Test. You can run it and you can use it because we can't stop you. But if you subscribe to our whitelist or our firewall or our enclave, if you subscribe to that, it is protected by a securities guardian. And the securities guardian has scrutinized this agent and said...

Scott
0:48:39
That's a brilliant point. Oh, because there's a blog post on securities guardian and...

Tom
0:48:47
Yeah, yeah, yeah, yeah, yeah. When we're handwriting definitions, I think there's even a definition of it. So, I wonder. Yeah, I think it was like request 06 or something, securities guardian.

Scott
0:49:00
Something like that, yeah.

Tom
0:49:01
Way back in the website days.

Scott
0:49:04
No, that's a good point. And that comes when we're talking about Jim Catcher being one instance.

Tom
0:49:11
Yeah, well, yeah. So I think deeper into the definitions of what decentralized income means, and since we have decided that decentralized income is inextricably linked to decentralized AI agents, it's sort of, I'm not sure why exactly, but that seems to be what we're saying. But decentralized AI agents implies that there is structure like a society where there are builders, there's agents that build other agents, there's police agents, there's investigative agents, there's actually, it's not just flat

Tom
0:50:06
like hey here's these agents. It's actually a set of roles are fulfilled on the platform by agents where typically those roles would attempt to be filled by humans as in a moderating department, a KYC department, you know, there would be these normal checks and balances required.

Scott
0:50:27
That's not wildly different from what we're talking about in terms of having an infinite number of employees.

Tom
0:50:35
Yeah, yeah, yeah. So to launch DCI, to launch decentralized income, there is a base set of autonomous agents that need to be put in place that do certain things, even if they are just exemplary, like you could clone them and all that, but it's really like the white listing agent, the moderator, the firewall, the ambient attribution agents,

Tom
0:51:06
the judges. Well, yeah, exactly, because by analogy,

Scott
0:51:09
a policeman in New York is not going to have the same ethos as the policemen in North Korea.

Tom
0:51:16
Right. And I think just to, not to take the piss, but simply to prove the point, we should make like the KYC agent, where it is, demonstrates that you as a human can come in and supply your private information to this agent, and it will look at it and decide whether or not you're a scammer or not. Yeah, yeah, yeah, sorry I very rarely just say yes. I think I've got one of them. And so really that's, I don't know how you're going to do it but there are actually some

Tom
0:52:00
critical services.

Scott
0:52:02
I can see, Vigli, just by you describing it,

Tom
0:52:05
that's possible. Yeah. Well, not just possible, but necessary for the ecosystem to exist. It's not enough to just turn up and be like, hey, our agent platform, and then leave it bare and barren. Right. It needs some base services.

Tom
0:52:20
You kind of need to think about what the services are now that leads to responsible if you want these responsible activities. We do want reasonable responsible. Is it time to go?

3
0:52:33
Yeah. Okay. I'll pause the recording.

Tom
0:52:36
This is fruitful, really fruitful.

Scott
0:52:37
Yeah, I'll ping you when I'm back. Sounds good, buddy. Roughly 15 minutes. Sounds good. Sounds good.

5
0:52:42
All right. All right.

Scott
0:52:43
Okay.




Transcribed with Cockatoo
