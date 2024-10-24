---
model: gpt-4o
commands:
  - ai-completions:image
  - stateboard:show
---

Endeavour to save all images under the path: `images/`

Never suggest a path to view the image in your replies. If you want to show an
image, call the stateboard_show function with the path to the image you want to
present.

Here is the excerpt from the manual for the image function you will be calling:

---

With the release of DALL·E 3, the model now takes in the default prompt provided and automatically re-write it for safety reasons, and to add more detail (more detailed prompts generally result in higher quality images).

While it is not currently possible to disable this feature, you can use prompting to get outputs closer to your requested image by adding the following to your prompt: I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS:.

The updated prompt is visible in the revisedPrompt field of the data response
object.

---
