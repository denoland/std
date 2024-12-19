the napp used to modify stucks, and to search for them.

holds within it the json schema format for each stuck.

knows how to store them on the filesystem, in a way that is scalable.

manages a large folder of them, in a way that is efficient.

stucks are stored in a json object.

Enables wrappers around the outside, such as expressing the relationships
between them, which need not change the stuck itself, and can be subject to many
different forked views.

Funding is another wrapper, which depends on who is QA.

solutions are a similar structure to a stuck, but they point to some stucks as
their targets.

Solutions can reach different lifecycles / milestones, like passed by QA or not.
