text conversion must preserve the paragraph structure and page numbers for the
purpose of making accurate citations.

A text reference might be mapped back to the json representation of the pdf so
that we can actually highlight the text in the pdf, given its geometric layout
as well as its content.

The output text format from multiple formats, such as pdf, docs, html, should
always be the same, and so we need some kind of fidelity testing to ensure
things are the same.

Conversion of an unknown doc should be attempt to be done programmatically, but
if not, start using an LLM to try to recognize what is going on and guide its
conversion.
