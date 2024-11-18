um my desktop's still unavailable still saying that they got a problem so I can't share oh that's convenient okay
all right well uh let us is going to be a problem because uh I was want to right
tell you what I'll send you over a diagram uh this is just as
a a method of discussing this this is not a actual this works method of
discussing
okay by one standing
by this is after roaring
St hey man we're not looking for monetization of the YouTube channel no
absolutely not we are looking for monetization so that would be good though that would
[Laughter] be right so
um yeah the uh we were very fuzzy
yesterday okay uh in both directions about actually what
um what looks like done in what you need in terms of uh these interactions of
external services and interactions between the services sort of things so um those questions those questions you
were asking sound like exactly the exactly down the right path to be to be
hitting those questions is a is a great sign yeah so I've uh I mean thinking um
thinking along those lines and this formats um I can't even remember what
format is of foundary is it has a name anyway this is a formal
format it's uh composite structure diagram um and what it highlights is um
the interactions between things that do stuff um which uh seems to be one of the
layers now I think part of the complexity here is we're talking about different layers so what yeah that that's that seems to be all of all of
the arguments and issues that we've had have all been an issue with um picking the right layer Point yeah yeah so I've
stripped out a lot of stuff here or abstracted well I haven't uh this is
just again derived from the definitions so this is a render this is a render of
the definitions yeah this is a direct render okay um and I put in
one uh I put in the DL uh as an example of an external
service now um what we were talking about over the text there is uh what's
the flow um and there seems to be a number
of flows a number of views that we could look for the cash flow um as in who pays what when it's
consumed and so on there's the license the right to use that service and then there's the right to services and so so
the angles that I want to um break apart and correct where I think that there are errors is the um pervasive concept I see
throughout these diagrams where all the relationships are occurring as contractual
relationships um they uh I I don't feel like the contractual
relationships are being captured at the right level of uh requirement because
they are only needed um to gain access to things in
the real World they are not needed internally um Yes except for i' agree
largely of that except for what we're seeing is uh all the actors of which there are four types that work on gym
catcher yep um they they're all signed up to a Gateway they don't have to
be um if they're not then uh the Gateway
gives access to services uh if you get uh someone random siging up somewhere
else down linee so dream capture platform here really we could not all
services not all services have to go through a Gateway the Gateway is there when the
service requires a legal entity for it to interact with but what I what I feel
is fundamentally being left off is the ability for anybody with a computer to
fire it up and offer a service they don't need a Gateway or any kind of
contractual relationship to be able to provide those compute resources um yes okay so let's go
through that so um so for then I'll just say compute service y um so in that
scenario um uh we've got say two different actors uh who both trust the dream gy
catcher platform um and you're saying that the
gy catcher platform could run naps on someone's home GPU
correct um so let's say that's user one who's providing that service uh user two
um has called doesn't know anything about user one yep doesn't know madams
and could be anonymous y um but there's a contractual relationship with uh
through the Gateway uh with dream catcher platform um and the dream catcher
platform um in that contractual relationship has certain rights and responsibilities as every contract
does so um but user one doesn't user one doesn't need a contract to be
participating in the platform um are you saying though that
user one can offer his GPU out to some random person who doesn't know him if he
want there's and there's no quality control there's no uh yeah that's right security
provision um yep 100% And that would be then a one to one uh either one to one
agreement between user one and user two or user two well um feel your um no this
is this is you have no idea what you're going to do this is the um
the error that I see here is that the the contractual relationships are progressive they start from zero and you
only enter into them with other participants as required they don't you
don't have to have one to start you know like I could start two two
um two Talent people could start talking to
each other about an idea and they don't need to have entered into
a um contract with the Gateway in any way but they um at some point might
decide okay I want some legal protection and so now for me to keep
talking I need you the other guy to at least have this Baseline contract in
place like an NDA um okay so uh let's do that so two
random people want to start talking about uh how it's always stuck say
Yes um right they are consuming Resources by just doing that talking unless yes they printed it out and
they're you know just talking about it y it's fine they are they are um they are
causing contribution they are making contribution right in the contribution layer they're also consuming so if
there's no contract uh with any of these uh user one user two and platform
yeah then you know okay so we can record contribution but you're consuming uh at
least tokens by yeah right theform and in that case with
the the model that we have right now you would need to have at least agreed to
some terms and conditions um to be able to uh use the
shared Computing resources in that way because we are forced to do that because
we have to have that contractual relationship with the infrastructure provider they require us to police our
users so that when they themselves get policed you know like people can't be
doing anything illegal on their servers and they pass that requirement on to us
and we have to pass that on to others but the issue is that this that
relationship um whilst very common is not
required it's only required because of the way that we're provisioning the infrastructure right now there there is
a range of data centers all around the world that we can contract with that do not have that
requirement this image you see here is actually on a server that is under such
a relationship in Singapore um yes because it's a seed box
yeah yeah but in order for us to talk about this we've got both contract with
meta and contract with the seed box um and
uh that's the the the the idea yeah the idea of the contracts was initially only
to allow people to participate in activities that are controlled or related to the real world you cannot
interact with institutional resources unless you have contra contal ability and so but that's not fund
that's not fundamental you don't to solve or contribute to to provide
Solutions you don't need to be interacting with any
institution okay so here's a test case uh us a one uh and use a two just want
to turn up and use the platform and talk on the platform um yeah so they're consuming
resources correct so they're going to have to pay up front uh
no well we we are going to gift them credits to get them started I am I'm
just conscious that the to answer you correctly might defer from the point
that you're trying to get to but yeah how that really goes so so tell me if you're like I just want to gloss over
this to get to my point yeah that's point the um the point I was leading to is what is the minimum way of uh user
one and user two interacting on the gy plat gy catcher platform um sure we can
give them credits and that sort of thing but that's you know still a thing are you asking for the minimum contractual
relationship in terms of uh like a click a click through agreement or any kinds of terms and services on the platforms
is that what you mean yeah yeah yeah someone turns up and saying just want to use the dream capture platform because my mate said that's good and I want to
talk to this guy I think the minimum we
would require is to um provide an
identity and that's it because if you consider how we are providing um long
threat right now the long threat platform doesn't you don't have to click
through anything to start using it and start burning tokens and and and we're we're completely ons side with our
infrastructure providers for doing that they they don't require us to cause our
users to sign anything or agree to something but we need to Simply say to
the users look the conditions that we offer our services on are X here's how
we treat your private data um this is these are the regulations for you if
you're coming at us from this jurisdiction you know like Europe um versus is coming at us from America
we're not we don't have to make them have a formal
contractual relationship with us and honestly if they want to pay us if they want to pay us service credits in um
crypto currencies we we don't need them to Pro to pass any kind of contractual
relationship whatsoever um yes but there are some
things we can't get round like acceptable use uh privacy yeah acceptable use is something that um we
so our infrastructure provider will tell us that something's being done that's unacceptable and then we are required to
respond rapidly to se that user or remedy the situation if it is like
copyrighted content is being housed um or hate speech or or any of pick any
number of Internet ills if people are doing it here and our moderation system haven't caught it then um we need to we
need to respond but we don't have to do that up front like we don't have to we we need to have a a way that
people can navigate the system and find out what our acceptable use is and what our
um um data privacy policies and things are but we don't it doesn't have to be in your face
about it you know so the minimum uh then I'm thinking is uh exactly as he do with
signing up Deno uh has it be have terms and uh conditions just kind of it's not
contract but terms and conditions are here are your responsibilities here are our responsibilities and we hold the
right to we can yeah we can cut you off anytime and the only reason why we have
to um provide an initial instance of the platform that has um acceptable use
policies is because we're using um acceptable use policed
infrastructure if we if we were running on [Music]
um uh I don't know what the term is for it but it's like gray infrastructure or
you know like the stuff that you run seed boxes on or things like that we do not have to have the terms of use uh
terms of service in any way we're just but like honestly even even a seed Bo
has terms of service um Technic even if yeah even if you set
up a home server with a GPU and run this yeah you still do you're you're going to
be in the [ __ ] if they start doing yeah terms of terms of service is it is a funny one because the the arm of the LW
is long and so it should be um but the
architectural the architectural point I'm trying to get out here is that you you've designed this um or this this
design presents as a single controlled
platform but the idea of it the way that the protocols were made is that you can
run many instances of it and they communicate uh in a in a network it's
it's actually a network not an individual thing and so each each provider or each instance on the network
has their own terms of service depending on um what infrastructure they're using
what country they're in and their own personal political views um but it's
not it it doesn't belong in the definition of the standard platform it's
a it's a it's a requirement of the service providers the
the uh the the resource operators that put that requirement in there and it's
bespoke to each one um so uh what we're saying we're back to
Ono one agreements so uh you want to sign up with one
platform sign up another one you got two agreements no uh I think I see what
you're getting out there is that you're trying to say that if people sign up with um a particular gateway then they
can have trust in the people that they're dealing with um are also under that Gateway yeah so
um how I would imagine that going is that you don't need a the Gateway
doesn't need to get involved unless you need to go through the Gateway and the gateways are
jurisdictional like the the're regional and so the type of contract
you're really talking about I think is um the sort of the that um general
purpose license document that you had prepared um several years ago that sort of is it's like an
open-ended um contract it's not it's not with a specific entity it
allows um it allows an AG grieved party to pick up pick up the contract pick up
your obligations if they want it's it's sort of open to everyone it's not it's not
direct one to one yes yeah yeah and and and and that's
that's the separation I'm trying to drive at here is that somehow it feels the gateways have become tangled up in
that type of peer-to-peer um
Progressive opin contract situation and it's not that they need to sign one with
each other it's that they sign one with the network as a whole and each participant can see what level they've
signed to or you know like have they signed version one have they signed the
NDA Clause have they signed the um the something something Clause have they
paid a bond into the platform for good behavior you know there's different things that you can do to present a
higher and higher level of trust within the system I agree with that and also um
if you think about the gateways so the gateways are multiple gateways different
jurisdictions and so different jurisdictions and also different policies that occur on each one exactly
and each uh inter Gateway agreement is a bit of like a filter it's like um does
is this everyone on this Gateway do they uh is your um terms of service or the
levels that you've offered nda's you know contractual whatever yeah the different modules that the different
modules in the contracts and and and some will be filtered out and so it's like there's no way you're ever going to
work with Abid to buy for example um so if you want just go straight to ABY and
the um Gateway there but there's uh there's something here that's uh um
missing from this diagram which is that layered thing you're saying so it's almost like modules modules the uh um
the base layer is uh you turn up with
any platform gym C platform in this case uh
now it's licensing through the sham catcher Foundation it's only that the word
licensing is somewhat misleading because it's actually just brand assets it's it's um the ability to
use the trademark that's all yeah but that trading as thing um
there needs to be an agreement uh you can't allow anyone just to trade
as trade as who um well uh when we talking about for
example trading as dream catcher platform remember we're talking about
that right but the wording is not trading as dream catcher platform it's dream catch a PL it's be like um UK
Gateway One trading as project name right right so um and that but that
that is that is police at the individual Gateway level but the access to the brand assets is given out to the
gateways because the gateways control who who can use them um in a
trading as fashion or or any other or like a subsidiary fashion but the um the
holder of the trademark says that they are allowed to indicate that they are
part of this this network like that that's why trademarks become quite important for open source projects yeah
so the but the um I guess what I'm going at is the the important point you made this Archy of uh I'm going to behave
myself more and more and more yeah and have more responsibilities and more rights y um the uh the base level is uh
I set up a GPU uh download uh the open source
version of artifact and Json uh net format and and I just run it and I run
it with a bunch of mates yep uh and could be a handshake doesn't need to be a handshake even it's it's a protocol
fist buum not even not even that it's the it's the the base layer is the rules
of the software right right but you're seeing say um yes yeah quite right but that's
the kind of API the connectivity level the protocol level that's that's that's
the lowest level of trust and the software is defined to detect faults in
the protocol and that kicks you out that's the in a in a in a very loose sense
that's the same as the police right if I were to set up a Home Server
download all run everything it's under uh G or whatever yeah uh GPU uh mate
does it yep um it's like okay so now we can link up
those two and we can have our own little Network now mhm the important thing is that's what was trying to express is
that is the kind of the lowest level so yeah uh the lowest level trust
is uh I trust the software protocol level yeah I trust the software and The
Primitives that it's built upon exactly um and if you [ __ ] up that's not a
problem you know if you end up hosting Kitty porn you know s to you um yeah
like yeah but no one's going to come on our Network that because our moderation
will pick that up yeah yeah you know this is where I'm leading to sorry can finish the thought there's a there's a
hierarchy here so if those two uh home setups MH want to um access say um our
setup um then uh I would I would suggest uh we put
that through kind of the dream capture Gateway remembering that there's any
number of gateways um and it's like that's the basic level
that we need no well I don't I don't think that's necessary at all all the
the minimum level is even lower than that we would um just because we're using fancy
servers doesn't make us any different um from a peer-to-peer standpoint as people
running the thing in their garage the software executes the same it's the same software right so when they when they
want to communicate with our instance we have set our moderation settings to
disallow certain types of content that we personally don't like never never mind what our infrastructure providers
don't like like we we are entitled to because we're running the infrastructure
and offering people to pay us to do that for them we can set we do set our own
rules which are set with certain tastes in mind yeah that's exactly what I'm
saying one no it's no way contract um well that's one up so uh
you're saying okay these two dudes I've set up their own one and now they want to clag into gym cture platform
L1 so um but keep in mind we're we're setting uh as you just said uh certain
rules yeah moderation yeah yeah um and uh you know whatever we want in terms of
cost so up to this point they bearing the cost that's right they come on to uh
dream cat platform if they want to use our resources we offer we advertise our pricing to them and we advertise our
moderation um sort of um we advertise what our moderation
settings are but it's still ultimately up to us we can just do it because we don't like them now from Glasgow screw
them yeah sure but um let's let's say if uh we charge yeah uh so uh previously
the cost has been borne by them they want to work with gym cater platform and some of those costs have been born by us
yep so we need some method of charging yep um our method of
charging is through um uh you know whichever payment um Gateway we
want um we Gateway but we might take crypto sure that's just another Gateway
that's another service right service sorry over indexed
overed so uh so now we've gone up one level of kind of requirement y um now
these guys want to uh use naps produced um say elsewhere by another
kind of home brw yep so someone someone produced someone produced an app um just
in their own garage they made it and now the two guys in the garage are using it yep uh
and these other guys um have uh mirrored this by going to another platform with
different attribution different rules and so on yep um now they want to transact cuz you
know group one wants to use app on group two okay so we can record that
contribution um there needs to be a contract or an agreement
uh let's call it because contract is too heavy an agreement between the two platforms saying right a contribution on
yours is recorded on ours your attribution is your own Affair our attribution is our our Affair and now
we've linked the two yeah I'm hesitant to say yes but um
I'll agree with it because I think that your render needs to I can't uh tell for
sure what's wrong until you render a bit more there's the opportunity for that to be wrong but there's also it could be right
but okay um but now we we stepped up one level what is the one level the one
level is uh now we've got two mirrors mhm who have just got the the
base terms and conditions the usual thing yeah uh with signing on to any service into two platforms two instances
of the dream catcher platform right and they they want to use snaps here over
there and vice versa and so there needs to be some kind of an agreement between
the platform when you say uset are they just are they just pulling in the the data required to run it and they're
running it on their own infrastructure or you're saying that they want to um
trade hosting um well it could be uh both of those because naps are um flexible
enough that you could be you access okay so is this are these naps are these naps
GPL soft W uh let's say it is yeah say it is okay so there'd be no fees levied for um
transferring the um transferring the the source code
of the nap apart from the data transaction fees yeah but the uh there
would be an there would have to be an agreement between the two platforms because an agreement between the The
Homebrew guys and the platform about no kitty porn please uh this other platform
no that's not that's not an agreement it's a
firewall um a firewall isn't an agreement if the moderation acts like a
firewall um why do you need them to agree to in
the same way as uh when you signed up with Deno uh they they ask you to agree
to the terms and conditions right yeah but I don't need to ask our
users to agree to those terms and conditions too and I don't need to ask them to agree to my terms and
conditions uh like why why why is there this need I see laced throughout all the
interactions you map to have a an agreement between people because when
we're talking about this what we want to do is what the headmark is ultimately is
uh for people to have popup companies without having to go through all shareholding contractual yeah correct
correct but You' you've LED that through to the interactions of all the
participants I would expect that maybe less than 1% would want to start their
own um company through the dream catcher the majority of them will just want to
transact as permissionless agents on the platform the majority of them won't want
to sign contracts with the network um or with each other they'll want to just
just uh get paid probably in crypto and they want to consume and pay for that
and with a credit card um yep I think the the contractual
relationships required to start a company have been overemphasized in this
uh design and I just want to um uh dial that back
to cover with just as much importance the contract free interactions that
occur um the only addition to uh this diagram then is uh each of these actors
um can simply use uh the gym catcher
platform um and they could choose to uh through the gym catcher platform escalate that
saying hey I'd really like to you know use this other service
um I don't want to go and you know
uh go and sign up to that service and then clag it in and then do all that API nonsense down here
that's right so so if they want to consume services in that way then the
contractual relationships they need to meet are determined by the service provider the majority of service
providers won't need anything other than prepa
payment right and the mo the moderation is taken care of by the service provider where they just they just block you they
just they just you try and do something that breaks the moderation they're like no hard no um yeah another service
providers require um qic ml not necessarily it depends on the service if
it's just providing a pine cone database I don't need to know who you are yeah okay but um if were to go through
stripe if we were to go through stripe we don't need to get kyc for people to pay us with a credit
card um but they need kyc on us right stripe needs it on us so we are the
service provider um and we are responsible for um the charges that we
make against credit cards and we're responsible to um stick to Stripes terms
of service which are things like you know can't sell guns um can't do gambling you know like a bunch of rul
and we have to police that but we can we can we don't have to
say that to our users and they don't have to agree to it it's just that if they try and do something that breaks
Stripes rules we just go no done not not
happening okay but that um uh that moves
the risk onto the um the platform so say if our moderation the risk always was
there the risk always is there um but the I'm saying is uh someone could run
rampant we we wouldn't notice because we would we would notice it's our job to notice yeah you know but uh unless
you're infallible with the Pope um there's things that we would not know as right but an agreement is not going to
save you from that issue anyway uh no but the agreement um transfers risk well
only um it doesn't transfer it from the eyes of
stripe it stripe is we are the throat to choke for stripe just because we've got
other throats to choke doesn't really help us um well it does because strip's not
the law the law would then allow us to go after the person who's uh being selling Kitty porn through uh through
our platform strip said we've noticed this you didn't notice this you're off bang and go [ __ ] there goes our business
yeah uh right okay so we should go out of business for that by the way yeah we
don't deserve to be in business we're holding the uh uh the Hot Potato now
well we're obviously not criminal criminally liable but I mean this this I
don't feel like we're like we want to
offer the minimum amount of administrative burden for people to use
our platform right isn't it the case then that all the only change we're really
talking about here is uh platforms can go through gateways just
to make it easier to interact with other
platforms um that sounds correct but I don't see why that even matters like two
platforms could interact without a Gateway being involved at all um it's up to them well see if
uh uh we've had Kitty porn going through our platform can we pick a different can
we pick a different um bad thing guns I just say bad thing bad thing one gun
yeah so guns are being sold y yeah and we've been thrown off straight yep uh
and it's like we've thrown off the user um and uh there's this other platform
that previously has been accessing our nabs and it's like [ __ ] you just when you say accessing our naps do you mean
we are running the Naps for them um the Naps were uh generated um and are
running on us so we're hosting the Naps for them right yeah well this comes down
to the architectural I think that's one of the things you're pointing at the the other day where it's actually running
but yes take take that as an example I don't know sure how that's whether you're architecting it let's say if it's
it's running on Platform One and the nap it's got all sorts of other things that goes and finds blocks
and that sort of thing yeah uh this other platform is like squeaky clean doesn't like guns at all yeah and uh one
of their users goes oh I've just discovered this let's buy a Glock
nap uh now they uh um but the but yeah but the so there's the Dark platform is
the one that's hosting it the user simply was the user was engaging with
the services of this other platform when they did it it would be pretty obvious that that's
hosted by someone else it' be like going to a different server on the internet it would be obvious that you're somewhere
else the fact that I can um say use chat GPT and it go out and browse several
different websites for me some of which may contain forbidden information you know like that's that
kind of situation so um should we be removing
gateways at all no no this is this is the issue right like you've Bak Gateway
into everything but it it belongs there just not in everything gateways it's
it's a tier it's a it's a it's a view I could I could easily render uh do a render here saying um at the user
interaction level only uh none of whom have agreed to any Gateway interaction
and then we'll get a diagram like this so it's just a it's a render it's a
choice of render um so it's is not baked in it's simply
defined but the question is the definition I think you're driving at is gateways are only there when you get to
a certain level yeah yeah they're only there yeah and that level that that
level is when you need to interact with institutions uh or other legal entities
in a particular jurisdiction and that's why you need the Gateway component because like you look at ethereum
users they don't have you're stuck on the ethereum Chain you can't start a company from just inside the ethereum
chain but that's the service that we need okay so uh that's interaction between legal entities but not Services
the services are contracted by each platform individually you get your own stripe account platform
too yeah because I think when you're when you're running as a platform
you're a sort of some kind of entity and if you want
to use institutional services like stripe you're going to need to either run your own which you can or use a
gateway to make it easier for you um which you can but then you need
to uh contract the Gateway the Gateway will have its own filter and requirements yeah all you're doing is
passing through what stripe requires yeah that's right yeah and in fact like um a stripe
payment processor is an example of something that I would think would be Complicated by a Gateway you probably
want to set up a dedicated company for us to do that but there's nothing wrong
with someone else who sits there and is like I don't want to I don't want to deal with filing my
tax returns I just want to use the Gateway service and run my own stripe thing
right so um but the yes so um there's like a thermal Cline here isn't there
below that um it's 1: one whever you want to
agree well it's the it's the software agreement the the protocol agreement is
the base layer if you don't agree with the software protocol you're not in the platform yeah but that's that's yeah
that's the platform's problem but as a user turning up our portal I don't know anything about the protocol um and uh
uh um below this thermocline if you wanted to you could even not bother with
a login just just use it yeah you should be you should be able to use just well you mean like use the software directly
yeah like long at the moment is yeah you could do that um or you could just
generate a set of crypto keys and just use it based on your identity is backed
by your ability to sign yep and it can deal with payments
locally if there are any payments yeah um you could pay in cows if you want yep
if if the other side will take cows then you can pay in cows yeah exactly um so
that is all on a single platform now we're talking about uh gym cat platform
here being duplicated uh there many there's many platforms you want so yeah um a single
platform uh is we only take uh you get all the goodness of our attribution
model which is mostly around milk um and your contrib is mostly around cows and
we pay out in Cals or milk that's like okay uh or one even layer below that uh
is we're not charging anything just come and use it um I we not even you know loging your
contribution because you just can because the that
format doesn't actually imply contribution or attribution um it just is so what did
that what did that give us um so at the very lowest level is like um do what you
want here's a format do what you want MH um one layer up uh on the platform it's
like platform you decide uh but you're just your users and
you your you're a little inclave do what you want we don't care um the platform's
responsible for if at that point it wants to go out to the cow exchange fine um if it wants to do anything in terms
of trading between other platforms which at the protocol level are compatible and
by trading I mean um uh a Trader on uh
uh JY catcher a wants to um put money uh on an app that's been produced on
platform B there needs to be some kind of agreement that that's going to be
honored because platform a is that's taking taking the Cs no um I disagree
with that can you restate that scenario I think this is where we fall down okay
so um in the situation uh we've got two two got uh
their own rules yep who who cares but um someone who is using platform a as a
Trader sees uh and there's an agreement with platform 2 with its own rules sees
an app and wants to put money uh on that nap in the trader uh method that we've
been discussing yep okay so where's where does the money go the money goes to
platform two right okay what's the route so the money needs to come from where
did the money start where did the so the money started on the traitor he could either pay it into um a g um an issuer
that is recognized on platform 2 or he could have an issuer that's recognized
on Platform One and there's a money route to do an exchange that go
exchanges it for um assets that are good to go on uh platform
to because that's like saying um I have the ethereum chain and I have
the salana chain and I have assets on ethereum and I want to trade with Sal something on salana like I want to buy
an nft that's sitting on salana so I need to use a bridge
um or basically a currency exchange function that Bridges between assets on
one versus assets on the other and so what I'm trying to get with um the way
that we model uh stripe dollars when we launch we'll set up our
stripe Gateway Pro uh gate our payment processor for stripe and we will
issue US dollar issued by our entity backed by
stripe and then we the hosting company will accept
those dollars other people might accept those dollars
too for for services and things that occur on the platform and so it really comes
down to anyone can be an issuer what you'll accept is up to each
individual and if you say you'll only accept us from one of these 10 stripe
issuers on the network and someone wants to pay you but they don't have any of that currency they need to go and trade
it if either their currency is worthless whatever they hold or there'll be
Arbitrage opportunities for um people to swap them in and out and for people to
bridge them between the platforms right right okay so that's uh um again that's
below the thermal Cline uh and that's very traditional right um classic blockchain asset transfer
yeah I could have um uh I could be on uh ethereum your uh
uh Choose You Know Doge whatever um we come up with an agreement uh cuz we're
kind of both agreeing with the rules of the thing like I want to buy that thing from you or I want to put give you money
um and I expect that contribution uh to be noted uh in case
you know that you're gets money from somewhere else I want that back but there's no contractual
agreement and hey if it happens that's cool if it doesn't yeah it's not going to happen yeah and that's not that's not
to say that's well it is the world West at the at the basic layer you could
build up on that and start having um contractual relationships to strengthen that but it really is a case of buyer
and seller beware right exactly so that that's that's um the Anarchy level yeah
which none of this actually prevents now one up when you're saying the
contractual level um where where do you see is that
onetoone contracts again is just like uh it could be it could be a group contract
and then a click-through contract where it deals with you directly or like it it really does depend
on you know what's at stake is it an NDA in which case everyone can just sign a standard NDA
that says any other member of the dream catcher here's the rules under which I'll hold your information uh
confidential that's one example so what we're doing there I think we're on to
something here remove the really the one up from Anarchy stuff cuz whoever
pursues an NDA um that is inside the platform a can offer an NDA because who
wants to go and search for an NDA that's right that's right and so that that would start to need um you you
could um have those things be detached where they are from the individual
offered to any takers or they could be using a Gateway
where the Gateway is somehow involved to perform some kind of uh recourse or
legality for the contract it really does depend I don't know what I don't I don't
have a good list in mind for them but you know it could be employment contracts it could at the top end it
could be esro Services as another one yeah and that's that's getting quite high up at the NDA level um all you need
is platform a and platform B uh have agreed through a mutual Gateway that
we've got one NDA yeah we're both offering the one NDA you sign it here and it's good there yeah something like
that who really cares about ndas yeah but I think the this the point I want to
push on between those two platforms is that if they are if they
are non-adversarial and are simply separate for identity sake resources sake
branding or and if they actually don't disagree on the attribution algorithm if
they're running the same attribution algorithm then you won't
need you if you do something if you bridge across and start
consuming a service that's running on platform 2 but your majority of your services are running on platform
one because those platforms will cooperate together through software to produce the same result for contribution
and for attribution they act as though they were the same
platform yeah yeah that's true I mean if that uh if they're both identical one is
running on AWS one is running on denl yeah um but at the uh kind of The
Logical layer theer they're exactly the same they're the same system yeah that's right that's
right the um uh the uh again follow
following the cach depending on where the things are consumed mhm it's it's a
bit like um a trade agreement right uh so um inside the EU everyone agrees on
the same rules yeah um now one above that uh comes down
to things like uh if if you do uh burn resources in someone or or
let's say in this case uh the nap that the trader has put money against and therefore it's being contributed and you
know the rules are right um and it's generated some cash that cash uh is by
users or actors consu consumers sorry consumers on platform 2 platform 2's got
that cash now and it needs to get it to this Trader on platform one so it needs
to give cash from platform 2 to platform one who gives it to the account of the
trader yep um now that cash transfer um I think is
when we get into the next layer which is like um an agreement of some sort why do you
keep saying agreement why does it need an agreement because of um EML um what
if it's eth what if it's Bitcoin well okay um what if uh platform
2 um accepts Bitcoin and uh has a strape account uh doesn't want to lose stripe
account because stripe is looking out for anything that blows up in their face yeah and has a big
business uh in that case you would need some kind of an um some kind of
contractual thing to get you access to that platform or you could use an
exchange service to get um swap out your
I'll call it dirty money just because it's dirty is definitely a subjective
thing and then you get clean money and then you go around and you spend
that right right um but but it's just the fact that the fact that you don't
have to have an agreement necessarily you could you you it's useful to be able to have an
agreement but there's a lot of uses that you don't you don't need it and I'm just
a little bit um the suspicion is Dawning on me that I
might be complicating the situation by bringing in the concept of having
multiple compatible collaborating platforms all at once like it really it
doesn't really matter it ends up at the same result anyway whether we can like
that really does become an implementation detail I think it's a crucial one because it means that you
should trust this platform because it can't be taken over by Any Given person
and you can sort of fragment off your own piece any time like that's important
but it I think it does wildly complicate the reasoning about the context diagram
because I think we should just view the many platforms as just one for the sake
of uh for the sake of reasoning yeah I'm I'm starting to doubt
the need for getways at all oh dude you can't why are you always 100% on or just
0% off like that is not
100% if that was 100% then oh you kind of flipping between like everything
involves the Gateway and then you're like maybe I don't even need a Gateway and like I'm like the gateways there
only for some types of activity which are the types of activity where
you want to interact with a legal institution or legal entity but you don't want to have to go through the
rigar of setting up your own one y um which sounds a lot like a nap
as opposed to a separate thing no the Gateway has to be a legal entity and it
has to have a way of allowing use of its legal
entity from the plat form so it can't be an nap it isn't a nap it's like yeah
yeah it could but all you're doing is like it could notzing the contract it's
not it's not able to be an appp it's the same as like a computer server like a computer server is not an
appp so what um we're talking about layers here and I think we're making progress because we got the gray area
there may need to be agreement there may not be U at what point would someone use
a Gateway and in that two platform situation so things are getting serious
now let's do a joint venture can we can we can we ditch the
two platform scenario cuz I don't feel like it helps any uh like I think I think I think you
can ask you the same question yeah yeah your question is still valid on a single platform uh two users or two actors want
to join into um a joint venture that will consum resources um
can I have an example like just a silly example of what the Venture is uh sure uh they want to
um use naps to Arbitrage crypto so they want to make some naps to
Arbitrage and use the hosting platform with the goal of arbitraging crypto for
for Fun and Profit yep yeah and in agreement that is 50/50
see okay no forget that forget that last doesn't add anything they have an agreement that uh their contributions
are recognized through attribution okay cuz that's really the use case we want to support okay all right and then so
they would uh were was there more to the scenario that is useful TR trying could
it simple that's okay that's pretty simple and what's the question about the scenario
um so the question is is that the point where they're using a
Gateway no why would they use a Gateway at that
point uh okay so umang on why would they you you
said yeah um why would they use a Gateway well this this comes down to my
my doubt okay so let's go one up I can see you give me you give me an example
of what point any Gateway oh how about let's stick to this scenario I'll give
you an example of when this scenario would use a Gateway yep
um they would need to um set up
a um an exchange account with binance
for example and so they would need to
set up a legal entity that can do that if they don't want to do it
personally and so that's what they' use a Gateway for okay so at that point both these two
actors uh through the platform yep they got you know some do you want to
escalate to sign up here's the Gateway services available bance you both say yep you go to
binance uh no hang on what they're doing is They binance isn't going to sign up
with these mysterious internet users binance needs a legal entity to bite its
teeth into mhm and so the Gateway is that legal
entity and acts on behalf of these people
um operating on the network okay so um that in the binance
example uh actor a and actor B we'd have to go um to the Gateway and do that
whole thing about showing your passport Tak your video passport all that kind of
thing no not necessarily some of the services that the Gateway might offer is to say look we have um
directors for hire we have um service addresses for hire we can set you up a
company where you pay us a fee and then these these um
directors they run your company they're responsible for it so they're going to keep an eye on what you do and make sure
you don't do anything that gets them in trouble but they will do they will offer their service for
you and then those people would go through the process of um signing up to
a binance account okay and uh presume the Gateway would have some preferred
jurisdiction uh well it is it is a jurisdiction it
exists in it it must exist in in a jurisdiction and you would pick one of
the gateways that suits your purpose suits your cost and then off you
go yeah um and the uh articles of Association of
that would be uh refer to platform a they would be derivatives of platform
attribution our go yeah that'd be derivatives of the the standard Gateway Articles of Incorporation if you want to
go outside of that then you need to go and set up your own thing right so um
there is a gateway that you can set up this company um and that company goes
off and gets it if someone else wants to do you know something similar act C act
D they get a new popup company mhm um and uh
the um the agreement uh the articles of Association of both companies yeah point
to an look the whole the whole the whole point of the Gateway is is not NE I mean
you gave me a scenario and I gave you an answer as best I could see it fitting in but it's not really the type of thing
that I would uh feel comfortable the Gateway being used for you could use it for that but that is um the the purpose
that I see for the Gateway ways is to help people who are trying to start a venture just get going and it's it's
about making a way for them to create a vehicle for them to operate that makes
it so easy to use ambient attribution as a means of replacing cap tables because
I see so many people like you take um our mutual associate uh from Full
Spectrum how many hours would have been spent arguing about the cap table
talking about the cap table how many I think I think he's still doing it um but that's the problem right and and and and
we're saying that we've got this new model of um cooperation which is Ami attribution where it's all handled by an
AI we need the gateways to provide a an exemplary easy to get going version that
upholds that for you without any of the like the years and years of [ __ ]
around it took us to even figure out what the first company sort of maybe might look like let alone actually apply
it and so the gateways are actually yes you could use them for doing your
banking or doing this and that the real point of them is that if you want to get
going with ambient attribution and you need a legal entity to give you some sort of official dim and sign up for
lowrisk things like you know getting a telephone bill or something like that
you need to or we need to provide that service through gateways the ambient
attribution ready little modules it's like a little a little blade in a server room that's like this tiny little high
performance thing it's pre-provisioned it's got all the basics for am attribution you can't misuse it you
can't break out of the containment box that it gives you and if you want to do
something more than that or disagree with the attribution element then you need to go somewhere house but it's
basically ready to go within like an hour of you deciding that it's time okay
so at that point um at that level we're actually starting to SP um so the base
compute storage DNS um that seems like that is the
platform's problem yes uh nothing to do with the uh uh
gateways the um the gateways are and there's many services uh offering popup
companies uh essentially a popup company MH that um has articles written that
points out platform correct and it's like if you want to
have a JV if you want to have a partnership if you want to have a limited company in the jurisdiction go there boom boom boom boom it's a it's to
give you a very lightweight official legal entity to start your
project with and it comes pre-provision with am attribution built in this is
starting to make sense uh looking for computers it's not attached I was
looking for that those texts that are sent over and you give a list of services I can get that I can get that
back for you previously um I was lumping ORS in I am your friendly split out
computer operator computer
computer computer so you sent over a list uh my
uh I'm having a bad Computing experience right now last time you had a good competing
experience well actually when you're using our system
ironically uh right there you go so um
go down it starts with
identity there okay so these are types right these are groups right uh so
just you check off each of these about whether they are in a Gateway or in a
platform or in the platform okay identity um has a um a software
interface in the platform that represents how identity is
um Works within the protocol uh identity can be provided by
a decentralized identity such as an ethereum wallet or it can be provided by
a um identity service like privy the identity service of privy
would use a Gateway only only for the fact that privy needs a
legal agreement with some entity now we could sorry we could
anytime that I say that you could use a Gateway you could also use your own company like we
could go set a company up in Delaware and it can have a relationship
with privy and that can provide the identity that can fulfill or the
identity interface that the platform protocol needs yeah you can hand drill
it if you want yeah yeah yeah is that is that a sufficient answer U there is one
followup though um is identity ever needed in the platform then
everywhere uh by identity I mean q not um that's just that that is
identity but that's um that is
uh an expansion on Identity or the addition of properties to it that's
verification of identity that's not identity itself it's um it's like when
you need to deepen the identity and relate it to government institutions that's kyc and so that
would need to that would need to go through a Gateway or a road roll your
own legal entity got it so if we um split identity into two subtypes yeah
kyc and authorization normal password you know
hash whatever right yeah so there there soft your software identity and then there's the
um the legal identity and anytime you need a legal identity you would be using
a Gateway service or some other kind of legal service that's in the platform now
it doesn't have to be a Gateway but it probably is easier if it was okay so
moving we can move kyc into Gateway and keep authorization inside of
platform yep okay so for payment where does that go that would be payment again
is a yeah similarly yeah so payment is an interface within the um software that
permits anybody to issue an asset um and transfer assets
around um if you want to move
cryptocurrencies then all that is required is a software module that
Bridges between um our protocol and the BL the blockchain where the asset is
held um I would hope that one day we can include a native currency in us so that
the interface could be fulfilled by something in software as well but that's
a little bit down the road um if you want to use legal money legal tender
then you will need to use a gateway to do that and depending on your
jurisdiction and your usage of that money you may need to have gone through kyc and AML
okay so um inside of the platform uh whatever the platform
decides you can get paid out in crypto you can get paid out in the platform
doesn't decide the platform doesn't decide it's the the Traders the
participants decide what they will accept and you know they have what they
have does it go through the platform or is it just uh Trader to Trader it's like right you owe me now this send it out um
off platform well it has to be off platform
because the the platform just holds a record of external value that's being
moved around and it needs to reconcile with that periodically if it's a physical thing like a cow you need
someone to assert that the cow has moved and if you trust that um I mean the the
large consequence of that is the um the platform needs to have awareness um of these yeah so that's yes
so that's part that's part of the software payment features where it's like you
can um set up an asset for something and you can transfer it to people and then
you can sort of um verify that it has being transferred just just like how you
would uh set up an ethereum transaction you can the platform can definitely do
the transaction but it will need to wait a period of time for the next blocks to be mined in the ethereum chain before it
can verify that the transaction did indeed complete that's just reconciling
and the platform would also uh potentially if uh say you wanted to deal only in Fiat and uh the platform offers
a stripe you know integration uh then uh they get uh
clawback yeah charge back charge back as possible yeah yeah but it's not in that case it's
not the platform that's offering it it is a participant on the platform has
issued some stripe currency that has the properties of being claw back a bull uh
charge back a bull and so if you choose to accept it you accept it with those
caveats right but the actor doesn't need to go and get their own um stripe
accounts uh s about that not if they not if they're using someone else's if
they're using another if there's a stripe provider on the platform yeah they just need to give
like a destination so like okay I'm mod $100 uh you tell a platform through the
platform here it is um and then the transaction is done
why would you ever be owed money in this system well uh at the dispersal event of
any attribution there's money exchange see if uh but it's not
owed oh yes it is it's not a debt what
it's uh you know um a appp is uh generated
$1,000 uh attribution algorithm is decided that $100 of that should go to me
that or is that the wrong word I don't know I'm mod that the attribution algorithm has
stated that there's $1,000 to be distributed and I got a $100 for
that uh you
H in that case you would have that and then you would have
to like you're I think one example is that if you got paid that on
the platform and then a charge back occurred you would then lose that mhm
right so yep that would just be a pass through anyway because it's stripe who ensures for the charge back not the
platform well the platform the platform's just
um um the platform's not not a legal
entity the platform doesn't have a bank account the plat form is just simply a record
keeping um a record keeping system and so it it can record what
happened like you it transferred 100 stripe dollars to you as
attribution and then the stripe dollars were charged back it can record that but
the platform itself is not an entity is not a legal entity uh it needs to have an
association with the legal entity for example if you um the platform says
right uh okay here's a uh free tier and this tier you're going to uh put $200
into your account that money's got to go somewhere that's not the platform the platform is
just software um the running instance of the
platform so in the case of uh dreamcatcher in that previously you're
saying we don't want to we want to charge for Consumer y um where does the
money go into a bank account somewhere it's transferring from yeah but it's but it's
it's held by the legal entities that took the money and it's paid out to the legal entities that
have that are um owed the money sorry I see what you mean by owed but owed the
money um or or have the have the rights to redeem the
money from the records of the platform um it's not it's not ever on
the platform the platform's just the records of the system and if
the platform wants to charge say 3% for
providing the service I think I think this is the heart of our issue you keep saying the platform like the platform is
an entity when it's not the platform talking at the legal layer and yeah and at the legal layer the
platform the platform is not the platform is not a legal
entity the gateways are legal entities okay so same same question say
if um dream catcher uh can we name it can we name it separate cuz like I feel
like the main robot army um see uh sets
up a bunch of servers yep that uses the protocol so it sets up a Deno um
instance of the of the platform software and it says hey come to robot
army.com and use the Dreamcatcher yeah and we will take uh you know $10 a month
for using the platform or right same and so the users would sign up to that by
coming to the coming to the URL entering their stripe details and the the stripe
the stripe processing account would be um controlled by the
robot army legal entity they would be using servers controlled by the robot
army legal entity and when we were going to pay them out anything it would come from the robot
army bank account yeah okay so that that's the legal entity when talking about Jim catcher but let's talk about
about uh robber Army I think that's that's more useful because it's um uh
it's got more traction okay um okay so um then uh now above a certain level um
there can be any number of gateways s right say if um uh robot army
uh hyphen Gateway wants to set up um uh
an ability for people to transact or create companies in Delaware
yep to use uh their instance that they're running their instance of what their
instance of the um gim catcher protocol with ATT and so on yep yep yep yep okay
yep so robot army now uh needs to um uh
produce this service this popup service and make sure that it's all koser it's
still them legally yeah it's that's just like a service that they provide yeah but root robot army then um contracts
with uh whichever Services um are needed through that uh so if uh someone wanted
to go through um uh
uh AWS um as a preference uh than Deno and
that was offered it would be the robot army who would deal with that and just
provide that service to anyone who wanted to use their
platform so robot army really is a gateway it's acting as a Gateway in that
sense yeah it's also acting as a platform host and a payment
processor yeah yeah but it's never it's never the platform that how or did
anything it's always the legal entity that's I think I think I see where we're
it's real subtle like it's real subtle but it's like I think that's really it
yeah so um in the single instance instance uh robot army
as uh as a bunch of legal obligations uh regulations
responsibilities and um liabilities yeah and one of the things it does is it
takes uh the software provided by Dream caser Foundation which I'm not even
going to touch on right now yeah and who knows where the software came from it doesn't even matter but it's got this
software set up a bunch of uh Deno instanes and the um uh do all this
storage uh DNS all that other stuff y uh and uh people come on and they're using
that in the same way as uh square space will give you a platform
to step a website y That's for it y um and there's a few bells and
whistles on that and that also allows these popup companies yeah which are not
actually fundamental to the Protocol no um but it's just nice to have it's it
makes it very much easier for you to do it it's like you could run the whole internet without
DNS but it's kind of easier it would be it be Grim yeah okay and so like running
your own website it' be like if you're on like you know dream catcher. wix.com
that ain't your own one right but if you then want to officiate yourself a little
more and get a dedicated DNS name that would be like setting up a a a trading
as relationship in a Gateway or pay a bit extra and create a subsidiary but the point is that all
that [ __ ] hard hard SLO of what should the Articles of Incorporation be to be compatible with the dream catcher
you know that's a big question and we don't even have that answer but we're going to and we're going to allow people
to replicate that very very cheaply because it's it settles so many [ __ ]
problems now um uh let's talk about the robot army level okay not not the um
protocol level y so um Android Army a separate company yep wants to set up in
a different jurisdiction yep uh using the same protocol does exactly the same
thing yep um is there any interaction between
these two can be for example in nap Discovery and the honoring of
attribution between yep if they are if they are good actors adhering to the
protocol then they would appear as one so that's that's a onetoone agreement
between robot army and Android Army what's the agreement where did the agreement come from um in the honoring
of uh for example um uh it's not it's not an agreement it's the fact that
they're running the same software oh we're back down to the protocol level though my question was is there any
agreement between them or are they completely separate no it would be like if I start a website using GoDaddy and I
start a website using Squarespace the Squarespace website can call a service
that's hosted by my GoDaddy website there's no agreement between Squarespace
and GoDaddy there's no agreement between even those two websites necessarily depending on the nature of the API call
there's compatibility that at all so some apis for example require you
to agree terms and conditions of use acceptable we use being correct and so in that case in that case there would
need to be some kind of an agreement but naps all of the Naps we've spoken
about so far don't have any of those kinds of conditions
um uh only because you know we haven't done for example weather nap that
actually cold an API that says you know you first thousand calls are free
afterwards is a you know fraction say oh right yeah but that's different you don't need an agreement to charge money
because you're not going into debt on the platform the weather app could advertise easily it's like look this is
what I do and I'm going to give you the first th000 calls free fine you don't need to have any kind of agreement for
it to say hey I want to I I need some money now you just need a payment path
to go between those two things which means that um you if you're a user on
Platform One you need to acquire some assets that are recognized on platform 2
and it's irrelevant what those are it's that payment path thing was talking about the cash uh yeah um that that path
is that that path is a a it's an interesting one but I believe it's very
easily solved because if you've got two stripe entities on Android Army and
robot army they would um in it would be in their best interest to have some sort
of agreement between them to allow the funds to be bridged or transferred between them so an exchange rate where
you they're like I'll swap this for this bear in mind that there are chargebacks
that can occur on either side and so that needs to be taken into account right so um it's really about what the
other guy will accept as payment and what the other guy has to give or has to
offer it doesn't there doesn't have to be an agreement but I think what you're trying to get at with agreements for
payment paths is really um an
exchange mechanism between them because that that exists yeah that exists a lot
in blockchain land where you have to bridge between chains in a reliable way
and so quite often the guy at each the people at each end they don't even care the the the
they're called they're called swaps generally on in blockchain land and and it is actually a very useful system
because it's like I've got this asset on this chain and I need to get it into one of these assets on this other chain
chain and then it goes off and finds you a path and tells you the cost and tells you the loss and tells you the time and
then you're like yeah let's do it bang and then off it goes mhm it's the same as making a International Bank transfer
right except it's just faster and more secure um on chain so so that's that's
all that's all that really is there okay now the the the protocol compatibility
is one that um I feel like we're almost at at um
agreement there but it's it's just like running
websites they they they are protocol compatible over
HTTP mhm but they don't need agreements with each other to be able to
interact umh they can be running on different hosts no problem and the
reason why like I I really don't wish to over
complicate this thing but the reason why it's critical to be able to or at
least have in our periphery the notion of multiple platforms is because the
core promise of portability and sovereignty dictates that you can be a
dream catcher of one if you want you should be able to take everything that's yours in robot army
um and Android army take it off them and run it on your own server in your garage
and then unplug the internet you should be able to do that that's
the it's not it's not that sounds um I uh I agree with the end part but
talk me through again soly what the structure we've got just discussed yeah so
thiss I'm a user mhm I've um paid some money into the
stripe Gateway that gives me some credits on Android Army and I've paid some stripe credits into robot army at
some point I decide that I have smoked too much weed and I just can't handle being on the internet
anymore I can take all of my stuff that's my data my naps my config
my my whatever my identity and I can take it from each of those platforms and
run it on my own computer at home and then cut off the
internet um by doing so are you removing that data or are you just duplicating it
I parking it um if it's your data
and these platforms are both honorable platforms operating in legal jurisdictions that require that they
delete your personal data on request then you've duplicated it and then told
them to delete it and the uh the tokens that you have
you mean the stripe credits yeah you can you can get a refund for that back to
your credit card at best those those are actually never
yours like even when you hold a 20 lb Scottish note that's not yours you sort
of have a license to hold it um yeah it's Pally a be Bond right
and that's the same as as stripe credits they're not yours like a lump of gold
can be yours they are held in trust for you by the platform and an honorable platform
will let you get a refund for your excess credits if you're leaving they'll say sorry to see you go um we have now
refunded these credits back to the credit card that put them
in okay
nowoh but this is the key thing I don't I feel like um every time I've presented
the multiple platform view to you it's come out wrong because it's sort
of we're talking layers um no this is not a layer thing this is a size at a at
the same layer and and I wanted to focus in on the individual because protecting
individuals rights is what this whole system was designed for and having two
platforms is the same architecture as having one platform and then one
independent user who decides to go self-hosted that's why I keep talking
about multiple platforms being critical it's the self- sovereignty aspect of it
yeah yeah if you put back to this um because I think I forgot but let me uh read back the image or the text uh the
image yeah so what we do here is rename dream catcher platform because that's
just confusing hell of us is dream catcher compatible platform yeah um I would add in robot
army who's the one who's actually making all this run yeah fiding Dent uh Etc
yeah um the users just turn up and it's whatever the platform the compatible
platform wants to do MH um in terms of providing Services part of those
services that robot army has decided is it's going to do um dream catcher
compatible uh companies and JVS and so on so you don't you don't have to Y but
they're real things y um and those real things can contract out yeah um like any
other company so you come on there and it's like this is great we're doing stuff doing I'm interacting with all
sorts of other guys and it's like hey guys uh let's set up uh it's uh Saturday
morning uh let's do Saturday morning company that uh we're going to hit this
stuck and uh we you know we're going to throp a
company because we make want to why would you ever want to sell the
company because we've got Traders why would they ever want to do
that why would you want to sell the company probably because uh yeah I think you got distracted buddy you you were
going yeah yeah no just answering one question so they uh throw up an own
company uh just because they want to uh
um sell something to another company the companies like deal with other companies
uh but they don't want to go through the hassle of it and they all want to work on the um tun cat compatible platform
provided by robot army mhm um uh Android Army um has exactly the
same setup only they're in uh the US instead of Europe okay uh and they're
using the same protocol yep um that protocol uh effectively mishes the inter
interaction between them mhm um the services provided are you know you're either in this jurisdiction or you're in
that jurisdiction so we can't M that level that's whole point of jurisdictions um but otherwise that's
moves backwards and forwards uh because it's on the same protocol and they're um
because each are good actors the robot army and the Android Army are good actors the contribution is um recorded
in the same way M attribution is uh uh there might be some nuances there
where want to choose one attribution model over another one but the rules of doing that are the same mhm and so
they're effectively the same so at that level it's like yeah okay yeah we go
through that now the uh those two
platforms are the um what it means to be
um uh gy catcher compatible is simply stated by G CER Foundation
saying this is what an app is yep these are the rules for attribution and so on
now that means the foundation really comes down to not dictating what you do about it but just um verifying pointing
out robot army platform it's like yep that is compatible yep a batch uh
Android army yes you're compatible happy days now Bad Robot
company sets up their own one um uh sets up uh what originally is a gym cature
platform a compatible platform but then changes the code in order to do
nefarious things yep so the foundation points at that and saying you're not compatible no badge Bad Robot
yep and there is for the good actors to decide okay so uh we might have uh interactions
between the two companies in order to make things easier if we need we might not because actually this is
just uh one protocol um but we're good actors we don't want to lose our badge
so we're not talking to Bad Robot yep all right I think I've got something
neat to get my teeth into there okay okay all right now um a couple of points
to pick up on that run just did there
um as a user as an as an actor when I come in to
use the robot army hosted um
computers I we discussed being me being able to pull my data off there and run
it on my own computer at home mhm I should also be able to migrate it over
to Android Army just because I chose mhm and so
moved house from us to Europe and it's just easier yeah um
but the fancy thing is that I should also be able to run it in consensus mode
on all three yes right that means that it's
it's running simultaneously lock step across all three that's that that's what
you've been pointing at all yeah like yeah yeah so that
consensus mode is really the point where that's blockchain that's [ __ ] blockchain yeah it doesn't matter where
you are because everyone agrees because they've got the same protocol and you got enough to have Quorum you got you
got enough to have Quorum like if if if Android Army disagrees with home
computer and robot army then we're going to go with the Quorum yeah yeah absolutely and uh and
then that resolves down to um uh essentially the um the chain of
contributions what's the truth let's get to consensus on the chain of
contributions between them all because they've already been uh you're compatible you're compatible you
compatible now we need you know a consensus on a chain of contributions
across all three we might be talking about something um
different there uh I was just simply meaning I receive an
email and if I'm running in consensus mode across these three hosting
environments where the political control of the groups of computers is is
different between all three then receiving an email
needs to reach Quorum before from my perspective I actually receive the
email okay so for email you mean an event any event any data any anything
that changed I should be because I can migrate around these hosts I should also
be able to run them in lockstep in a
quorum yeah that's uh that makes sense like like database replication yeah yeah exactly um so an
event an email comes into one and so from that yep and from from that point
of view robot army host Android host
and my home computer host they are just simply um hosting
services and I can pick my stuff up and move it between
they have uh importantly um uh they have the reason I was looking at the
contribution is um the consensus is on
the state of the world what's just happened and emails just come in and that's recorded by one on their
contribution uh record and uh then eventually reaches consensus and then
everyone agrees that that email came in yep um and so that's the bit that um
uh kind of combines them all because they're all compatible with the rest of it um protocol and so on yeah um the the
actual outside of the protocol there's the running data the running data really is the contribution because the um
attribution module is basically just an appp which is again yeah it and and and
it should be running Inon ensus like it it is of monetary benefit that robot
army and Android Army get together and say hey do you want to run the platform
wide attribution algorithm in lock step together in consensus so that we can
have even more trust from our users that we're doing it right yeah that's really what we want
because what we to get the key
the key feature that that I want so bad is
decentralized income and you can't have that if there's only robot army hos in you can
only have it if you've got a disinterested chorum of people running
to software and deciding who gets paid what from running a qued piece of
software and that's why the multiple hosting thing is is life or death for
us right so um let me let me test this uh it Ain it ain't [ __ ] decentralized
if there's only two players oh okay like lots as many as you want okay but there
is uh the contribution record as the sour of Truth under consensus yep we got
lots of uh um uh instanes that are or hosts lots of
hosts hosts y um and each have got slightly different attribution algorithms one gives out you can't
they're not compatible they can't run in consensus then no listen list one one say uh a
stupid example one gives out gold stars gold stickers for being good based on
you know an event as they see on their attribution someone else gives out
dollars someone else gives out medals um the uh attribution algorithm runs that
is an event that goes onto the uh the central record the contribution record
reaches consensus now someone else wants to consider you know maybe they're paying
paying at dollars and it's like oh you've already had a gold sticker so that's part of our attribution so that's
going to alter it maybe get more maybe you get less don't know but you've got all that information about what the
other attribution algs have done so you don't need a centralized attribution algor at
all um but what you do need to do um for um for that
intive yeah I disagree very strongly with that I do not believe that that method is going to give you um something
that can pass the decentralized income test um because each individual party is
doing something different I think you could achieve the same outcome as what you just detailed by Simply Having
different hosts hold different assets but they reach a chorum on how the
assets should be paid out um and then the actual paying of them
happens uniquely on each host because they have their own assets like one is
like US dollar stripe issued US Dollars the other one is UK K issued Us dolls
that's separate and unique to the hosting locality but the attribution algorithm
has to be um done in a consensus reaching fashion in my opinion I don't think that
us deciding whether it is or it isn't right now helps us in any way because we we agree that it needs to
be something and it needs to be run across multiple computers whether or not it has to be in lock step
you know we can debate that at the time yeah yeah yeah we'll come back to that
um we're probably going back three years to the all right now I just want to say I'm like actually very late here and it
needs to get going the last question I want to raise is you you say often and
you said in the story you just gave then they are moving the Naps back and forth
between each other why do you say moving a nap what does that mean well it's it's mostly accessing it so I'm assuming that
why did you say moving when you actually mean accessing the uh see someone um or
are you talking about um entirely duplicating all the naaps no I'm talking
about what you mean when you say moving a nap because you you described you were like there's robot
army there's Android Army there's users on them and they moving naps back and
forth that's what you said all right what youan was was talking about but moving is still pertinent uh I was
saying that someone um using uh robot Army's uh um host yeah um discovers an
app on Android Army's host yeah and uh utilizes it but that's that's different
from moving that's not what I meant at the time no what do you mean at the time um meaning accessing Discovery testing
you know bringing everything together on two different platforms but we're not talking about the nap here uh being
deleted from here and then appearing here we're just saying Discovery we're using this nap discover that nap that I
still don't get why that means moving why the word moving would be used there I can't I can't remember using moving
however you've used it many times when you describe when you when you're when you're quite quickly rattling off how
people are using naps moving back and forth comes up a lot and I'm I'm
confused okay uh well let me uh correct myself then the uh the instance would be
um I'm on this platform uh I've put in um a prompt the Jetta goes off discovers
naps some naps are here on this storage run by this this host yeah uh somewhere
on this one this host or discover them bring them together do the testing and
there's your J all right cool okay now just to just to calibrate rate here I my
expectation of how I see the platform developing is that
99.9% of all the Naps that get used in the Jitters are going to be part of the
same shared set as opposed to say half of them on Android Army 49% on robot
army and 1% right like I'm actually viewing it as it will all equalize and
there will be the same Global set for the most part yeah yeah yeah um but in
the same way as uh you know discovering websites um they might actually be on different storages but the Discovery
Space is Unified yeah yeah the Discovery Space is Unified
um no that's still that's still different that's true but I actually envisage that the hosting space will be
Universal as well that you're that you're yeah like
kind live live live live live live well what I want to see is actually that the
majority the biggest platform is actually the freefor all platform where
everyone's donating their home resources and so whilst you can have an AWS run
host it's actually this large amorphous blob
of Home computers should theoretically be bigger than all the others and that's
the place where all your stuff okay I don't see a problem that um it's uh yeah
it's it's like having to download the chain every time you want to you know yeah so this is this is sort of like I
feel like we've hit on what I care about the most which is
this um ability to make it a a true decentralized
platform because at that point when it's decentralized then you could call it the dream catcher platform and then and
right sensorship resistance and then it can have its own currency within it um that's an intelligent AI controlled
currency um then it can be treated as a thing just like ethereum is treated as
like it is an entity it's not really but it's got so much weight behind it that
it kind of has become an entity in itself whereas just setting up a single host
and running the dream catcher software doesn't really make the platform an entity it makes the entity that's
running the platform is the entity but if you've got this coordination and this
consensus going on then the weight of all those individual entities
becomes the gives an entity like entitlement to the chain that's
what I'm trying to get at yeah and uh on that theme uh there's nothing stopping
uh Bob from down the street uh to do exactly what robber Army is doing yeah
yeah and so that's that's the only reason I bring up multiple platforms is to keep that goal in mind and I I I feel
like we made significant progress there I think there's enough meat there because I know you're not available
tomorrow but that's because it's probably going to be a couple days before I get back to you know
Well yeah if it's if it's cool I'll I'll leave you with that that that that um
that felt like Precision work there that was hard but um I think we got some great
progress um I have uh managed to do some file writing in the um in the nap
platform work I'm doing so that's sort of starting to take shape quite quickly I think um it
solves some longstanding limitations of the old platform that I'd
wanted to fix for a while so that's uh I'll take that as a win that's good I've been go buddy I'm I'm going to I'm going
to get locked in um I can I can I can stay in chat for about 10 minutes while this video
uploads um but I'll stop recording now yeah cool