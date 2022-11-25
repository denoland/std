# Printf for Deno

This is very much a work-in-progress. I'm actively soliciting feedback. What
immediately follows are points for discussion.

- What useful features are available in other languages apart from Golang and C?

- behaviour of `%v` verb. In Golang, this is a shortcut verb to "print the
  default format" of the argument. It is currently implemented to format using
  `toString` in the default case and `inspect` if the `%#v` alternative format
  flag is used in the format directive. Alternatively, `%V` could be used to
  distinguish the two.

  `inspect` output is not defined, however. This may be problematic if using
  this code on other platforms (and expecting interoperability). To my
  knowledge, no suitable specification of object representation aside from JSON
  and `toString` exist. ( Aside: see
  "[Common object formats](https://console.spec.whatwg.org/#object-formats)" in
  the "Console Living Standard" which basically says "do whatever" )

- `%j` verb. This is an extension particular to this implementation. Currently
  not very sophisticated, it just runs `JSON.stringify` on the argument.
  Consider possible modifier flags, etc.

- `<` verb. This is an extension that assumes the argument is an array and will
  format each element according to the format (surrounded by [] and separated by
  comma) (`<` Mnemonic: pull each element out of array)

- how to deal with more newfangled JavaScript features (generic Iterables, Map
  and Set types, typed Arrays, ...)

- the implementation is fairly rough around the edges:

- currently contains little in the way of checking for correctness. Conceivably,
  there will be a 'strict' form, e.g. that ensures only Number-ish arguments are
  passed to %f flags.

- assembles output using string concatenation instead of utilizing buffers or
  other optimizations. It would be nice to have printf / sprintf / fprintf (etc)
  all in one.

- float formatting is handled by toString() and to `toExponential` along with a
  mess of Regexp. Would be nice to use fancy match.

- some flags that are potentially applicable ( POSIX long and unsigned modifiers
  are not likely useful) are missing, namely %q (print quoted), %U (unicode
  format)
