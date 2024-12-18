2024-12-10 o1 pro concat tool to include folders in prompts.md 

0:01
okay we're off now okay I got some stuff for you excited I re oh you can tell
0:10
from my expression in the virtual world um I wish I could see the token burn
0:16
rate stats cuz I at a guess I would say
0:21
I burned between 60 And1 worth today easy easy it's uh you know how we were
0:29
talking about where or should we uh you know spend the $200 this is maybe the best deal I've ever got like I feel like
0:37
I'm ripping them off with how much consumption I'm getting for the oil you can eat in sure they extract their pound
0:42
of fles I I well they may have um overcooked it anyway um
0:52
So based on the encouragement that you gave me to say look you shouldn't be coding anymore at all even though you
0:58
feel like you have AIS assistance you should be reasoning first getting the spec down getting the spec right between
1:05
modules getting the interface correct and only then only then after all that painful work is done where you have to
1:11
actually think um then should you get the code to be rendered by the bot not
1:16
with your measly little fingers so um yeah thanks for
1:23
the thanks for just I'm I'm trying to be more disciplined in my interjections
1:29
okay thank you for that too but also thank you for disrupting my somewhat quarter Century old workflow that I
1:35
polished and honed and spent a lifetime's worth of career getting good at anyway anyway so in a nutshell the
1:43
largest difference that I've noticed today is that it makes sense to actually
1:48
pass the entire code base into the context window because it's free before
1:55
when it wasn't free even though I tried to tell myself don't worry about the money because it was so expensive I
2:02
guess subconsciously I sort of resisted since it's all you can eat and
2:07
since the quality of the output is so darn good um I have taken to handing in
2:12
the entire contents of every file even to ask the simplest of
2:18
questions that's interesting now let me show you how I did it yeah I'm going to
2:24
shut up and let you just talk until you see stop okay let me show you let me
2:29
show you so I made a little tool um sent you a link to that tool going to
2:35
guess that you didn't uh uh no I did uh and uh installed it and uh tried to run
2:43
it and it gave me an error what was the eror um oh it doesn't matter I'll just
2:49
stick it through uh Pro and fix it thank you Dy so here's um what it does I'll
2:57
give you an explanation just because you you need it later and you might as well have it
3:02
now um let's go into one of your favorite
3:08
repositories the reasoning repository
3:16
beautiful um SL reasoning here we Dy
3:23
now the tool is um
3:33
published on jsr but what's interesting about it is that it scores 100% on the jsr
3:41
score what does that mean that means that it has all these best practices
3:48
built into it how did you get 100% to be honest I didn't this entire
3:56
module was written by 01 Pro I think it looks pretty good it's scored
4:02
100 100% on the quality settings on jsr and it was
4:11
maybe um maybe five different threads which produced three different versions
4:19
as I used the tool and realized it needed modifications so I don't really Place
4:24
much value on writing code initially the value comes from can I refactor can I
4:31
modify can I change the code cuz that's when it gets really hard cuz anyone can you know like blank sheet of paper to
4:37
something system yeah that's thear Stu right that's where that's where you really hit resistance and your speed
4:43
just dies right but here's what it does whole thing straight
4:51
out of 01 Pro um what it does for you is probably what
4:59
everyone cares about so I'm in the reasoning
5:05
directory I have installed this tool called concat I'll just check the
5:10
version number um okay version 0.3 that's correct okay cool uh now what I'm going
5:18
to do is I'm going to go concat everything in this
5:24
directory recursively mind you that ends inmd so this is just a concatenation
5:32
tool uh yes thank you for reducing it down to such a for my understanding all
5:39
right okay it's a concatenation tool but um what it does for
5:45
you is um oh actually it looks like I pulled in all of the dotg folder as well
5:54
so I'll just maybe not I I'll stick to the domains
6:00
wait wait wait wait wait um so I want everything [Music]
6:08
in every directory named starter MD and I'm going to Output it to dump. MD okay
6:16
go oh sorry this is I needed a space my bad my
6:22
bad okay now there you go processed 135 files wrote them all to dump. MD
6:30
the number of 01 tokens was 248,000 so you know you're out uh oh um sorry I
6:37
thought you were in command line you're not in command line I am in command line but what I included in there is a is a
6:43
token counter so that you know the context window size of what you're doing
6:48
oh I see right okay so that's I with withraw my previous comment yeah yeah so
6:55
um this is a list of all the files that it pulled in obviously it pulled in some
7:01
um files that were really big like all the narrations or the all the
7:06
transcripts yeah there all that right yeah but the point I'm trying to make is that everything together is a grand
7:13
total of um twice the context window size which is to say that all in all
7:20
it's actually not very much you know like if I was to say um
7:27
ignore and better not not for example um because that's where the big ones with
7:33
transcripts and messiness like if I just go into
7:38
domains then I get a mere 26 killer tokens okay right and now the format I
7:46
hear you ask is um all I've done is I've done like um so
7:54
asy armor is a format for um encoding sensitive data in a way that
8:01
survives all knowing Computing systems text mangling ability because if you
8:07
give someone a text file depending on what machine they're running it's going to come back a little bit odd right so I figured well this thing knows about
8:13
these demarcation lines and so everything has this demarcation and then the path the pa the
8:20
relative path to the file and then at the end of it it has um end
8:27
file excited yeah I knew you would right now I can take that whole thing right
8:33
copy it yeah that's easy it's 27 key yeah 27
8:39
killer tokens and then I'm like um rank the best five ideas in this in these
8:50
files and count the number of
8:55
files boom okay this should be trivial trivia right um so anyway I mean that's
9:02
the that's kind of the point um and so been getting really good results with that and so what I've done
9:10
over in my side of the fence um if I load
9:21
up if I load up the user interface mhm
9:26
and so I've been doing the same technique on the user interface and instead of like
9:33
um like I kind of don't need in a way it's better than
9:39
cursor because I'm guaranteed to get the entire the entire stack yeah you know so
9:47
I'm like um so if you concat what you're interested in at this time that is your
9:52
context and uh so you don't need to do the consider at and so on well yeah so
9:59
the way that you specify the path here is sort of the consider at in a way and
10:05
now all all the cuz I well I can separate so here I'm purposefully
10:11
separating separating out some folders and some files yeah and so that's the
10:16
cons that's the scoping like the consider at part um how does uh but you
10:23
end up with um correct me if I'm wrong with one dump. MD yes so um when it
10:30
ingests these 62k tokens um how does it know what to
10:37
prioritize uh well it doesn't because if you wanted to prioritize something more
10:44
you should have referred to it by file name so you're like like uh I'll give you an example or
10:52
a a demonstration sorry um so here's here's them now what's
11:00
I know that the um it's not as friendly as it could be
11:07
okay but without API access you're going to have to just um we're not very
11:12
friendly anyway so I wouldn't worry about well you can speak for yourself but um the what would you for what would you
11:20
like to ask like for example what is the purpose of the queries
11:27
file um yeah sure we go for that um I've got other ones that would be interesting
11:33
yeah give them give give them to me because the other thing that I've been playing with is the um fact that you can
11:39
ask multiple instructions in one hit you know normally we had the pattern of one
11:45
thing one thing only don't confuse the machine it'll it'll get cross-eyed it kind of does okay okay well here's an
11:53
example now yesterday I said it's probably going to be two or 3 days before have anything useful but what I
11:59
was doing yesterday was doing qu strings something like consider
12:06
um uh no can you go into the reasoning folder uh this is this is the entire
12:11
code base of the UI front end it's not the reasoning all right okay um these
12:17
are not exact from memory and I can't see my laptop cuz it's still not connecting to my VR um but it's
12:23
something remember I've got uh there's uh there's reasoning there's three C
12:30
then there's definitions yeah um so I've been saying something like um prioritize
12:36
the reasoning you must always uh adhere to this now consider the definitions
12:42
tell me where the definitions fail in terms of the
12:49
reasoning okay um I will ask that question but this is a different set of files so I'll um sure yeah yeah yeah get
12:58
what I'm talking like um this is important this is less important and
13:04
this is what I want okay the kind structure of that so the other job just
13:12
finished uh it counted 79 files I think that might have been an
13:22
error total files process 79 oh okay fine that was right number of files 79
13:29
all right so the point my point I was trying to make here is that this dumping format it like curses doing something
13:36
like that in the background anyway because it has to stuff it all into the uh context window of the llm and
13:43
so you may be able to find for us a better um demarcation or line
13:50
break uh system but all I'm indicating is that this initial version that I've
13:56
made um which I actually wasn't actually my idea it was 's idea
14:02
when I was like how do I demarcate files in an llm context window and it was like you should do this and I was like that's
14:07
a good idea here's here's here's a thing I'd like you to try um inside of this one so if you scroll up like let me get
14:14
you an example scroll uh test you if you scroll up I just want to see the dump
14:19
file um uh can I just navigate it in the actual yeah yeah sure
14:26
cuz I don't know this you want so what we're looking for is um asking a
14:33
question where uh one folder inside that dump file which you should be able to
14:41
refer to yeah somehow yeah um this section of the dump file is more
14:47
important than this other section oh yeah okay I think I got you um
15:00
man um may say this is awesome okay so what do you want to say so you want to say um the
15:09
folder Innovation is the top
15:17
priority treating that as gospel y now what um refer to a Target
15:28
um refer to um what do I want uh decentralized
15:36
AI mhm yeah yeah
15:43
yeah just very curious to see and and what do you want to what do you want to
15:49
do um now this particular example I'm entirely sure just tell me something
15:56
anything uh right [Music] um uh tell me
16:04
any uh uh logical fallacies inside of
16:09
decentralized
16:19
AI yeah I like that even
16:24
curiosity yeah is that good yeah yeah that's good um the reason I'm interested
16:29
this one is because having uh don't don't argue about this
16:37
here's your target this is what we're talking about so basically um following
16:42
the chain of command yeah is what you're testing right yeah all right and now we'll go back to
16:48
this other job [Music]
16:53
um see when I give it the whole code base it does not think for very long it
16:58
doesn't take very long it almost doesn't affect its speed of outcome any way
17:05
whatsoever and at the same time um om Pro doesn't appear to get confused by
17:10
large amounts of data because some of that behavior where we had um restricted the amount of input data because we
17:17
didn't want it to get confused yeah um is appears to be not so much an issue
17:23
anymore um is that factor that Cod is highly uh information
17:30
Rich um possibly like a working codebase versus one that was uh nefariously
17:37
written but um moreover when I was getting it to asking
17:44
some questions about the reasoning repository anyway it was past every file
17:51
in that folder and I was like you know what's in that whole repo and I was like you know what's wrong with this with
17:56
inconsistencies and it spotted like spelling mistakes
18:01
um two locations where you use the wrong acronym for nap and so it feels like it
18:08
it feels like it has an almost like a um uh a higher pixel count like it has a
18:17
higher definition it can almost see all the tokens in the full context window
18:23
whereas it gave me the feeling that with 40 if you gave it a full context window it was it would be
18:29
like the the remember about uh I don't know six
18:36
maybe months ago um I was talking about um uh 40 prioritizing information at the
18:43
start and at the end yeah yeah in the middle it kind of n not so much yeah uh
18:49
so what you're saying is uh it's uh what this
18:55
pixel um yeah it's um the resolution is higher and is considered all well yeah
19:01
the resolution it feels like the resolution is full like it's no longer um damped down or something and
19:08
um part of why that is it one of the guys from openai was
19:17
giving a talk and he was saying that there's a trade-off to be had between like um he called it system one training
19:23
where you're like doing these like uh $200 million training EXC sizes yeah and
19:30
and what happens there is that the when you want to get a response it'll cost you like less than a cent to get one
19:37
response or you could do a $10 million training exercise but it would cost you
19:43
maybe 20 cents 50 cents for a query so the less the less system one training
19:48
you do the longer you have to wait and the more you have to pay to get a similar quality output but what they're
19:54
saying is that with the 01 style of reasoning you can simply balance those
20:00
two competing um calculation costs so you can have sure you can have a big
20:06
training exercise but you can also get really high quality by just burning
20:11
more jewels on generating the output yeah
20:17
that that seems to make sense um what I'm seeing is um it appears internally now they haven't at least what the
20:23
internals are for pool yet but um what I think they're doing is
20:29
uh a kind of multi-step um process where the um the very first step is what's the
20:36
topic you're talking about and then it will probably I think go into the um the
20:43
correct training model um that actually addresses what you're asking for so if
20:49
you're asking for a mass problem is not interested in atic history yeah yeah
20:55
that's right it's like it activates portions of the brain based on you know like it's
21:02
yeah yeah so I mean yeah so what are we doing
21:09
now like uh of that yeah was that okay so let
21:19
see
21:25
on stop going here that's pretty
21:31
good okay so there's a pattern here that you've discovered um what happened when you
21:38
tried to dump the 246k uh it'll it'll it erors and says
21:43
the um Miss is too big just just don't ask me yeah yeah but um I thought it was
21:49
actually pretty useful having the token output cuz you're like it gives you a good sense of scale it does you know
21:57
like 26k is a lot of head room you know so and particularly if you keep
22:03
following that pattern of just re-editing the first message or the second message with an additional prompt
22:11
um that it feels most useful to edit the second message because the first message
22:18
you can use the output as something to sort of boost off of or leverage off of
22:24
when you and the second one you just keep re re-editing the second prompt
22:29
because the the first output anchors the model into yeah um the way I've been
22:35
doing that when we cared about tokens um now we don't it's less useful um was uh
22:42
I'm about to give you a chunk of stuff when you've understood it say got it yeah
22:47
right but that seems superflous now yeah [Music]
22:55
um these are actually not bad points
23:01
this is conceptual tension or at least a major practical limitation not addressed
23:08
by coordinated refusal resource practice not be a single entity could
23:15
deprive the agent of the competitional means to
23:20
run that's quite cleever a coordinated refusal of resource providers could
23:26
deprive the agent of the computation means to run effectively well it was always there
23:34
it's just it's just saying that it needs to be address more directly um that's really
23:40
interesting um okay all right so tell me
23:46
um uh if we to uh pop one up the stack you were telling me about the use of
23:52
this on using um uh NL and LM logic as
24:00
the kind of entry point to c yeah so um what I started doing
24:06
was bringing in the components of
24:12
artifact
24:21
um that was not it um yeah just bringing in whole
24:26
modules of artifact mhm um and it's like this
24:33
one uh and you know like being able to generate a range of
24:39
tests the you know did it um um was it able to reason without running any
24:47
problems yeah like when I copy it over it has next to no errors if it does have
24:52
an error what I've been doing is feeding it back into the prompt the errors have been
24:58
uh how do I describe them like something something changed in how
25:07
it generates code output where the code output is stable like you know how you have those sorting algorithms where like
25:14
stable sort is like a good property of A Sort like if you run it twice you still have the same thing and so the um the
25:24
code that it's generating now when I look at it in a diff is actually like uh you know in a 200 line file I
25:32
might have say six lines different and it was actually a completely new generation like it tries
25:41
to hold the if if it had one of a code file as the example and it's being asked
25:47
to fix it the output is always minimally different whereas before it used to be
25:54
ah wildly different I've spotted that from the completely different Direction
25:59
what I've noticed is um I actually got confused my tab yesterday because uh the
26:06
output was remarkably the same and I thought I'm in the wrong tab yeah right which is how it should be so they
26:12
somehow solve that problem you know which is great um I've been asking it to do
26:19
reverse reasoning so for example this
26:25
thing I gave it code I gave it code that had
26:31
no requirements and asked it to infer what the requirements
26:38
were yeah y as how did that work really well really well
26:46
um the only prompt difference I had to do was [Music]
26:53
um some of some of the errors it was making were actually quite hard for me to spot like so it was correct enough
26:59
that I couldn't it the errors were non obvious like I actually had to sit there
27:04
and read the whole thing line by line before I was like oh wait wait wait wait wait this like it it actually is quite a
27:11
mental workout to um uh to properly appraisee what it says
27:19
because it sounds really good and it is actually um it's logically correct now
27:25
as well whereas 40 was just it just sound right and then you read it and you're like that sort of doesn't quite
27:32
make internal sense it's sounded right and it's a thousand words and yeah yeah whereas this is this this
27:40
I have yet to see it say anything that contradicted itself in a single output
27:45
so each time it outputs it doesn't appear to do contradictions like 40
27:50
could easily do a contradiction and would just shamelessly be like yes so what but this thing yeah and then would
27:57
apologize you know I like oh sorry about that yeah sorry about that yeah yeah but you're like I don't want to sorry I want you to not do it but this one doesn't
28:04
seem to make those errors um so how did it go well really well um I got an
28:12
acceptable outcome which is which is sort of saying quite a bit actually um
28:18
and so what I'm trying to do here is to reverse engineer from the code I've got
28:24
in the existing repository to reverse out the the specs to save me having to
28:31
do the specs if you get what I mean yeah yeah absolutely so and and the plan I
28:37
have the approach these these are all the the
28:42
packages the code modules the Naps that are going to make up the core of
28:48
artifact um and so what I'm doing now is going through and reverse specifying
28:56
them so that I can then cut it into a higher layer where
29:01
the higher layer is uh reasoning about the interface between the modules and
29:08
the the modules as a whole and so that that should be you should get good
29:14
results from that yeah because what I can do there is using the concat tool that I made I can like uh if if I name
29:22
the reasoning for each module um read me then what that means
29:28
is that I can pull in all of the readme files as a dump so concat
29:37
[Music] um output dump.
29:43
empty and if I go star star SL star
29:52
dot did I Christ Mighty Star St
30:03
slash read me right you get what I mean so now I've skimmed out that layer I just now You'
30:10
got discovery that was Discovery yeah but now now I can edit those files
30:16
independent of the isolated development that that is derived from them which
30:22
means that this is this is sort of what I was getting at where I'm saying like Okay look all the read Mees across the
30:27
whole project of 5 Kil tokens you shouldn't there's no need to see the
30:34
whole thing all the time you know like in fact is is uh Folly to try the whole
30:39
thing yeah and so pulling in the entire code base of a module is an entirely
30:45
reasonable thing to do because you've got the um you've got the spec for the module you've got the code for the
30:51
module the tests um you got some documentation all those kinds of things that's relevant for the model to
30:58
consider as a whole if that ever goes above 128 kiler tokens I'm like what are
31:03
you even doing you know like it the module's too big at that point it's it's almost like it's um it's a good thing to
31:11
have a 128k limit right yeah I don't know why the limit is 128k but it feels
31:17
like more than adequate and it feels like your problems are elsewhere if you need it to be bigger like the the Contex
31:24
window isn't your problem and so um this
31:29
next layer is like the that's pure reasoning so there's no code there it's
31:35
just how do these things talk to each other what's their purpose what's their limitations and then what I would do
31:42
from that is I would connect this layer up again like do like a summary and
31:48
connect that up to the reasoning repo where it's let's try one layer and then
31:53
let's let's try that because it's only a couple lines uh to in okay so um you're
32:00
in reasoning yeah you this is an AI this is not command line you're saying so um
32:07
say if uh give me an operation of an artifact
32:12
to doesn't matter which one um so you want to take the top level reasoning of everything which is incomplete and then
32:20
you want to say give me a which yeah um which tool can help me do X where X is
32:28
one of the artifact tools and uh well I [Music]
32:35
can which tool oh it's they're not really tools
32:41
are they like which module is I got a better idea what about what is a nap and
32:50
which module if any creates them or manages okay the
32:58
format right that's a good that's a nice good have a
33:07
look um while we're waiting um Sora was released today I'm not sure if you saw
33:12
that I tried to use it I'm not allowed to use it in the G in UK oh cuz you guys
33:18
have got oh cuz you yeah sucks to be in the
33:25
UK yeah about that no cuz um it got flooded by everyone
33:32
trying to log in so um this is actually part of our Pro subscriptions like we
33:37
get um unlimited use of Sora as well like the pro subscription is sort of a
33:42
bit of a bonanza it seems I'm I'm hoping that uh the fact that the UK is uh
33:48
locked out is uh not for legal reasons just for roll out is that a pigasus no
33:55
it's probably yeah there you go so the thing that um struck
34:03
me about this and and it sort of makes sense at least to me why they abandoned
34:08
image generation is because one of the ills of image generation is the reliability of
34:15
generating a derivation of a particular image yeah and so which need for film yeah right but now what you've sorry say
34:23
that again um well the whole point of the film is essentially you know 25 or 30 frames that are derivations right
34:30
yeah yeah yeah so so this not only allows you to generate Steels that have
34:35
good um good uh inheritance of the refinement that you're trying to make so
34:41
they're very um they're tweakable instead of with the current range of image generators you get this whole new
34:48
thing which can be quite frustrating um but the key like if you look if you look
34:53
closely at these images that are being generated here the the
34:59
key that I think is what they've been chasing is that these are physics
35:05
correct right like watch the sand under the Hooves of the pigasus oh H oh you
35:10
see that the water look at the ripples it's it's like the figured out
35:17
uh something about the way that physics works because all of these images have correct
35:23
physics it looks it's close enough for the human eye right yeah can't tell
35:28
where the physics breaks down like you can't analyze the physics enough um and
35:34
like look at like the reflections right that they're geometrically
35:39
accurate yeah um you know so what I don't think video is the thing that
35:44
they're actually trying to shoot for here it's physics that they're trying to go for because if you have a model that
35:51
understands physics enough then you can navigate the world well they probably already got um I mean physics is well
35:57
understood and well specified yeah but not not really um physics is not
36:05
well um it's not well tokenized dancing Sushi is weird Okay yeah but even look
36:11
at the shadow on the Chopsticks which are round right like it's it's physics
36:17
correct right even there's transclusion transclusion of the salmon onto the
36:24
shadow so that it was partially illuminated in the color of the salmon it was partially transparent do you do
36:29
you have access to this no cuz it got flooded this thing
36:35
stops this but anyway the point I'm trying to make is that physics is coming soon like this video is just a gimmick
36:42
but that is physics uh yeah but again uh taking a
36:48
step back um by physics is just a well-formed body of knowledge which um
36:54
they are imposing on a lower level of output no no no no they've learned
37:00
they've learned physics physics is physics it's not programmed in it's the
37:07
it's um it's inferred just like it didn't get yes yes no I agree with that that's
37:13
different that's different yeah yeah that's what I'm saying that's very different but the um the thing is the
37:19
the output the images uh so the reason I was hoping that you had access and hopefully will in the next few days um
37:27
I'd love to you remember one of those very first Pixar uh R tracing um films
37:34
with the angle po lamp yep um now if
37:39
they can get that right because the whole point of an angle Poise lamp is it's got you know I think it's called
37:46
umbr and it's the uh you've got the um Umbra you got the sub Umbra uh so the
37:53
bright bright bit the slightly less bright bit and you got reflections
37:58
it is incredibly expensive to do that now if they have learned about that or
38:04
if the models learned about that or iner that well like what lighting technique
38:09
do you find a miss here right there's ambient occlusion there's reflection
38:15
there's diffusion yeah right there's it's um what you would typically use
38:23
textures for like this thing is it's um it it might not be completely
38:32
correct uh in that rracing will be completely correct no ra tracing raay
38:37
tracing is actually not correct because raay tracing doesn't capture
38:43
movement like these guys it's it's not just the lighting that's correct it's
38:48
the way the mass the the the subjects have mass you know
38:54
like ah oh serious yeah I mean we're not just talking about light here it's not it's not a graphics engine
39:03
it's not a graphics engine but it it does it has physics right it has physics correction he's got momentum right he
39:10
has and it's you know um his upper body he's got sceletal structure you know
39:17
like and that's that's better than map right like it's not is better than map
39:23
and uh and like look at that rug like that's like someone's fluffy ass
39:28
rug with f man um I uh I reached out to an old M
39:35
mine uh uh Chris vandero um uh about
39:41
four or five months ago and saying you guys better be paying attention to this because you're going to get uh games
39:49
yeah this I'd say that Sora is just the beginning of a physics engine actually
39:55
and that I don't know how it's going to be delivered to us exactly video is not it but
40:04
actually uh being able to generate like um parts or mechanical
40:10
assemblies um being able to iterate on them using using generation you know
40:17
like that sort of sounds like what's coming yeah I agree with that but um um I'm seeing something um above that so uh
40:25
the email sent off to Chris uh and I'm sure he's he's working on this um but
40:30
the point I was making is if you add in for example the reasoning on uh the
40:38
world uh in a similar kind of you know um structured way that we're doing reasoning on an
40:45
app um then a game uh can be generated uh on the Fly that is you know like
40:52
Grand Theft Auto Ora yeah so so the the
40:58
basically yeah the winning hit there is going to be like you know how we talk about having this um live companion
41:04
that's listening in while we're talking it's transcribing and it's sort of doing yeah so the game would have that and it
41:11
would be the game would be generating ahead of you based on how you're doing and how your how your friends are doing
41:19
and that's it'll be feedback generated so it's not like it wasn't ever programmed and written to a city ROM
41:26
it's like it doesn't actually exist until you until you go into it now now
41:31
this is not something that we should spend too much time on but is fun so all right so let's let's bounce out of it
41:37
then well uh just one one or two minutes uh on it uh because I think it really is
41:43
fun so um uh you know if you uh did uh uh is it
41:51
possible yeah is it possible to park it and you could write that down in the inventor's notebook or something cuz
41:57
we're both very time constrained here yes yes all right good good point well made yes okay so here's the output from
42:04
that question you put in it took 24 seconds selfcontained standardized
42:09
application package defined by strict configuration R such
42:15
as having a nap do is export nap Tool's module out lines and en forces why does
42:22
it not say that the nap is a conjunction between a Json and an NL
42:29
description wonder why it's not picked that
42:36
up maybe we have I yeah well no like I mean you this is not complete like you
42:42
just asked me to give it a question it was in yeah no no no um the the point I'm making is uh that's a render okay
42:50
and I've just spotted a h yeah but the that's not really fair cuz like the input data was incorrect like like if I
42:57
if I go back and look at what the actual um so it picked up that the module in
43:03
charge of that was the nap's module and then if you look at the read me for that
43:09
um you know this is all it had to go on right which isn't I haven't you know
43:16
like that's really not that's not that's not done no no no
43:21
the process is uh powerful so anyway all was trying to
43:27
show you is is where I got this tool um so that I can help you get going with
43:34
it um Grant right so um first of all
43:42
thank you for that too and uh other than my own personal meat brain
43:47
reasoning uh yesterday feels like a bit of a waste of time now because I was trying to do
43:53
something similar and know get great results this was you needed that tool right like you needed that you needed
43:59
that dump the ability to dump it yeah I didn't I didn't even know I needed it and it's like oh man that's brilliant
44:05
yeah so give me um when you use it just let me know if you want some changes uh to it and I'll um I'll go in and make
44:13
them uh where does it dump to what's your you have to specify the output file
44:19
um but I've because you just go
44:24
Um um Dash D output and then you specify the file are you in cursor here or are
44:29
you in something else I'm in cursor here yeah okay all right and yeah it even gave me like a
44:36
party emoji at the end which I [Laughter]
44:43
thought I wrot a dump yeah I mean that's cool quite nice
44:51
um uh what else was there so I'm sort of like a bit um stunned I guess cuz I'm
44:56
like well now my job seems kind of clear I have to go through all these packages
45:04
and reason reverse reason them so that I can reason across the whole
45:11
lot well interesting enough um uh year and my job seems to be
45:17
converging because uh what I'm working on as we were talking about last time is reasoning about reasoning and you're
45:23
reasoning about code m seems to be very similar um yeah yeah yeah yeah um so
45:32
where does that leave us um it leaves us in uh just doing it so um unfortunately
45:42
I'm going to have to fix this I still can't show my computer screen up here for some reason I think it probably
45:48
update something wrong I don't know I'll check it um but uh so what I've been uh
45:55
doing is taking the uh definitions which I hand cranked around the
46:02
cycle um and then um uh cut and pesting
46:08
those which this concat to will be hugely useful for um but I was getting
46:14
poor results into okay so what um for for any set of definitions what are the
46:21
top level rules so I just decided out blue sky that it had to do with the three sees like well what else is there
46:30
all right okay yeah um be careful with that cuz you could go on forever there
46:36
we only really how will you know that you've made an improvement in that area like what is the what is the area of
46:42
exercise where those um iterative improvements are applied so that we can know that we're actually getting
46:48
something somewhere getting better well without evals all we got renders so I'm using renders what yeah so what renders
46:55
are you using um I just I've just thrown up a um uh kind of proxy te test bed uh
47:05
around the CRM um and then I'm trying to make changes as a CRM would do um uh you mean
47:13
like what kind of changes like um modifying a customer record type of change you mean no um so we've got the r
47:22
um so we got the uh schema which comes from the definitions yeah I've uh uh
47:29
just got a whole bunch of synthetic data um then I'm changing definitions and
47:34
trying to figure out um how to get it to reason about the impact the the
47:41
consequences and unintended consequencies on the end data based on renders that's that's the rout I'm going
47:47
down at the moment might not be right but um where
47:52
where yeah where are you trying to get to CU I'm uh still have not had fully delivered from
48:00
you the gaps between cursor and the reasoning workbench that you want yeah
48:07
that's because I don't know them yet in order to be fully uh coherent but but
48:12
you know you know some of them right yeah uh and we went through the ones that I knew yeah can you Can you capture
48:19
them for me so I can have them in a in a file somewhere that I can yeah yeah sure reason about
48:26
I'm doing your job yeah yeah yeah but um so uh I think yesterday
48:34
I said it was probably going to be two or three days um this still helps a lot
48:40
but that's that's the r I'm going down it's like it's very difficult to reason about reasoning without something
48:46
concrete yeah I'm just well I mean I'm maybe that maybe it's premature to be
48:52
reasoning about the reasoning because like what
48:57
okay I only spent a day on it but what's taken so long for me is I'm still trying
49:04
to figure out the process as I go of how to like reverse out the specs right yeah
49:10
that's that's basically what I'm doing reasoning like you know how do I how do I change something but maybe maybe it's
49:17
too soon to know enough about how to even do brute force in elegant
49:23
unassisted reasoning maybe it's you need to do more of that before you
49:30
can tackle meta reasoning it's a fa
49:37
point it is dangerous what you're attempting it is very dangerous because you don't have any anchors to to stop
49:45
you going too far or there's also no direct benefits from the work that
49:51
you're doing because the next layer down is things like the innovation
49:57
reasoning um the decentralized AI reasoning the interfaces reasoning yeah
50:04
um those things those things can be done without meta reasoning they can be done
50:09
without meta right yeah yeah what I was doing um
50:15
I think I agree with you actually um given the experience of yesterday and I'll explain why because I need to go in
50:22
um roughly 10 minutes 15 minutes is um the uh the reason I was doing that is
50:30
uh the meta reasoning is actually uh I think will appear really
50:37
small and that makes no that makes it even more dangerous because like if it's really small and you're not sure where
50:44
you're going you could cover a lot of ground and not find it so what's your advice
50:50
then my advice is to come one level down do do the Innovation reasoning do the
50:58
decentralized AI reasoning um do the uh there was
51:06
another there was another component that that slipped my mind but we listed out
51:11
what the um what the domains were right yep
51:18
yeah yeah um if you do if you do the even if you just did The Innovation and
51:23
the decentralized AI reasoning using 01 Pro which will give you a far
51:30
superior result to what we got out of basically Claude is looking like a all
51:37
right okay see what you're saying um like you have not hit these things with Pro you have not hit these things with
51:42
like $5 worth of tokens to get a oneliner answer back you haven't hit it with that kind of machine and so if you
51:51
do that you will first of all learn about the process of reasoning as a play
51:56
the new tool that's arrived for us um as well as moving yeah age but I I I
52:05
benefit from that I benefit from that directly because I'm about to catch you up I'm about to I'm about to run dry
52:13
because I'm like well I've I've done my part and now where's the rest right CU
52:19
right and that's that's kind of silly that's kind of silly cuz my side is a lot of code and it was typically very
52:24
slow but I'm about to to catch up to you in terms of where's the SPs because I've I've made these modules made these
52:31
modules aren you yeah and I'm like where where are you where's where's the where's where's the reasoning domains
52:37
that I need to clip into so that we can merge right okay no that's that's that's
52:43
that's straightforward enough um and uh yesterday was was uh useful work uh and
52:50
I'll park that um but really what you're saying just to reflect back make sure
52:55
understand this is that's I'm working inside of each domain yeah and using uh
53:01
my meat brain as The Meta Reasoner for yeah yeah yeah and then yeah at the same
53:08
time I also need to know if you if no I I need to know from you what are the
53:14
shortcomings of cursor as a reasoning workbench I think that that question is
53:20
um no longer as relevant as it was because now we're using o1 Pro and nothing else but yeah the the the the
53:28
general gist of it is like okay I've given you this this um cation tool or
53:34
concatenation tool fine what what else what other tools you going to want cuz I
53:40
need to figure out how to reconcile that into the things build I can't remember
53:46
the last time you asked me to actually add something to your stack I'm going to eat you I'm going to
53:52
I'm going to I'm going to wipe you up I'm I'm going to overrun you I'm going to overrun you at at this I will overun
53:57
you no no no I'm way Ahad no I'm not a wead actually you're not you're actually behind on my shoulder you're you're at
54:03
my shoulder yeah yeah but I'm also coming with code with running code that
54:08
can amplify the effect so you're going to get overrun unless you hurry up and deliver on these on these Central pieces
54:15
all right so what I suggest then is today what we'll do is uh again we're running out of time Mo want to leave a
54:21
bit of time to do an upload and like a we'll cut it we'll cut it
54:28
there no no no okay premature okay um yeah what I want to do is State uh um
54:34
because it's very useful in this transcript yep um just to be clear today
54:40
what I'm going to be doing is using my own meat brain in order to do the meta
54:46
reasoning in order to get the definitions of the domains that we mentioned yesterday yep and uh get some
54:53
kind of cycle out of that which uh will be manual in my head yep um but then at
55:00
least we we we get a bit of traction and uh in order to do that um the very first
55:06
thing I'm going to do right after this and hopefully before you H go to bed in case there's any snacks y I'm going to
55:12
get this concat tool installed and usable sweet so so I know have have that
55:19
if you do that if you do that I promise you that the meta reasoning will just be
55:25
trivial at some point in the future maybe a few weeks from now you'll be like oh that's easy and you'll just do
55:31
it I I think you're right and uh yesterday was quite painful during it uh long form so I'm very happy to done that
55:39
all right so I'll I'll uh I'll I'll stop the StreamFile 1: Condensed Transcript
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

