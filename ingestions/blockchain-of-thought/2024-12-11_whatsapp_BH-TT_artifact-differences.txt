11/12/24, 11:51 - Ben Hoffman: Hey feel like the mood was a bit off when we talked. Wanted to say one more thing I think is really neat about git being the fabric in which the system natively thinks. There’s an unexplored interface between the system and the software supply chain. The system can “think” files into places that make its execution space consumable as an npm module hosted on GitHub for example <This message was edited>
11/12/24, 11:52 - Ben Hoffman: I’m sure that’s something you considered already, but I didn’t quite visualize it properly in my head until after that call
11/12/24, 11:55 - Ben Hoffman: It’s possibly a weird way to couple into current systems, but it feels more direct than wrapping them all in APIs and then consuming those APIs from a chatbot adapter
11/12/24, 12:45 - Tom Thompson 🧴: so you're talking about the benefit of publishing packages as units of work, rather than these live and mutable systems ?
11/12/24, 12:45 - Tom Thompson 🧴: as well as having the bots be provenance aware, where they know how the software got there, and how to iterate on the history to produce the next version ?
11/12/24, 12:46 - Tom Thompson 🧴: like a kind of next level introspection
11/12/24, 12:47 - Tom Thompson 🧴: but I think the real thing you're getting at is if it stays in git, then it doesn't break that whole impure compilation problem
11/12/24, 12:47 - Ben Hoffman: I guess what I mean is, if one of the bots decides to set up a remote on GitHub of its own “mind”, it can “think” code directly into software supply chains by just cherry-picking commits onto that remote that adhere to package format for whatever ecosystem it’s trying to supply into
11/12/24, 12:49 - Tom Thompson 🧴: ok that's cool, but what is the benefit you're seeing there ?
11/12/24, 12:49 - Ben Hoffman: Yeah I mean I think that’s more or less it, you don’t have to have a separate build step to make the outcome compatible with a foreign software system
11/12/24, 12:49 - Tom Thompson 🧴: you effectively killed the build step completely
11/12/24, 12:49 - Tom Thompson 🧴: there is no build, there is only commit
11/12/24, 12:50 - Ben Hoffman: I’m not sure I’m thinking in terms of benefits yet, just an interface I never really considered before
11/12/24, 12:50 - Tom Thompson 🧴: publishing to npm and jsr are just transmissions of something that could have stayed pure, if it wasn't for the need for backwards compatibility
11/12/24, 12:50 - Ben Hoffman: Like it might be a lot easier to make this system plug in fairly directly into the software of the world without adapters and wrappers
11/12/24, 12:52 - Tom Thompson 🧴: if the context of the LLM was git, then the context can be shared more readily, is what you're saying ?
11/12/24, 12:52 - Ben Hoffman: Yeah
11/12/24, 12:52 - Tom Thompson 🧴: as an anti example, if the context was all stored on Ethereum, then sharing anywhere is a copy paste rather than sharing a git commit, which is pretty universal, you mean ?
11/12/24, 12:53 - Ben Hoffman: Yeah I think so
11/12/24, 12:53 - Ben Hoffman: Let me sit with it a bit more and come up with a clearer expression of what I’m trying to communicate here
11/12/24, 12:54 - Ben Hoffman: If the agent presented itself in such a way on GitHub, I guess ultimately what would need to be figured out is what does it think of commits coming in from other humans and agents onto those files
11/12/24, 12:55 - Ben Hoffman: I’m using the word “think” a lot in an ambiguous way here
11/12/24, 12:55 - Ben Hoffman: That’s what I need to fix
11/12/24, 12:56 - Tom Thompson 🧴: so to conclude, there is value in having git be the blockchain, since it completely removes a transformation step, which adds impedance to flows, and hinders integration with the rest of the knowledge based economy
11/12/24, 12:56 - Ben Hoffman: Yeah that’s part of it for sure
11/12/24, 12:56 - Ben Hoffman: Most of it probably
11/12/24, 12:56 - Tom Thompson 🧴: that means that, it is frictionless, or native, to transmit thoughts out from the model, and to receive thoughts in, using the most common format for knowledge transmission, which is git, with no translation whatsoever
11/12/24, 12:57 - Tom Thompson 🧴: so its sort of like a git repo got up and started talking
11/12/24, 12:57 - Tom Thompson 🧴: in a fanciful sort of metaphor
11/12/24, 12:58 - Tom Thompson 🧴: so what I'm hearing then, is there is still value to pursue our own blockchain, purely for the sake of the compatibility a pure git model gives everyone
11/12/24, 12:59 - Ben Hoffman: Yes this
11/12/24, 12:59 - Ben Hoffman: Well look the world is not going to want to model time and synchrony less in the future than it does now
11/12/24, 13:00 - Ben Hoffman: Since that’s probably the biggest source of WTF in big systems
11/12/24, 13:00 - Ben Hoffman: There’s a reason the whole software industry jumped on git within a few years, make and sftp are kinda shit by comparison
11/12/24, 13:05 - Ben Hoffman: Also I maintain that the most interesting links between git/blockchain/ai will not emerge until training is fully on chain and there’s a taxonomy of models cooked right into the source tree
11/12/24, 13:06 - Ben Hoffman: That and AIs just simply won’t obviate the need for “basic plumbing” style software, so better to make them more aware of how the plumbing is maintained than less
11/12/24, 13:07 - Ben Hoffman: I’m still not convinced you need to carry a blockchain around with you to build v1 of what you’re thinking, but I am still completely convinced of the long term utility of having one in mind that fits the outcome you’re aiming at
11/12/24, 13:09 - Ben Hoffman: They just feel qualitatively super complementary to me. AIs obfuscate context, blockchains freeze context and keep it retrievable forever. You can trust an AI a lot more that you can see what it gobbled into its latent space <This message was edited>
11/12/24, 13:32 - Tom Thompson 🧴: so training being git native as a series of commits, and then calls being commits too, against a long term stable commit which is the training epoc ?

So that would mean that a model being trained like this could be consumed early, while it was still being trained, to encourage more resources to be put in it, whether you sponsor it with money, or with compute resources.
11/12/24, 13:33 - Tom Thompson 🧴: so getting training on chain is something we should totally be going for, you're saying ?
11/12/24, 13:33 - Tom Thompson 🧴: and then using ambient attribution to pay back to people who did training work
11/12/24, 13:35 - Tom Thompson 🧴: yes, and further they should be the plumbing themselves, with actual software only used in cases where scale, speed, cost are an issue
11/12/24, 13:38 - Tom Thompson 🧴: I think this is the key concept
11/12/24, 13:39 - Tom Thompson 🧴: I think the only reason not to carry one with us is the build cost.  After the last few days, I feel like the cost just fell thru the floor with o1-pro
11/12/24, 13:39 - Ben Hoffman: Yes, training data being committed into a payload layer or git lfs for hash provenance followed by commit triggered compute that results in a new model being checked in. Training is deterministic I think, so it’s a natural fit for on-chain, and then you get a free taxonomy of models baked into the source tree structure by just cherry picking training data cross branch for new models
11/12/24, 13:40 - Ben Hoffman: Very easy to create “cousin” models and have good training governance in such a system
11/12/24, 13:40 - Tom Thompson 🧴: training and execution can be deterministic if configured to be so.  I was hoping to use this as a proof of work system to fortify the network consensus
11/12/24, 13:40 - Ben Hoffman: Hell yes
11/12/24, 13:41 - Tom Thompson 🧴: rather than having consensus dorkily separate, and worse having its own economics like a token issuance that is all tangled up in there
11/12/24, 13:41 - Ben Hoffman: It will happen eventually when people realize hugging face and GitHub could be the same thing
11/12/24, 13:42 - Ben Hoffman: This is a god tier idea. Proof of actually useful work
11/12/24, 13:42 - Tom Thompson 🧴: or rather, should be the same thing
11/12/24, 13:42 - Ben Hoffman: Yes
11/12/24, 13:42 - Tom Thompson 🧴: yeah well that's what I've been trying to fucking do this whole time 😅
11/12/24, 13:42 - Tom Thompson 🧴: but baking ambient attribution in there too
11/12/24, 13:42 - Ben Hoffman: Yes I think you’re seeing it
11/12/24, 13:43 - Ben Hoffman: What I was seeing I mean
11/12/24, 13:43 - Tom Thompson 🧴: so its part of the actual next tick of the global system, is attribution
11/12/24, 13:43 - Ben Hoffman: No better way to make them “be the plumbing” than making them be the source repos
11/12/24, 13:44 - Tom Thompson 🧴: so enabling the llms to be the plumbing workforce, by connecting up to git, npm, etc ?
11/12/24, 13:44 - Ben Hoffman: Yeah build cost for sure
11/12/24, 13:44 - Tom Thompson 🧴: so if a Napp is also the repo it lives in, then it is sort of a repo that is alive, and can commit to itself, as well as manage other repos
11/12/24, 13:44 - Ben Hoffman: Yeah
11/12/24, 13:46 - Ben Hoffman: And, crucially, other peoples’ commits can become part of its domain of analysis, which should eventually teach AIs to “understand” human commit streams, which are a type of political information
11/12/24, 13:46 - Tom Thompson 🧴: ok
11/12/24, 13:46 - Tom Thompson 🧴: I was thinking after our call too, and whilst we are seeing point solutions pop up for pieces of the dreamcatcher, there is still no unified solution, which I think is essential.  Furthermore, the unified solution should have zero friction back into the established knowledge net, so I'm thinking there is a benefit to keep going with our own pure blockchain piece.

Yesterday I used o1 pro to produce a software module entirely from prompting.  https://jsr.io/@dreamcatcher/concat

This gives me hope that actually, if we do things right, building artifact might not be nearly as hard as previously thought, since I think I can prompt large chunks of it.  It's almost as tho not being able to prompt it is a fatal sign ? like code should be able to be generated from prompting a smart model, or else the design is bad.
11/12/24, 13:47 - Ben Hoffman: I think learning how to understand commits and eventually incorporate them into the training data will give AIs a better shot at understanding consequence, time, politics, group dynamics
11/12/24, 13:48 - Ben Hoffman: And if the AI processes via commit, then understanding commits gives it a type of introspection
11/12/24, 13:50 - Tom Thompson 🧴: they could even begin to understand themselves, as they see their effect on that plane
11/12/24, 13:51 - Ben Hoffman: That’s pretty exciting
11/12/24, 13:51 - Ben Hoffman: Yes!
11/12/24, 13:51 - Ben Hoffman: And yes, agree to “not being able to prompt is a fatal sign”
11/12/24, 13:51 - Ben Hoffman: I really like that
11/12/24, 13:52 - Ben Hoffman: Smart right from the outset, no bits that can’t be queried in natural language
11/12/24, 13:52 - Ben Hoffman: It’s a type of transparency guarantee
11/12/24, 13:52 - Ben Hoffman: Hopefully the ai doesn’t lie about stuff tho lol
11/12/24, 13:53 - Tom Thompson 🧴: lol at least if it does, it will do so repeatably.  

I think this is the stongest case for on chain training - its not open ai unless the training process is repeatable too
11/12/24, 13:54 - Tom Thompson 🧴: ok well I think you've given me the confidence to continue building artifact
11/12/24, 13:54 - Tom Thompson 🧴: its VERY SUBTLE, what you say
11/12/24, 13:54 - Tom Thompson 🧴: but it is a genuine
11/12/24, 13:54 - Tom Thompson 🧴: advantage
11/12/24, 13:55 - Tom Thompson 🧴: so the punchline is, an execution framework that is git native
11/12/24, 13:55 - Tom Thompson 🧴: where the LLMs don't just do the commits, they ARE the commits
11/12/24, 13:55 - Ben Hoffman: Yeah I think so. Just knowing how important git is, and how it’s really the structure that we all politically align on
11/12/24, 13:56 - Ben Hoffman: Yes!
11/12/24, 13:56 - Tom Thompson 🧴: yeah its so common its forgotten about hey
11/12/24, 13:56 - Tom Thompson 🧴: its like air
11/12/24, 13:56 - Ben Hoffman: Yeah
11/12/24, 13:56 - Ben Hoffman: That’s a good way of thinking about it
11/12/24, 13:56 - Tom Thompson 🧴: ok thank you 🙏
11/12/24, 13:57 - Tom Thompson 🧴: such rough times these days - feels like sound barrier type of problems all the time
11/12/24, 13:57 - Ben Hoffman: Yeah I think it’s the singularity
11/12/24, 13:57 - Ben Hoffman: I guess I never thought of the singularity like a sound barrier
11/12/24, 13:57 - Ben Hoffman: Have the right design or get crushed by the energy
11/12/24, 13:58 - Ben Hoffman: But it seems obvious once you frame it that way
11/12/24, 13:59 - Tom Thompson 🧴: lolololo
11/12/24, 13:59 - Tom Thompson 🧴: that is actually 100% how I feel every day
11/12/24, 13:59 - Tom Thompson 🧴: oscillating rapidly between crushing energy waves and serenity
11/12/24, 13:59 - Ben Hoffman: Also I still get too attached to things so I hope I’m not pushing you in the wrong direction
11/12/24, 13:59 - Tom Thompson 🧴: lol
11/12/24, 13:59 - Tom Thompson 🧴: no I don't think you are
11/12/24, 13:59 - Tom Thompson 🧴: the difference is clear
11/12/24, 13:59 - Ben Hoffman: Ain’t it the truth
11/12/24, 14:00 - Tom Thompson 🧴: and then when you remind me about the utility of genuine proof of computational work
11/12/24, 14:00 - Tom Thompson 🧴: all the other blockchains have some dorky consensus with a token and they're always wedlocked to it
11/12/24, 14:00 - Tom Thompson 🧴: like it is their whole identity,
11/12/24, 14:00 - Tom Thompson 🧴: and they can never be upgraded to change that core thing
11/12/24, 14:00 - Ben Hoffman: And they all create extremely toxic cultures because of it
11/12/24, 14:01 - Tom Thompson 🧴: yeah its a totally unnecessary thing, too - like it is entirely fictitious - physics does not demand it in the least
11/12/24, 14:01 - Ben Hoffman: Lots of people stressed by the big quantum breakthrough Google just posted about because the crypto in btc and eth are both not quantum proof lol
11/12/24, 14:01 - Tom Thompson 🧴: I don't think they have currencies in heaven, for example
11/12/24, 14:01 - Ben Hoffman: I will literally kill myself if I get there and that’s what it is
11/12/24, 14:02 - Tom Thompson 🧴: well with artifact, giving it quantum computation services via an api is easy, might be a fun thing to tack on lol
11/12/24, 14:03 - Ben Hoffman: Yeah it should be way less punishing to change the crypto when you don’t have an army of shitcoin ruggers trying to stop you
11/12/24, 14:03 - Ben Hoffman: Totally
11/12/24, 14:51 - Tom Thompson 🧴: so it looks like the consensus mechanism is a powerful enough difference between blockchains that building artifact just for that consensus mechanism seems worthwhile.  And thinking about it, there are many major chains that are the same as other chains differing only on their consensus mechanisms.  o1-pro had this to say about it:

Token-Agnostic Security: Unlike PoS or token-based models, this system doesn’t rely on internal currency for security. It uses the cost of computation and electricity as the barrier to rewriting history, thereby removing the unfairness or distortions introduced by a chain’s native token.
11/12/24, 14:51 - Tom Thompson 🧴: it would appear that the token massively distorts the chains behaviour and its community
11/12/24, 14:52 - Ben Hoffman: I’m glad o1-pro isn’t a shitcoiner
11/12/24, 14:52 - Tom Thompson 🧴: so I think my job is, to got thru all the big chunky bits, many of which we wrestled with at interbit in some form or other, and generate well reasoned out specs of it all
11/12/24, 14:53 - Tom Thompson 🧴: o1-pro has opinions dude.  they're quite clean tho.
11/12/24, 14:53 - Tom Thompson 🧴: its also much less enthusiastic than 4o
11/12/24, 14:53 - Tom Thompson 🧴: less exclaimation marks
11/12/24, 14:57 - Ben Hoffman: Oh thank god
11/12/24, 14:57 - Ben Hoffman: I had to add an extra prompt to 4 to tell it to hurry the fuck up and just give me the facts
11/12/24, 14:58 - Ben Hoffman: Yeah that sounds good
11/12/24, 15:14 - Tom Thompson 🧴: I've been processing our WhatsApp chat here with o1-pro, and there are some pretty good outputs:

Git as a Cognitive Substrate
Concept: Treat Git not just as a version-control system, but as a universal medium for knowledge representation—a canonical substrate into which intelligence can “think” its outputs directly.
Idea: Instead of thinking of Git as infrastructure hiding behind the scenes, imagine it as the actual “mindspace” of an AI. Commits become “thoughts,” branches become “possible worlds,” and merges become negotiated alignments of reality. This would mean that interacting with systems wouldn’t require separately building APIs or wrapping logic in adapters; the “thought process” would already be in the universal language of code and data tracked by Git.
11/12/24, 15:15 - Ben Hoffman: I like it
11/12/24, 15:15 - Ben Hoffman: 🤓
11/12/24, 15:15 - Ben Hoffman: I’m not sure I would say commits are thoughts
11/12/24, 15:15 - Ben Hoffman: Though maybe
11/12/24, 15:16 - Ben Hoffman: Do thoughts have a stream like quality or are they the lumpy thing after the stream has closed
11/12/24, 15:19 - Tom Thompson 🧴: I think to be useful, they need to be packetized, and a commit is a packet of thoughts
11/12/24, 15:19 - Tom Thompson 🧴: llm thoughts are definitely packetizable
11/12/24, 15:19 - Tom Thompson 🧴: like they start and they finish
11/12/24, 15:19 - Ben Hoffman: Yeah that’s fair
11/12/24, 15:25 - Tom Thompson 🧴: this is the chat if you feel like a browse: https://chatgpt.com/share/6758f810-286c-800b-8e2c-490e634ca002
11/12/24, 15:31 - Tom Thompson 🧴: “Can the chain’s artifacts be directly consumed by standard developer tools, CI/CD pipelines, model registries, or container registries without translation?”

that is actually a brutal question to ask of a blockchain
11/12/24, 15:31 - Tom Thompson 🧴: so brutal
11/12/24, 15:48 - Tom Thompson 🧴: this is a big deal actually - giving AI's timelines lets them infer the concept of temporality, whereas a corpus of text does not give nearly as strong a notion of time
11/12/24, 15:57 - Ben Hoffman: Totally, normal prose has a really loose internal model of time
11/12/24, 15:58 - Ben Hoffman: Imagine if they did though. Man I’ve talked to so many blockchain people that were trying to pitch me “we can make a token for your thing” and I would always counter with “how about we model my thing on chain” and their eyes would glaze over
11/12/24, 15:59 - Ben Hoffman: Blockchain culture almost completely rejects the idea of actually building anything on chain
11/12/24, 15:59 - Ben Hoffman: All they want to do is instance the same 5 libraries
11/12/24, 17:11 - Tom Thompson 🧴: They have good reason to be afraid 🪦 but that is where the value lies
11/12/24, 19:25 - Tom Thompson 🧴: I think this also applies to countries - they become all about their internal token. I wonder if you could run a whole country on ai controlled barter
