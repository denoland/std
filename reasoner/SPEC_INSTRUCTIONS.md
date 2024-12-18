# Spec Instructions

How to specify a module in a formal way.

1. Identify the main input(s) your module accepts, and clearly define them as
   variables.
2. Determine the key transformations or operations your module performs and
   represent each as a function. Each function should take well-defined inputs
   and return well-defined outputs.
3. For each operation, assign a simple name (like $g$, $h$, $i$, etc.) and write
   a short English description.
4. Arrange these functions in a logical order, showing how inputs flow from one
   function to the next until you get the final output.
5. Represent the entire module’s logic as a mathematical or logical formula by
   composing the defined functions.
6. Summarize the workflow in plain English to provide a high-level explanation
   without code-level details.
7. For documentation, produce a Markdown file incorporating both the English
   summary and the formal formula. Use inline math ($...$) for inline
   expressions and block math ($$...$$
   ) for equations, because GitHub natively supports this LaTeX-style math
   syntax using KaTeX.
8. Keep the explanations concise, focusing on the essential logic rather than
   implementation details.
