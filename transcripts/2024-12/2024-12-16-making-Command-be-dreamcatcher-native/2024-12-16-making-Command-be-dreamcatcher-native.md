0:02 Tom:
From my side, I want to talk about the project layout instructions document.

0:08 Tom:
That's about it. I've got some interesting chat, but that's all by the by.

0:15 Scott:
That's cool. How about we start with that because that will inform what I've done with AI Overlord. There's a lot of convergence going on—generating code by just talking to a bot has been going really well.

0:53 Tom:
The main part I want is the ability to make updates or patches to the system very rapidly and with minimal change. I want it to be very stable when it makes an alteration. I think the missing set of instructions is how to run a project when you're only doing prompting.

1:17 Scott:
Okay, so talk me through. I read through this twice. This is a new, crushed version, which is significantly shorter.

1:30 Tom:
In essence, you've got some requirements for it. This is the knowledge structure I've been talking about, which is interesting when you come to the briefing folder. Here are the folders and what each internally does. You can drill down if you like, but this gives you all the context. It specifically stays high level. For example, if it's a code file, I only want to see the functions that have been exported. If it's a test file, I want to see each test that's been run and why. Instead of having comments in the test file, putting them in the project map means they can be consumed in one overarching gulp.

2:14 Scott:
Oh, that's a good idea. I've been doing something similar with the reasoning that used to be the "so what's." With the README, what I'm shooting for is update stability. o1 Pro is very good at staying stable when you give it a doc and tell it some changes you want made, and the changes come out fairly minimal. But I was losing a lot of time trying to steer it. If I did steering in two passes—where the first pass is just agreeing on the layout of the document and the order of things—then the generation of the document is significantly quicker because it requires less.

2:56 Tom:
Could you pull up the reasoning briefing folder side by side? I think that would be quite helpful to see where there's differences between what you've done.

3:04 Scott:
Where is this thing in the Reasoner repo?

3:11 Tom:
This one here, right?

3:17 Scott:
Yep, and then if you go to briefing.

3:22 Tom:
Briefing, there you go.

3:30 Scott:
I read through this document. What are you trying to contrast?

3:35 Tom:
I'm trying to compare and contrast your thinking step by step. If you go down to the next section—what will you be given—this is the pre-stocking of it.

3:45 Scott:
Okay, you’re given the strategic tasks and then the folder structure. You have effectively five iterations to get to the point where you've got some sensible stuff coming out, which seems to converge closely to what you were just...

3:58 Tom:
So, is the loop that we want to run through "Command"? Are we settling on the name of "Command"?

4:05 Scott:
No, "Command" is a long-running object in our universe. I don't really want an AI Overlord; I do want a commander.

4:14 Tom:
Give a definition of "Command" for the transcript.

4:22 Scott:
It is what you're doing with the Overlord; it's just a rename.

4:28 Tom:
Okay, easy enough. So, is the operation of the commander—you give it a bunch of context files, and then it will give you back a specified structure? Now, how can we convert this to be stack-based?

4:44 Scott:
I see what you've done. It looks like traditional project management, which is not wrong, but I want you to entertain the concept of, if it's not a linear project, if it's a network-based project, then the output of this machine should be money against tasks. It should be escrows against tasks.

5:00 Tom:
That's what it should calculate—not traditional "you go do this."

5:07 Scott:
You're talking CCH?

5:09 Tom:
No, I'm talking about you and me because that's really what it should be. Why would it not be that we follow that same incentive structure?

5:17 Scott:
We can do, but at the moment, this particular command is for you and me.

5:22 Tom:
I'm mostly interested in what you're thinking about the format as opposed to what's actually stated here.

5:28 Scott:
Well, I don't see the overlay yet, so I'll keep going with this thing.

5:38 Tom:
All right, so the idea of being able to generate, first of all, a blank project—you'd sort of start with an existing project map that was for a similar task.

5:47 Scott:
Right.

5:49 Tom:
You'd reason through your project route first, and you'd focus a lot on the structure of the README because you're designing top-down here.

5:56 Scott:
Yes.

5:58 Tom:
Then what we have here is a list of dependencies because it seems that controlling which dependent libraries the code is based upon is the strongest way to steer how the output goes.

6:08 Scott:
Yes.

6:10 Tom:
That's maybe a thousand times leverage over just telling it what to do.

6:14 Scott:
Exactly.

6:15 Tom:
I wanted to add a special feature here that is a sub-project where, if the project was made in this format, then a sub-project can be set up as a dependency of this project.

6:27 Scott:
Right.

6:28 Tom:
This allows you to use the concat tool to, for example, only pull in all of the reasoning that happened within the project.

6:34 Scott:
Yes.

6:35 Tom:
You can filter in a nested way. We can make this thing walk the hierarchy between these reasoning domains.

6:41 Scott:
Exactly.

6:42 Tom:
If you think of each as a reasoning domain.

6:44 Scott:
Which is the dream thing, so you only deal with as few READMEs as you can.

6:49 Tom:
Right.

6:50 Scott:
You expressly ask it to ask you for more information.

6:54 Tom:
Right, but if the projects were then—I can still use the same concat filter to pull in all the reasoning.

7:01 Scott:
Yes.

7:02 Tom:
If I want to reason about a collection of modules and their interfaces together, I would pull in the project map which defines what their interfaces are.

7:09 Scott:
Yes.

7:10 Tom:
Then I would pull in the reasoning that described why this module needs to exist and what features it has.

7:16 Scott:
Yes.

7:18 Tom:
That would allow me to fairly accurately reason across multiple modules.

7:23 Scott:
That's the approach I'm pushing for—the same approach.

7:26 Tom:
Well, yeah, but that's just how you make code now. I'm wanting to talk to you about what the purpose of the specific code that you're making is.

7:34 Scott:
Okay.

7:36 Tom:
At some point in the future, we need to shift to working on stacks with dependencies, stacks with parents—all of that.

7:44 Scott:
Yes.

7:45 Tom:
Everything that you have defined as a tactical task is going to be a stack—it's work to be done.

7:51 Scott:
Yes.

7:52 Tom:
Now, what I am starting to expect from this machine is the calculation of the dependencies between a bunch of things.

8:00 Scott:
Yes.

8:01 Tom:
First, the definition of all the things that need to be done, and then what is the dependency between them, and then what is the importance.

8:09 Scott:
Yes.

8:10 Tom:
The importance is ultimately—we set that at the top level, and then it ripples down through the dependencies.

8:15 Scott:
Exactly.

8:16 Tom:
It says, "Well, if that's really what you want, then you need to shift all these things in this way."

8:22 Scott:
Exactly.

8:24 Tom:
But I want to add a concept here—the value that it should place on it. It should be talking in terms of units of value.

8:31 Scott:
Yes.

8:32 Tom:
Not just "this is too blunt."

8:34 Scott:
It should be value.

8:36 Tom:
This is zero shot, I know that. I'm talking about what I think it needs to be.

8:40 Scott:
So, if you go up one again, let me take you through what the briefing notes are.

8:44 Tom:
Okay.

[Conversation continues with discussions on integrating the Dreamcatcher model, mapping tasks, allocating resources, and refining strategies.]

52:06 Tom:
Right, today I'll be doing another iteration of, now it's called Overlord Commander—we'll turn it into Commander.

52:15 Scott:
Cool, and I'll see what I can do with getting—because I do know this command control stuff inside out.

52:22 Tom:
I might be over-indexing.

52:25 Scott:
[Laughter] Don't let that stop you.

52:28 Tom:
And I might be over-indexing.

52:30 Scott:
Yeah, but if I can get that mapped, that would be great.

52:34 Tom:
Yeah, sweet. Also, the mapping part—have a crack at that. See how that works in with the definitions and the reasoning domains, that mapping.

52:41 Scott:
Okay.

52:42 Tom:
I'll catch you later, buddy.

52:44 Scott:
All right, man. This is heavy stuff.

52:46 Tom:
Yeah, nice fun times.

52:48 Scott:
All right. 