Want to be able to stay on the same subdomain, and crawl the entire site. This
should be the default behaviour.

headers and footers should be ignored if possible, as well as sidebar
navigation. Basicaly ignore everything that is not the main content of the page.

the best crawler might be to read the dom and then make an o1-mini call to
extract the text from, in a clear way, like markdown.

Using o1-mini could be extended to remove duplicate content between pages.

The text output should include some prompt instructions on the content so the
LLM knows how to interpret it

Pages should be sepearated using the ascii armour style separation, or some
other notation to express the difference.

Might have the option to write each link to a different file, so we have a
folder structure of heirarchy of the site, which makes it easier to exclude
content, and allow updates to be more granular.

May store the original dom with the summary to do provenance.

Should recognize some common urls, like if it is a github url, then we should
know how to access the raw file.

Might make this pluggable, and so have things like the youtube crawler be in
here specially. Ideally an LLM would make the choice of what crawler to use and
how to parse the output, since it might be a complex multistep job.

Must set its user agent informatively.

Recognize when using a chatgpt chat, and switch to using the chatgpt crawler.
