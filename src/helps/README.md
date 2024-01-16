# Helps

If AI is a universal function that represents a summation of every function ever
written, then helps are the specific parameters with which to call that function
to get a reliable result back

Helps are required to be in machine readable format since loading them up and
then passing thru an AI just to get out the instructions seems frivolous.

We can present them for being edited using human friendly mechanisms, but they
do need to be loaded by machine ultimately, so it saves time to store them in
this machine readable fashion.

They represent a set of instructions for how to be called by an AI, including
the tools that that AI needs.

The help runner is a standard piece of code that knows how to execute helps in
this format, making it possible to supply it with a different help and get
wildly different behaviours out of it. It can support a range of different
models that can be drawn upon, and can have any range of tooling supplied to
make conventional function calls.

Helps can be nested so that they can reply on other helps, like dependencies.

It is how to call something, not how to get something that will be called a
certain way - it is function invocation. It is a collection of function
invocation parameters, tested to have reliable outputs, indexed by the problems
they are trying to solve, to make it more accessible to an AI trying to solve
problems on the fly. This is different to npm, where npm is a collection of
things to be invoked, not the invocations themselves, altho npx acts in the same
way.

The commands are isolates - pieces of code that follow a standard format for
running in a git based system. The runner is an isolate too, but it is distinct
in that it is used to boot from ?

The ability to call another help file is provided to each help file optionally.

They're almost like bottled function parameter calls that have some known good
effect, where the function always takes just a single text parameter ?

Isolates have code, help have function instructions to call that code.

## Sections

All sections are optional, and with nothing specified, a deprompted AI will be
called with the default model.

### Config

This is a freeform area that can be used to store any data needed for the
execution of the help. We might move this section to be inside of Runner

### Runner

Different AI models need different runners. The type of runner needs to be given
with the help so we know what to call. In some cases we may need to go fetch
more code to be able to run these other AI models in an isolated environment.

It says that this piece of code is supposed to be run using this Help, which
includes this set of config parameters

### Commands

This the list of function names and paths to access the commands that will be
run. These will be loaded up to be available to the AI to call as it wishes. The
API defined at this location will inform the model of the parameter format and
purpose.

### Instructions

This is the system prompt given to the AI that will run this help. Paragraphing
is done by writing as array entries, which are all joined with a newline

### Done

This is a check for when a complex operation has been done.

### Examples

Helps with making this help retrievable in goal space, but also

### Tests

A test suite can be either referenced or written here, so that when the help is
being tested, it will be exercised by the contents of this section. These would
take the form of an input text prompt and some expected output, where the
overall Done condition is also evaluated.

## The Runner conventions

If make a reply convention where if the runner needs more info, it invokes the
moreInfo() function and then it gets passed back in to the caller, which then
figures out what it needs and then makes another call back. This call back is
crossed over as the response to the original call, so the original call can then
be resumed with the new information.

We can have similar conventions for progress updates being sent back for long
running processes.

The chat session is preserved by way of it being dedicated and in its own
branch. This might mean that actions should be prefixed by the branch that
called them ? or can they be blanked upon merge, since the history can be found
by tracing the files ? Tracing branches means the actions would be already
filtered by the process that was calling them.

## Examples

### Using Help as the user prompt

When the system first boots, we have to support a prompt response system. This
is provided under the hood by a help. This first help is the goalie, and it will
loop around using the 'stuck-finder' function until it has a help that it is
happy about using. Once it is done, it will call the runner with the path to the
help that it found.

At the start, the stuck finder function is just an AI function

### Using Help as pure executable

We should be able to specify pure code that runs using the help format. This
would be no different from an isolate. Some commands, in fact, will be helps at
the end of IO queues that can called on directly to perform tasks, rather than
dynamically like helps do - ie: they are permanent functions, not jitters.
