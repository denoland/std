okay you're on so what's going on okay okay so uh um yeah we've uh got the um audio
recording from yesterday but I be continuing to use it now yesterday oh shine okay what
is not found what what oh cuz it's a Mac or something huh no no no no it's
because of this me Quest out computer is there what you mean not found it's
sitting right here what in okay it doesn't matter right you need to do it um what am I doing uh if you go to well
I can describe it first right so um in this iterative
Loop uh okay so for the recording um because it was a voice recording
yesterday the uh key thing is working on definitions and having um the components
and the Imp ations derived from it um which
amplifies your mistakes in the definitions and that allows you to go back uh and look uh very precisely at
the definitions and change them slowly and then you uh generate the new set of
components and it should be obvious or is obvious to me actually in doing this
um up to um well including context diagrams but generating podcasts and so
on your mistakes and the definitions jump out but the base Rock of the
definitions is the thing so sorry that's just for the recording for anyone who wants to uh care um if you go to that uh
Docker just committed uh to dream catching the it's on the link that I sent uh last night or this morning
whatever it
is in dream catching uh yes yes calm down calm down I'm getting you C down hey hey C down sounded very
scous sorry you probably no idea what Scout is I SC no I can guess some from
Liverpool it's not dery it's uh some
what it's a bit like seeing
okay right so um in this feedback loop uh I wasn't getting um a derived context
diagram now a couple of things um although we've been using mermaid
mermaid is doesn't um transform well uh
the models seem to know well but often make um syntax errors and so on however
what I've done is switched to uml 3 um plantex uml um in terms of what the information
is inside the definition however I haven't told the model that's what I'm doing but if you scroll so that that's a
that I have opinions on it
the I observed you getting a lot of syntax erors from the uml diagram
anyway too right uh those those are um uh I don't think I've had an error
for like a couple days yes in in the link that you shared with me there was
an error uh was it oh it's probably because it was end day and I am there sometimes
copy and paste errors I apologize it was not a copy paste error you sent me this
chat in this chat was lengthy but it
had multiple render issues and I can see your text here saying things
like hey this doesn't render ah right okay it's not rendering
check the syntax assume I copy and paste screen no no hang on hang on the issue
is that no matter what diagram syntax you choose you will always get a r error
yeah probably okay now the the key to that is something that we worked out a while ago which is that
um if I feed back in the errors from the diagram
rendering then the model will get it right possibly in the next go worst case
in the third go because it knows about syntax errors in that
language yes and so what missing here what you're missing is that code module
that does that little Loop for you right but changing changing um diagram
languages is not going to help you the thing that the thing that will get you
the best result is the popularity of the language and the verbosity of the
rendering errors that it generates okay so um uh I didn't choose yourl as uh of
rendering um and I know that I said the exact opposite about few minutes ago um
you see how that might be confusing uh EML uh
V3 is uh uh I think uh and this might be
this is probably personal preference um but it's a more complete way of looking at a system from different
vectors um why do you need to look at it from different vectors when you're trying to get I thought you were trying
to get a set of definitions and now we've got this uh relationship diagram
has crept back in what's going on uh the uh the reason I need different vectors
is exactly what we're were saying before a vector for example is also generate a podcast generate a blog post so that can
see what the errors are in a are you are you so let's name let's
name those things that are like podcasts um code um a uml diagram are you
considering a uml diagram as one of those derived Works uh yep uh and so
what are we calling those derived Works derivatives amplifications well Expressions they're like renders aren't
they consequences deductions yeah yeah yeah so all of it
is take the definitions and they just me uh whatever it is yeah so what's the
name of that type of output let me show you anyway while you ponder that cuz the
fact that you said um says you don't know well renders is quite reasonable
renders yeah that's that's cool oh let's just ignore my doodling about how to get
rich there um
so I want to turn what you said yesterday into a blog post because it's
sort of our blog post charts our Milestones mhm naps as a
milestone um I want to engage with you to figure out naming and um agree on
design or or reasoning of the basic the thing I think what we're talking about
is a Reasoner workbench I think that it's based on three principles the internal adversarial
refinement of Base knowledge based on the principles of Reason which is which
is to say that um given just the AI
model and your and any given set of Base
knowledge with um a preset set of prompts that are that are
sort of apply to all kinds of knowledge like is it internally consistent is it
complete is it um yeah all those things is it
orthogonal like is it is it separate you know is there no overlap all those things can be used to
internally refine the knowledge to be
referential yes and uh using natural language if you are tight enough with
the language you can get something close to you know even formal uh lemon Logic
for example what is lemon logic uh um what penor pins uh T of T all all that
kind of if this then that um if this then definitely not that um did you mean
lur like l u m u r uh Lon logic uh lemon logic's not
showing up in my Google uh
lur is it I can't remember it's been a few no no it's not lemur is lemon lemon
maybe leemond might be oh let me check
leemond let me check because uh is like the
um uh structure of the um of thinking
really um okay so all right so
there's different terms for that that are approximate I'll try and get away with some of them like propositional logic modal logic temporal logic those
types of things right you're saying that basically with enough internal grinding you could get your base knowledge down
to some form of um almost a mathematical expression but but not quite because we
actually don't need it to be like that right yeah um and also the interesting thing is the top level is uh
the the kind of the meta things the definitions if they are um pick your own
logic schema there's there's various uh but if they are internally consistent then you get uh really good
results out L side if they're not it's probably because you okay I know that um
I'm kind of saying that for the video yeah please stop saying things for the video that's my time that's my time
you're burning you can make a video of your own if you want to talk to the video
but you're here to talk to me I'm here to talk to you I'm like you want to make a video go make a video I don't want to
sit here I feel like I owe you 60 seconds of your life now back it be more than that buddy be more than
that okay right so you're you're yeah so number one yes it's got to be
um yeah so so the principles the princip that I see um based on this Loop that
you were working in the first principle is the the maximum refinement of the
knowledge itself based on the theory of knowledge um number two is generative
amplification of that base knowledge into renderings that um we humans are
very familiar with where the the the the process or the the mechanism being
employed is to amplify out what these um
what the base knowledge is so that we as humans can detect it when it's been
magnified um and then the third step is the refinement of the base knowledge to
pass um to pass uh errors to resolve errors in the
renders and that's the key and then you Loop over and you're like right back to
the internal refinement and then more generative amplification and then fixing
fixing the renders again and again and again right yeah yeah now uh there's an interesting
thing that maybe we don't want to put in but on step two um when generating uh
from the uh the Bas Rock definitions podcast it is calling out to the um
uh the Kent space of llms so it knows about everything in the past and so it
can reach out in order to point out stuff that you said completely stupidly
so number one completely you know completely correct but that is quite a
useful thing oh yeah that's different day um so
okay um but if all you want is to have it
internally consistent that's the loop if you want to uh externally consistent as
in right so it's not just for the sake of being appraised by a human you're saying there's also some benefit in the
llm doing some appraisal um of itself as it sort of dreams about these um things
like a podcast like how does it affect climate change like all and while it's ning to itself it can
realize that some of its uh definitions are too broad need narrowing um yeah
yeah contradict you know if it goes you know off on one and saying ah with this
system you can uh create a new um primary color it's like how do you get
that um so you can be internally logically consistent and
wrong um by adding that kind kind of external uh part um it becomes blaringly
obvious but the key is the amplification because it's quite hard Beyond any
simple uh simply comp above a certain level complexity it is uh increasingly
difficult and often impossible for a single meat brain to actually figure out in advance in one shot all right so and
then what I also want to talk about in this blog post is that
um the process continues for multiple renderings
multiple render Loops um
and multiple people can submit errors
and renders now this is the key thing because if you if we can transform this
into a social activity where there's a instead of based knowledge it's like the Ten
Commandments that's where you get the forward looking the the human you know and then we get two people like you and
me looking at renders either the same renders or different renders or we're
jiggling and prompting the system to be like hey why don't you make a podcast about the automakers show in Germany
relating how the dream catcher works there so we're sort of like you know poking prodding getting renders and then
in individually we're spotting errors in the renders and now it's a team exercise
that we're doing that um that modifies the base knowledge and that I think is
the kicker like that's the exciting thing and the thing with human brains
are uh because of the amplification what you're uh checking against is your your
gut experience of your entire life and you go no that's just not going to work
M but it is derived again because you're only working on one thing which is the
base Rock Bas knowledge yeah and so in this case the stuck Loop would
be where you detect an error in a rendering and then the bot can't
automatically solve it and so now it's stays as a stuck right yeah yeah yeah
and uh there is no limit to the type of rendering because we've got the um the
definitions the base Rock and if you wanted to you know produce through AI
say an entire Netflix series and you're sitting there and going how did it come up with
that so so what does this mean for us then
this thing um well like we got to capture it
right we got to capture it in a blog post at the very least yeah and we got
actually build it yep so uh you were talking yesterday about uh a workbench um yeah the
uh um the the workbench is essentially
would be uh a set of pipelines I'm guessing to produce renders from uh uh a
single Bas Rock definitions document how does how does it relate to
the dream catcher um the dream catcher uh well this is a
this is actually outside of the dream catcher this is a very useful
Paradigm does it bother you that we've come up with two useful paradigms that are outside of the dream catcher uh um
no it doesn't no why not no no cuz um uh why would we want to stick everything
inside the gym catcher and overweight the gym C C the dream catcher is really quite simple we wouldn't but having
having come up with two separate things in the last month that seem wildly
valuable outside the dream catcher after practically nothing in in 2
years one might be forgiven for suspecting there's a third on the
horizon and maybe there's a lot of things outside of the dream catcher that are also valuable I'm not sure thir but
I would say that it does indicate that we're walking on F fertile soil at the moment yeah like anywhere you take a
a plant grows so yeah all right but that's a different kind of problem in
itself because fertility means the hordes are coming yeah
um now but you said doesn't relate to the dream catcher but we agreed that
there's a stuck Loop here and a stuck Loop means the dream catcher right but the the um the reason
I'm saying is a paradigm uh the stock Loop doesn't necessarily enforce a
rendering thing is but that that's just why would this not be like any other app like this
is not this is not fundamental to the dream catcher this is just um yeah yeah
this is this could be the render fallacy Checker this is this is
how we think that knowledge is best handled yeah using an AI yeah and that
nap um uh we could build well we would build that inside of the gym catcher but
the gym catcher attribution contribution is uh a system the nap is a thing and
it's there for people to use and discover and maybe they do maybe they don't maybe they got a better
idea um it just seems like a a really good use of the dream catcher like it's
hard to imagine how to do this without the dream capture for that refinement piece given
what we're trying to extract which is the internal workings of human
Ingenuity um well uh always feel the slight danger whenever you know um we
talk about it's hard to imagine sitting here in a VR world you know uh in our
english- speaking countries maybe there is a better way um the thing is uh it is available and
we're going to use it and seems pretty powerful and okay well yeah I guess it
doesn't actually matter if it's in or out of the dream catcher we're connecting it to the dream catcher and we're building the dream catcher with it
and that's yeah it's definitely an nap it's the um the workbench is definitely an app that's it's definitely an nap
right like it's not it's not below the nap line and it's not below the dream
catcher line it's like it's a nap that can be supported or connected to the
dream catcher yeah I guess in sight of the uh if we talk about um uh its relationship
to the dream catcher uh We've uh discovered uh um a paradig that seems to
work and is now stuck because we don't have a workbench for it that's a stuck we're going to do that um that is
meeting to veg for the gym catcher is no different from any other nap yeah
okay it's a beefy one though it's a nice one it's a beautiful
one it's a beautiful one it's the answer to how do you use
AI yeah and uh that rendering thing
uh uh is uh really amplification through
render amplification and you can spot it um is UN Unlimited in terms of uh what
are those renders how how would you use this
system to reason about the customer section of
the CRM and how would you use renders to improve the
CRM um so the customer what do you mean by uh be more specific on the customer
bit the first one because there's um well the CRM includes components like
routing and accounting um invoicing what I wanted
was to just narrow down the scope of that one and talk about how it relates to just the uh customer recordkeeping
piece of the CRM customer record keeping piece okay so uh the
render um would be uh one possible render uh would be to um have a bunch of
uh naps that are available for that render that are personas um that we talked about before
really grumpy person really happy person or someone who's actively trying to hack their system um and then probably get
the output from that one into something that's more consumable uh like um a report or a blog
post or um an adversarial conversation ation between two people talking about a
situation uh because that's where it really pops um so um in that case uh if I
wanted to uh improve uh the system that I've got available um I would take as much
information reward information as got possible train a bot or tell a bot about this you are grumpy you are nice you are
um a hacker or trying to get cash uh nefariously um interact with that
generate um a whole bunch of um scenarios get some isn't isn't actually
isn't this actually the way that you would build the CRM because you would
get the customer the um the commissioners of the system the actual business owners to lay down their
internal rules and then you'd run the internal adversarial loop on it to polish it up and ask some
more questions and show what holes there are like before we even get going um yes but the amplification piece
yeah yeah so if you let me finish I'm getting to that so then um what you do
with that is then the rendering would be user stories that the bots made and then
the humans would correct the user story which would cause the bot to update the
top level business rules in order to fix the user story um yeah the user user stories
would be uh another render uh yeah user stories are just a render and yeah and
the the commissioners of the system can talk to the user story and correct it and or or they can ask their own one and
be like tell me a user story about blah blah okay what happens if the customer starts swearing on the phone da d da and
then they sort of say what they would expect and then the this Loop here fixes
the base knowledge to make the rendering appear correctly and it's
actually if you look at it in that light that's just simply system provisioning I
suppose um it is but uh well yes it is
um I'd add to that um automatically changing the base uh needs the the um
the test suite behind it of things that you you want to have but remembering
that you can change because of um changing environment you can change the
uh uh the definitions and break some tests and that's okay MH um and so in
the same way as a test so your TPS report um is another thing that uh this
Loop can do if you can amplify the TPS report in order to uh give you an idea
about whether broken or not is the TBS report or the the list of tests that we were
writing the evals are those really just examples of [Music]
renderings um yeah now we see it like that yeah yeah and the expectations you
have of the outcome of an eval is the correction you're making
upon on the the rendering and you're saying that
the the the base knowledge which includes the system
prompts for the Bots the Topography of the Bots all those things that needs to that base knowledge
needs to be changed so that the eval passes um yes um
however uh it's more more subtle than that if
uh uh previously I've been banging on about Monte Carlo uh I'm starting to
think now we've got the this amplification uh process uh Monte Carlo is looking really quite dated um mon car
was really there in order to say give you some sense that you can get
into uh a large amount of outputs and here's really what the um standout thing
why would you say that Monte Carlo was dated um because uh if I were to um uh
if I were to say right we've run the tests uh you made a change we've run the tests and we've gone uh 70% Assurance uh
95% probability that the tests have passed um inside of the TPS reports some
tests might have failed now other tests might have passed that were previously done um you've generated new tests in
there um and so that's really quite a a gross kind of explanation of it um
however if you have an amplification through wherever your your uh um preferred thing is um uh that just
points out or makes to stand out to your meat brain uh the weirdness or lack of
weirdness of the change that they just made you might actually want to say this change that we've made uh okay so now
hope of tests fail but actually the whole thing is improved um I give an example say if the
CRM I don't need I don't I don't need an example I understand okay got
it you see what I'm saying though it's just another amplification I see what
you're saying I'm just um thinking about it
because um because the evils seem different
somehow but I'm not sure exactly how like it's almost like you're
suggesting or you might have been suggesting that why Monte Carlo feels outdated is
because if you have supremely correct base
knowledge that's better than this Brute Force assurance that we were previously
chasing using evils uh sort of um what I'm saying is remember yesterday
we were talking about um EI uh and evals and Monte Carlo are all
can only deal with what's known and humans can only deal with you
know what's possible or what you know the future so mon Carlo
evals uh llms are all backwards looking um the humans the capacity to
whatever Consciousness oh okay so so really it's it's it really is two modes of testing that are both valid and
necessary so evals evals would be a way of um getting system Assurance but renders
are a way to explore the frontier or the the refinement the Improvement they
pushing forwards of the system by allowing the humans to add increasingly more
precise uh restrictions or constraints or requirements upon the system or or
dropping previous constraints because you know change is better overall
overall yeah okay um and it's that interface between the two because uh
take even a re reasonably large report 9 page report uh me brains are just
getting not going to read this now you could put that into Ani but that's only going to be backward facing with the
report uh and so you're going to lose um that thing now if you find a way of rendering it um so that amplifies the
weirdness we're not asking the AI to define or find the weirdness you're
sitting there listening to the podcast looking at you know the chart and going
that's odd or in VR you know in a field of you know Financial results and
there's a a big hump over there and you go there shouldn't be a hump over
there is that a good thing um what in any way you want to render it uh you
know you could even render it there's uh there's a great um uh for example um
in uh uh astrophysics um rendering things as
sound um allows to pick out really clearly
something OD happening in data you would just never see it and that's another form of amplification that's right
that's right okay so the Reasoner is really
about using AI to amplify domain knowledge to allow a
human to refine it um with greater precision than they would do at a one:1 scale
which is how how we are actually all currently used to processing information
is for the most part one for one yeah but amplification is where we see
um the far away effects of tiny tiny
errors and this is like a a magnifying glass upon the base
knowledge where our key operating assumption is that the cleaner your base
knowledge the more correct your lm's responses will be yeah and that based
knowledge is the thing that you're working on okay so it's like a car that doesn't feel right when you're driving
it yeah it's like what are you going to do about that well I don't know let's get mechanics look at it and says well
what do you mean by it doesn't feel right uh yeah you're working on a car so
then how does this relate to money how can how can we stake
against the quality of the base knowledge so that because what you're
saying what you're saying with the mechanic metaphor is that you don't know exactly
what's wrong but the mechanic does you pay the mechanic because he can amplify
the system and and has more experience and knowledge of your car than you do
and so how do how can we translate that to say well here's a system we've
Amplified it out to the ends of the Earth and we've sort of refined it
endlessly you if you want to trust it for something important and you want our Assurance of
it you should pay into like an insurance pool or something like that so how do
you stake against the quality of the base knowledge how do you offer an
assurance in monetary terms that this system is it's good to
go H that's interesting uh so the reduct here on that and um would be uh the
system is um absolutely pans all it does you know you asked for a fast trading
system and all you get is 42 every time you run it yeah that's right that's
right um and it's like how' you go from there you don't need to render it too many times uh is doing so how can yeah
how how can we I guess how can we express the level to which the system
has been exploded out via renderings and corrected so that I can look at a system
or an nap and be like that score is great in this metric
it must be good or or it might be a case of I'm like well I really need this to work and these guys assure
me that it will so if I pay 50 bucks in and it fails they'll give me two
grand yeah um I uh as um old phrase I usually use when um I
don't know the answers good question we asked all right well we'll park we'll park that one then cuz that's that was a
curiosity that insurance would be um the obvious one on that one isn't it uh so
it's like um Insurance transferring risk we make a statement um there's a risk
that that statement is incorrect for example this nap does that um and uh the risk usually is
um on the uh on the buyer buyer will beware but they can Ure and getes that
um which would go through the gateways at the moment
I I feel a little bit like we got this great thing now we got two great things
and now we're a little bit um we're a little bit lost we're
overgrad um yeah like we have you can actually drown in Good
Fortune and yeah the thing is um I was saying yesterday uh this is slightly
honorous but um very practical to hand crank this whole thing um and actually I
think that should be the way we do it to start with um and uh prioritize the
stuff that you're doing anyway around the Naps because as soon as we get the Naps yeah we need the Naps right
you know there just no getting around that one yeah so it's a matter of choosing priorities this is a great idea
which I continue as a paradigm um in the the background maybe I'll you
know figure out something that improves it or maybe I'll figure out something that breaks it uh but there's nothing
stopping me going on okay because cuz what why I'm looking at it um with Keen
interest is to make sure that the features of the NP platform can support
it and support it early as well so that's oh yeah um it does doesn't it
everything we've got at the moment is um
uh essentially way um well it's if the if the platform was here right now um
and we had the API links in or whatever we could build uh exactly that Loop that
we were just discussing um in a top level nap that called other naps that gave you back whatever it was um you
know here's your rendering this here's the rendering this have you got any problems um and it's like that's weird
uh okay uh let's look into that is that stuck possibly yeah okay
it's a stuck and then there's the kind of Discovery where where is the stuck everything in the structure in the Naps
um would allow that to happen now not straightforward to build all those naps but the structure I think is not begging
for anything in order to do that unless I'm missing something really obvious it just seems yeah we could do
that it would yeah be really interesting to do it I just wouldn't want to miss
anything that's all um what's what's your back of your mind um other than
straight anxiety about uh fear of up is there anything that you're
thinking this area is a bit Loosely defined inside naps right which which
area inside of the Json um and yeah use of Json with natural language uh
instructions. MD is there any niggles anything niggling at you because it's not the
first time you've you said oh is this going to work and I'm blly saying yeah
as it's advertised it would be great I could build that um um the the issue in mind now is
um because the um the adversarial component
principle number one requires a lot of looping and looping
is difficult to present to the user
because you know how do you show how we got there if the user wants
to you know perception if it Loops for 30 is uh right right well
no um that would be fine if we had a way to present it and
then you know that's kind of that that is actually a lot of data like that's a lot of system
calls generating a lot of commits cuz that I guess that is true
value but I uh it it it makes a lot of permanent data
it's the sort of thing you kind of want to been periodically or throw throw
out mhm um because yeah it's just it's
working it's just um it's transient yeah so that that's probably
the only um so it's when to garbage collect I guess or how or when when to when to
throw away the back up tape yeah there another way of thinking about it when do you overwrite the backup tape well
exactly well uh ideally never yeah but people usually go in diminishing returns
right uh let's back up back up um hourly and then daily and then weekly then
monthly then yearly and then you know uh every time it goes off the year that's
it when it gets done um and there's various other ways of doing it but it's an interesting question you're right
because throwing away information ideally it would be able to deal with
everything and keep everything forever but and then I think a bit of the
fuzziness I have is around [Music] um like right up till
now we've been working in the branch that the execution is happening but I'm
Shifting the model so that all the execution happens and then when you when
you reach reach a conclusion of sorts that's when you make a commit to the the
knowledge Branch or the the base Branch because those branches were just getting ridiculously
noisy and it was making it impossible for you to ever hope to commit back to
GitHub and have it be meaningful it's almost like I want to be able to check
out someone else's repo work on it on our platform using the Reasoner and then
do one commit that just has all these magical fixes and then push it back and they're like holy smoke how did that
happen and you're like well here's a link to all the working that shows all the tokens burning but you can browse
that at your leisure it's just not part of the git history lest we choke it um I think that's fine because it's
um uh the the question from the user level is uh how did you come up with
that as weird right and so I guess
that so the reason a workbench would be would
you imagine that there'd be a collection of files that was the base knowledge and
then a collection of renders and inside the renders folder there's like
different types of rendering going on yeah and uh this is a
topic I want to talk about actually uh but yes yeah essentially that and then and then inside the renders then now
you've got stocks being made where people are like that's not right that's not right that's really good give me
more of that you know like what do I do with those are they just files in that
repo or are they is there some more Universal storage space for stucks
because you want to share them that's um okay that's I think
yeah uh I detect a really important question there could you restate that again please when I come up with a stuck
when I'm using the Reasoner where should I put the file that contains the data about the stuck
should it be in with the rendering that it was against or should it be external
so that it can be um identified uh globally
um where does St go feels it feels like stucks are um a wrapper for a set of
events um that uh didn't work right but it doesn't um but that
rapper um involves uh say if someone's using something and and you know the
system did something erroneous that in itself is a type of render using the a live system like a CR M and you see
something weird that's a render um and uh the render
uh um in the uh in the human um the human goes okay that's not right and
flags it now the collection of data um that you need inside that stuck
is well why or how did we get here and I'm not going to try and figure out right now someone else can
but here's my reasoning about as I you know typing in natural language this is
not right because we shouldn't be allowing you know um aliens from Mars to
you know ask for collection I suppose that um
stucks so I've been planning to make the processing Branch be a totally separate
branch in this in this new design MH um and instead of being lots of branches it
was just one branch that held all of the computational threads within it um there
could be another branch of the same uh class or uh importance that was
all the stucks and so you had stocks that related to a particular um
repository were stored in that repository but they're on a dedicated
Branch because the stucks can't be in the data because they need
to represent a snapshot of the data right and and that
that speaks to um the kind of what you're going to do if someone says right you have to it got gun to your head you
have to solve the stock it's like right okay tell me about the stock what's what's the process uh and
it can't be just the human reporting ah we shouldn't be collecting um refu from
Mars uh because you got a complex system here how did it ever even think that was
a good thing so you're going to want the context you want that snapshot you going
want to be able to replay it you going to want to sandbox it make changes to
the system at that point and see if that fixes it do that I guess to to make things
simple I could just put the stocks inside the pro processing Branch to store them in their own folder
there yeah but it feels like stucks are um they seem like a dedicated a
dedicated thing that warrants its own like we're sort of agreeing that processing is separate from data right
like we're saying that the processing is all the computation and calculation and we're keeping that separate from the the
output or the the products of that data of that computation sorry yeah yeah and
then it feels like again separately again is all the stucks which is where
the computation could not process the data in some way and so that's neither data nor computation that's like a this
sort of like exhaust Port where it sort of spits out this it's like the entr the
entropy hole where it's like whoa whoops and then like the garbage shoot where
it's like and out comes this thing and you're like that's a whole another um thing but that that makes it
um that makes the dream catching now deeply embedded in the nap
platform because if the nap platform knows how to generate
stucks then the NP platform depends on the dream
catcher I see what you're saying uh
yes uh and actually that answers one of my questions that's let me think about that um because you'll see from
uh um well not on this one but on the previous one um
naps uh seem to sit outside of the dream capture platform uh
because naaps are reusable in other platforms but um you know you could take
a nap uh make your own um artifact make your own you know so on
and then run the nap because the nap is a format right um uh however what you're
saying is uh it's more tily uh linked to
stocks because uh if well if you wanted to expose you could just try zero shot
writing a nap down using the format no cuz well one way I think about St they
seem a lot like GitHub issues and so if I produce um an mpm
package then that's that would be a nap but then the issues about that nap would
sit in GitHub and so um that would be just a a separate
but related part of the dream catcher platform where there's just a weak link
between the nap and the wouldn't wouldn't wouldn't it make it more sense though um I mean the
essence uh
um is there a need for like um a library
platform uh which lists naps and
stucks uh yes includes the Stu uh loop but doesn't necessarily use attribution
and contribution if you don't want to and do it you're not going to get
anything for it I don't know how to separate those things out I think why don't we just try and lump them all
together and then see if that gives us some clarity on how to tease them out but they seem a lot more related than we
had previously thought like you can't the implication the implication for the context diagram is for example the CRM
now uh needs to sit inside of the gym cater platform very much so uh in fact
anything using naps has to sit inside of the that box yeah because because even though the platform is built using naps
the uh the features that the those naps provide are like critical to function
for all the other naps like the fact that the CRM can generate a stuck means
that it's connected to the dream C now we'd always planned that and we'd always talked about that and it could just
simply be disabled like if you wanted you know like we could treat the the ability to create a stuck just needs to
be configured and it's like if you want to make a separate way of making stucks or disable the ability to make a stuck
you just simply rewire the API that is the stuck
making API in your nap and you just switch it out or cut it off completely and you're
like there you go it's now unable to produce stucks
um yes uh because otherwise the Drey cat
platform starts luk uh very very centralized I know
well because the foundation give uh says right here's a a method and a format and
a whole bunch of stuff you could do and if you want to talk on um inside of the
Gateway network uh as a legal entity you you're signing up to use that um under GPL
whatever and then we've built the or robot army say built this dream catcher
platform which includes this lovely idea attribution and contribution and so on um but you're free to have you know Nazi
platform or you know a god platform or you know um it is decentralized we're
not forcing everyone through uh dream capture platform um because so long as you uh
agree to uh if you want to use the uh the formats uh uh available through a
Gateway the Gateway has to sign up to the licensing of the foundation and by
becoming you know a legal entity that's interacting with at least one gateway then you can use it in any way
you want um and then utility comes in Sharing naps between different platforms
it's like one platform is produced this nap it's like oh it's actually useful no you lost me I dis I disagree with that
but um I don't think that we need to resolve that just
now so okay where are we going though that's the thing like what are
we what should we be doing right now right like this this
Loop is great but dangerous
because you could probably study this Loop for years and still have more left
to study uh well we don't have to because remember
um very fact of it is uh this uh this Loop can be expressed as a nap um and
then we is us it uh someone else wants to improve it going actually you could do it better this way and that's that's
the whole kind of improvement cycle stock Loop so we don't need to do
anything else other than get uh MVP um kind of render Loop all right so
we have to have the Reasoner with a stuck
loop with naps running on a Json platform to be able to say here is
is our offering in the
world yeah pretty much um the uh the context
diagram uh to go about four calls ago um
was there so that we can start doing uh explaining this to the outside
world um at various levels and in order to do that we need to be absolutely clear
now this Paradigm uh helps us be
absolutely self-consistent um in explaining it to different people um in any context and
uh if there's something weird that will pop out and then we've also got that Improvement loop on it now that was the
whole point of the context diagram was out outward facing it's like okay now let's explain this and do some admin
like you know set up a Gateway set up gym culture uh foundation and so on um I
still think that's the right thing to do uh because you got a bit of time uh still to get the nap format up and
running I don't think oh I don't think there's what as expressed at the user
level if you count me as the user of naps um there's nothing that uh the nap
format uh is wanting for in the back end uh I agree about you know what is a
stock and where do you store that and so okay all right so we'll just we'll just jiggle our way through that I'll take a
couple of shots at the goal and then we'll just see how each one pans out yeah the
um uh I'll put a bit of thought into say if we had CRM
platform on this context diagram I'm not convinced that should go
inside of the dream platform dream catcher platform in this case is not the same thing as the attribution system
which is also a bunch of nabs um it is something else um it is produced
by using the platform but it's not the platform itself no seems to be external and that
implies that naps are also external yeah naps definitely are external and like
the contribution Ledger the attribution system that relates to stucks and users when they break out
into their different groups can be either you know just consuming naps or
they can be taking part in the dream catcher which is the um uh the the thing that makes the Naps
the the commercial um the the economic the economic
environment the economic coordination yeah it's the dream catch is the economic system that makes the
Naps yeah it makes naps um it makes uh it provides a a practical place to go in
order to make naps in the in one particular way most efficient yeah in one particular way it happens to use
naps to do its uh Machinery but it's just one option to
make naps which are an open format running on an open platform that anyone's free to um to to use but the
dream catcher represents our take on coordinating economic
effort to produce high quality naps very fast that's right and we think we can do
that faster than a traditional way which you could take out dream cture platform
and uh keep in naps um and just hire our team of 20 for 18 months to get it cyly
wrong um yes you we should also put stucks
outside of the dream catcher platform too because stucks are
independent I agree of the platform yeah might be that
um after all uh using a Ouija board to uh write code is a better way of doing
it um well it doesn't it's it's not not the dream catch is not about how you
solve it it's how you attribute yes for solving it yes Drey
cat the platform JY catcher platform is about aligning incentives in order to get people to turn up uh yeah but more
specifically though cuz that's a very broad thing to say more specifically
it's about [Music] um it's about
the attribution it's about taking
consumption payments and attributing them out to uh
contributions and and that's it like the stocks the stocks are actually separate the Naps are
separate um and users when a user is acting as a
consumer they're outside of the platform too mhm um and it's just yeah they're only
you're only really inside the platform when you act as a funer a Trader um or a
demander right right and sorry or or a um or Talent yeah yeah um and so I agree
with that um so the CRM would be um outside of this um going through a
Gateway and getting all the goodness uh that come comes with that um and uh the
serum's outside of the dream catcher it's the the stucks that relate
to the CRM outside the dream catcher but the dream catcher takes a copy of if you will the
um the stucks and it attempts to solve them using the solution methods of the
dream catcher system which includes economic incentives and is um but there's also
something here quite interesting say in the CRM they come up with their own stock uh as in the traditional
right we need to uh fix this we don't know H it's almost um dream catcher is
the place you take uh you'd advertise a stuck to have the world help but you
could sit there and try and figure out yourself well no CU stuck stuck just
needs an interface in the nap like you just need to connect it up to something
that can receive stucks which could could be anything or could be left disconnected but if you
connect it to our instance of the dream catcher platform that's where you know
you and I will get involved in it and we got this mechanism for advertising it
more broadly yeah yeah precisely and uh by advertising that equals uh um
connection making that connection is yeah yeah because we could we could connect the stuck the stuck interface of
the CRM naap we could just connect it up to GitHub and so that every time a stuck
was created it just created a new issue on GitHub and that's that it's an you
know it's a it's a it's a protocol a very simple one for reporting a
problem yeah right um and uh it is if
you um are using consuming other naps and come up with a stuck um you would be advised to try and
get that stock solved through dream catcher sure but if it was a really I don't know embarrassing stock like you
know our electric cars keep on bursting on fire and we don't know why we don't know we don't want the world to try and
help us fix that because that's embarrassing then there's nothing stopping using the format to actually
change that stock into a nap uh and then once changed maybe they want to advertise the Naps up again through a
connection saying hey we've got this nap let's connect it uh through dream
catcher for consumption with other other
people I think that works actually
think that works cuz that is decentralized nobody's forcing you to bring out your dirty
washing no that's right and and you could even have like a
a Gateway for your stucks as well like before you publish them they stay
internal and they need to be reviewed so that you can be sure that only things
that aren't sensitive are being published yeah right so a Stu's really a
Stu's just like a nap a stuck is just a form of interface it's like a a Json
style interface to describe a problem just like the nap has an agent uh field
in it which is how you interact with it using natural language just like it has
a Json function interface it should also have a um a stuck
interface that is like a a standardized format of how do you how do you create a a stuck relating
to this to this nap right and and then where where you connect that
to um depends you know it's like if you're a corporation you probably want
that to go to your internal pool first yeah and then sometimes pass it
off and send it out right I mean we you know um kind of interact in the similar
way in that uh You' be sitting here going I don't know how to do that
uh then I'll um internally publish that stuck to you effectively so you're not
the whole world um I don't have a place to put a uh the stuck onto the whole
world at the moment because it's really inefficient but we've got the dream catcher platform maybe I don't want the
whole world to you know know about my you know incontinence
problem for example how's how's that going by the [Laughter]
wayand what the fact that I'm pissing myself every day yeah no okay so the net
format or modify to be like this
[Music] where you say that there's a stuck nap that you is the the thing that's going
to use it where I'll say um the
stuck uh the stuck what would I call that what
is the um package what is the verb to stuck
I stick I stick the stick um because so the agent see what
I've done here is the agent is is a tool cool just like any other and it it's
what's special about it is that you can point to another nap to run it just like when you're in any other
tool you can you can you can specify another nap to run the tool if you want
and and so the agent is really just a a tool call that's given special treatment
because of the the fact that there needs to be only one per per nap but stucks is
the same so I need like there's a for running the agent I'm using the AI stuck
so it's like artifact slop aai is is typically the
runner I should might as well just put that in there actually cuz that's the only Runner we have right
now right and so what what would you call the
stuck nap um what is it
doing what what are you when you make a tool don't I don't know what what what
do you want it to when you make a stuck what are the parameters of the function
call um that's different from the uh
content of the parameters so what the stuck the stock is a bundle of
it's a snapshot right that's called just a snapshot um and it's like uh I'm stuck
and here here where I got stuck um now I think what you're talking
about is uh what you do with that
stuck no I'm talking about when
you let's say you're running the CRM mhm you're running it and you
recognize that you're stuck your issue is with the
CRM and so the CRM I think has the right to say how it would like to
receive stuck information oh I see uh for example we
could just uh summarize it uh and email out the devs for example something like
that something like that right so I could make this the the parameters of the tool call to the initial stuck
snap would be something like uh let's just say title
which would be um just you know what's it about description right the I know
these are wrong but this is like yeah exactly this is the state this is uh the snapshot and then you be you say like
snapshot ID um blah blah
blah the crypto ID which would be like the
repository this is the UN universally and
securely securely ID the the repo yeah and then
we'll say that the branch branch is
this right it's like you know where was it what was the snapshot how do I know
that I'm dealing with the authenticated data you know using the cryptography
pieces um what was the title what was I trying to do um I might say
that my eval I could I could write some evils in here mhm where like what are I my I
could say expectations yeah it's um why is this a
stuck yeah right and that starts to look like our testing format right there yeah
and the other thing is uh just to be helpful about it is um who was trying to
do this when the stuck was found and when yeah yeah yeah so that that should
that that that I you're correct but I think that that comes with the calling
parameters so it's sort of like the when you get an email you get the from
field you don't you don't write the from field it comes with the message by
default I think that's that works yeah this is I can sort of see the beginnings
of it's sort of seems right here yeah so it's just expectations
and then the outcome is a snap short I
guess um and then uh
description of the stock the description is the thing that says
uh why this is a problem I don't know dude I just made
that up cuz everything has a description yeah it's um some I think
that didn't you do some work on a stuck format like did you have a sort of a but it wasn't really it's
hard right like it I mean I know what my first stuck would be like be like Define
the stuck format yeah we don't don't get to do
that unfortunately uh that would be quite a funny stuck um but the yeah the um so if you
think about it uh for us to take a stuck in real life
uh saying dude I I need to uh get over this River I don't have a boat and I can
him uh and I was like okay so that is the uh description of
what I'm trying to do which is the expectation um this is I was wanting a
boat I just shouted and I got bought that my expectation was someone would
come along as a boat with a boat that didn't work um okay so
the description of it uh really is why did
nobody come along with a boat well you can't just shout and it was night time and it was like 2:00 a.m. on a Sunday
and there aren't any boats anyway you idiot um so there's the the description
is a bit of analysis of of it which is the snapshot in terms of being on you
know in the um that's the full context of how this thing context yes yeah how
it occurred yeah okay well look I mean so the the way that the way that I was
handling the agent right is the fact that like as soon as you want to do um
uh Claude right so or anything from say anthropic all you would do is you just
make a different nap that was good at calling anthropic AIS and then the parameters of that
function call would totally change because the parameters format is
dependent on the nap and so what I was thinking is that that's a that's a great
principle to apply everywhere because the stucks interface if I want to change
the format of a stuck or like the destination or anything like that I can
just change out the stuck nap to be like
um corporate stucks nap or yeah yeah or you
know wow right and that changes everything it's
like what is your badge number and that's your connection really if you say external stock well yeah so I
could either I could do this and delete it completely which means it just goes to whatever the default is that you
choose or I can come with something that's initially provisioned which would
have been um just simply this this thing
or I can modify how it came and then I've got the corporate stocks and all
these ways of handling stucks so because because naps are just sort of wiring up
different functionalities to each other you know that's that's all that does
right well what we would do with that is if there was uh say we wanted an
escalation process um the uh uh it goes first to
Dev stucks uh then it goes to CTO stuck uh then it goes to um uh I don't
know uh group level IBM stuck and then it goes Global and it's like there's an
escalation process uh so what I'd wrap that in is uh another nap which would be stickier
stuck in here um and after 30 days nobody solved
internally oh what you saying sorry it was unrelated to what
you're saying uh open AI finally started publishing to jsr hey
hey that's kind of that so they released it a week ago good stuff people thank
you Kevin Kevin scrunchies Kevin mate how you doing um so where I was sort of
going with all this is that like see how this is this is this is the homepage of the open AI mpm
package and like they have here issues
68 so issues would be like stucks for us um pool requests would be like um that's
how many pool requests are open right now for us that'll be like uh probably
about the the same concept really it's like here are solutions that have been
put against this nap uh that haven't yet been accepted by the automated merge tool or something
like that mhm and then you know issues is just that's just GitHub issues so
that's an easy one to mentally map and you can sort of look at all the all the stocks that relate to this
package [Music] um yeah I I think I think that's the way
to go because I don't know what you would name the the metadata type things
that surround a package like for example the issues um but there's also like
uh there's issues of funding as well there's pool requests which is activity
there's like consumption and so for us you know we would say
um for us we would we would have like token burn rate as well like how many AI
tokens did this nap burn across the KN Universe from everyone who shared it um
yeah you know what I mean like seems G quite centralized though doesn't it what
do you mean how is that centralized because the token rate uh depends on
which um uh Gateway you're burning on what you
could burn on multiple ones what's the difference you can um but only if there is some kind of agreement between
jurisdictions um so uh yeah I don't want I don't want
I don't want to get into that that's just way too complex it's it's all in the definitions if you want to check my current thinking on that
um but uh the um the point I was making is that
uh the um the stuck format uh and well got the nap format
stuck format feels like a similar kind of thing the nap format is transferable
to anything that runs um using the uh the structures put in place by the uh
Doom catcher Foundation uh it runs on JY catcher platform in fact Jun cater
platform is built from it however a CRM which is outside of the platform but built with the platform also uses it
because it just conforms to the na format stock format feels a similar kind
of thing um and uh again maybe it comes down to
uh the level of Discovery do you want to Discover It by only
internal you're stuck do you want to keep it you you're dirty washing inside
or do you want to tell the world about it or in this case um you put it on
um uh um one package thing and you got a bunch of issues there but how did those issues
um relate to another um repository maybe they're they coming up
with the same issues um I'm sorry I lost track of um the the point you're trying
to drive drive at there um the point I'm trying to drive at is stocks sound like
naps in so far as um if everyone uh uh is running inside of the
um structure that's offered by the foundation um you can take that stuck
into gym capture platform and get the world to do it or maybe they want to do it a different way maybe they want to
keep it in turn on um but the format doesn't change yeah the format stays the
same so the format is just like the Json um function format just like the nap
format stucks is actually a format rather than a
um I think I've been thinking about it previously as like a service which was
irreplacable but actually it's a format and how you choose to what you choose to
do with that format is entirely up to you and the dream catcher that we are
producing is just one instance of something that can process the um the
stuck format right yeah so just like get has get the git lab GI Hub there's
Microsoft devops there's all these things they all share the git uh format
and are into operable in that way but all offer something a little different
exactly and for example uh inside of a company um I could write uh a nap that
says okay uh stick your stucks here uh
first thing we're going to do is we're going to uh reach out to any
yeah I think I I get it you got it okay right but uh I'm sorry I'm sorry to cut
you off so much I'm just like I I feel like we we give a lot of examples and
I'm like I I get it I'm not concerned with understanding these properties of the platform my concern is deeper than
that it's about [Music] um it's a about you know all these
things are starting to come together and I'm just a I'm nervous that we're not
considering the whole we're very good at considering the
things that we have been focused on but there are things that are required for
the connectivity of those components that are not getting any attention and I'm that's what I'm
worried about I'm worried about the things we're not looking at okay
uh right is that known unknowns or unknown know or whatever it is it's it's
it's not it's nothing as um as cut and dry as that it's more like
saying look so over here right we got this funest package button yeah so that
would be like what we have uh with funders yeah you've got um the issues
button which with a couple of clicks you can make a new issue which basically that's the stucks
uh the pool of stucks yeah right and then we've got like pool requests which
is like contribution so that's like Talent what is the name that you give to
all this this metadata this this production level it's like
there's the package and then there's all these kinds of concerns like
economics um feedback uh contribu ution uh popularity quality like what is
the name of the group of um concern because that is what the dream catcher
is about
um so we're talking about in this case uh an issue which has been funded on
this package uh against a nap uh someone has got um one solution to that stuck
the pool request M that thing what is that economic environment called like
that that's the dream catcher to me but we haven't concretely
defined what you call those those concerns they're like life cycle concerns they're you know developer
salaries business premises uh address registration um licensing they're all
these like issues about the code the not the code
itself uh yes um asking for a name yeah
because that's what the dream catcher is and I just we need to name it otherwise
we keep the more the more we have unbundled Concepts the more we end up
needing to speak in examples but if we could tie them them all together in a unit and say this is
this is that thing then we can free our minds up to deal with the next level of
problems so we're not talking about um the Practical things of where is the
stor or anything like that about lies we're talking about
um because the the dream catcher platform is trying to UNIF at the moment
everything you see in this panel
is provided by an external thing like funding the package
is separate to where the issues come from is separate to where the package goes is separate to how the downloads go
and you can't even see on here where it's being actually used like you've got
no uh runtime data on it you can't see what code paths are hot Within system
you can sort of see who's depending on it like here's here's the packages that
use this package but you know does that help you you know which parts of this
package do these bits rely on um you
know it it's like then you've got who released the package well these guys but
you know uh who the hell are they and why do they get to say when there's a
new version if there's 144 pull requests how do I know that one of those Pro
request isn't far better than the version I'm using right so like release
uh permissions the politics of the thing that should be AI controlled and AI
should be determining it's time to release right so there's all this like group of things that is the
Dreamcatcher that in the current environment um is all disparate and all
over the place right and then don't even get me started on if you want to host this thing on the cloud like that's just
a whole another world of pain right and so really the dream catcher is trying to
bundle that whole thing as one that's the that's why it's such a
mind melting thing it's trying to all those concerns and they are many we're
saying that if you look at it just the right way and approach it down a very narrow welld disciplined path you can
present that whole thing as a single monolithic ecosystem an economic
ecosystem that we think can outperform this disjoint thing
if only for the fact that we can talk about it as one thing versus the
split across all of creation that you currently have to deal with when you want to just run your damn
app okay and that's that's that's my problem that's why I'm like I don't I it
feels mean to say it but I don't need any more examples sure sure there's details in
there that I'm missing because you know you've been deep in it and all that but
the those things are not concern to me I'm confident that they will shake out and that we know them enough to work
with them but what we don't know is we haven't
unified all of these attributes these coordination problems
these economic incentives the these things are still loose in our minds and
in the world but our purpose as a dream catcher is to weld them together mhm mhm
I don't disagree with that [Music] um um well I guess uh the key to
that uh and there are various ways of answering it but the question to answer
first is do we force everyone to go through the gy catcher
platform uh and then be D dist uh you know crms all over the place and so on
but everyone comes down back to the gym catch no we don't we don't need to we don't need to force it we just need to
Define it and invite people to use it and we're like you you can you can come
back into because the key unlock for me was being
able to think of everything as an interface so the nap interface the stuck
interface and so we don't want to force anyone to do
anything we're just like saying here's these formats and then we're offering a unified package in the Dreamcatcher and
trying to say what the what the benefit to you is if you choose to participate
you can still use all the software outside it's all compatiable with the
conventional stuff but if you run it all is
one and you give up on the idea of you want control you want choice you want
all these things if we can win your trust that we're actually better than
you at it and better for you at it and you unify your processes and just use
this one thing we want to prove that that's vastly economically
Superior to this other this other method that I can't even even fit on One browser
page and and I think what I'm asking from you and and why I keep poking at the context diagram is I want that kind
of view because that is what the dream catcher is and I can sort of fuzzily see
it for the first time but I need it
captured so if you go back to that our current context diagram which generate
just a few minutes before coming on which is which is very good I got to say it's I like it well that's the um with
our Paradigm of renders and iterations this is where we should be talking
so um this is where we spot the weirdness you know do you want me to say
what I see wrong here yeah yeah okay so um now I'm I really need to get going uh
probably in about 5 minutes but I'll I'll drop a bunch of negative comments and then run
um I think that the Naps come
out yeah contribution stays in the the consumer user comes
out okay I would rather see users change to
actors but you might have some you know some reason for keeping it
there um this arrow is I think it's meant to be two-way but it's hard to
tell yep what it's what it's doing
um payments has no Arrow
um I like this diagram because it's simple and clean but but when I when I
look at this web page and I talk about all the things that I just
described like where do I host it how many stucks are
there who said when to release how do I report malware like
I don't know how those relate to this diagram but it feels like
to define the dream catcher platform you should be talking about all those dimensions of software concerns or
corporate SL ecosystem SL coordination SL economic concerns because that's what
Narrows down the dream catcher so at the moment what been see
at the top of uh uh just you know actually called the the entire thing the
gym catcher system um and that incorporates the platform which is uh
really nap production well I would I would that title should be um dream catcher
context because the dream catcher system is just one box within it depends on
these other things like it depends on there being a healthy strong Json
function calling nap platform it
doesn't that nap platform doesn't strictly speaking depend on the dream
catcher but the dream catcher definitely depends on it so at the moment where
that would be is the dream catcher Foundation provides the format uh that
is used uh a Gateway is contracts DL
uh to run it and catch your uh platform consumes Deno through that Gateway so
that's in this in this diagram that's how that would work yep
um that seems fine and uh similarly for uh using
different platforms with different issues recorded and funding and all that
kind of thing that feels like the path should be the same it should be uh uh
the Gateway uh host an API that allows information to be used by um the J
catcher platform to bring all this together I don't see why the Gateway
Network would have to have anything to do with any of
that um well the Gateway network is there in order to abstract away uh the
need for individual contracts uh agreements on T um T and C's and so on
um is a thing that exposes these uh for use inside of the um the overall system
and the uh the platform itself uh without having to individually
go um as a user and sign up to you know GitHub and you know jsr and whatever
and then we've got so you're talking about how to connect into
GitHub yeah all about yeah I don't think that matters um
at all for the context of the dream catcher because the the feature I wanted to
capture was that the dream catcher platform relies upon
the stucks interface it doesn't care that it's on
GitHub or or anywhere at all it's just simply making it obvious how
important the stucks format is and in terms of the standards and protocols
that the dream catcher Foundation provides we should list what those are
and those are in those include the format of a
stuck uh yeah yeah yeah that's right and uh the the diagram uh supports that so
um we don't care that running on Deno well kind of do but if a better Den comes out it's not going to change no no
no no so yeah I guess what
I'm what my concern is [Music]
um is that whilst this this Loop is brilliant that
um you could apply it um you might be
wasting time in terms of how fast it would be for you once we had it built
and so what seems to be not fast for you whether we had this thing built or not
appears to be like the first 70 or 80% of the cycle it seems like you get
really massive gains very quickly but then the the lack of
automation slows down your progress from about 70%
up um yeah you mean the cut and paste overhead sort of thing yeah yeah because
you the first like running through this Loop say four times to pick a number
seems to get you to within about 80% of the final goal just
anecdotally which which sort of sounds reasonable as well
like and and but what I'm worried what I think is an uneconomical use of your
time is to continue on past that point because the the extra gains are not
worth the overhead that's coming from pasting simply because we're just
waiting for the platform to come online and then you'll get that next 20% gain
in a couple hours type of thing yeah but uh at the moment I'm working to generate
this context diagram okay um so and I
don't have uh the platform available to gain that last 20% I'm still in right
yeah yeah yes yes I know I'm uh I'm suggesting another uh alternative and
you know far better for me to to try and tell you what to do because I mean you know Landing the Reasoner was just
absolute gold got to say um my opinion of it is that uh
the the ecosystem concerns of the dream catcher have not
been addressed not nearly enough all of the all of the reasoning that you've
done so far has all been um inward looking or downward looking
like we have a discussion and then you go from that point down down down until
you hit the the ground of of naps but there's still a ways to go up before we
can look down completely there's still some things above us those things are the
economic concerns of what every mpm page
says th those those parts don't really feature in any of the things that we
talk about or the commits that you do I think that those are missing
attention Okay so that's a uh if we're to express that as a
stuck um what I think you're saying is uh there is all this is fine and this
doesn't show the whole Detail no but I like this diagram I I really I really like this diagram yeah the um uh you're
looking for a layer above that um which
addresses uh we got a specific um uh example there which is you've got a
whole bunch of uh um fields in disperate
websites scattered around the world that all are sort of like a stuck sort of like funding sort of like yeah sort of
like hosting how how where and you know how do these come together so it's yeah
it's kind of a logical layer but um at a kind of
interface level it's more like saying that those things should be pulled down
into the context diagram somehow because they are what the dream catcher aims to to do
and I think that we have been pretty consistent about always talking about that whole roundhouse of things but we
don't ever capture it in one spot if we were to capture it the the benefits
would be quite Grand because we could say who we're competing against and what
that means is that whilst we're saying that you know we're trying to provide a
unified experience where I don't know anyone who's trying
to do all those things B AWS be get her
bmpm um no one's trying to do all those things all at
once so really this uh like a inside of
a simle context diagram for the various uh requirements of passing
around the API calls to whoever that Maps over to the
stuff that we know about in terms of stocks and attribution and contribution and so
on sorry can you ask me the question again I didn't understand um so in terms
of context diagram context diagram is outside outward looking so these are
things uh in the real world doesn't say anything about attribution alos or Loops
or stuck Loops or anything like that oh um it it oh no no that's not the context
diagram crumbs it's more like the the internal features of the dream
catcher cuz I what I'm getting at is is what I was getting at earlier is that
some of these parts need to come outside of the dream catcher platform cuz they're not the dream catcher platform
mhm but there's extra things that need to go into the dream catcher platform that aren't there and those are to do
with the software development life cycle
concerns that I outlined on that mpm example
page and uh
so it's quite slippery stock to Define is it this is yeah this is this is why I
want to hit this one because it's damn well difficult to even say or not say
that means that it's of vital importance to capture it because we've run over all
the stuff that all the stuff that you have here we have in fact run over that
we are easily at 80% definition for all of these things would you agree with that's a reasonable number to pick right
probably more really but but we're at 0% for this thing that we're trying to
talk about right now and that's what to me is economical use of time hit the
thing that's the hardest thing you yourself like to apply that as a tactic I think that's Madness
personally the trick is naming that thing naming that thing yeah um you know
saying let's hit this thing yep like all right
it be uh let me think about whether there is yeah so I got to I got to I got to
you got go anyway yeah yeah let me think about the what was about say is um it would
probably this hasn't this this has got to be a Sol problem if it's a s problem know about it well it's got to be named
right it's got to be studied named yeah yeah and and I think I think it is
unique that we are trying to do all of those things is one thing and
it would it would typically be called madness to try and do that but we're like no no we can do
it um with these benefits because we're taking this unique approach and that's
why when you're like who are the competitors to the dream coach I was like well we haven't found anyone mad
enough to try and combine all these things as one and here's it working
so clearly it's better and in a
way it's [Music] um curly right tomorrow I'll
uh I'll at least try and Define what that stock is a bit
better uh avoiding the use of words like thing
um there must be this must be um practicable because essentially what
we're saying is how do uh different elements of uh systems
interact um um are you okay if I stop the recording now yeah yeah go for it