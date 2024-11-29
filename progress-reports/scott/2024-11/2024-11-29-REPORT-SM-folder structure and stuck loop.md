# Progress Report: Folder Structure and Stuck Loop Process
**Date:** 2024-11-29  
**Author:** SM

---

## Overview

This progress report details the recent proposals and updates concerning the repository's folder structure and the refinement of the Stuck Loop Process within our platform and the addition of the inventor notebook.

---

## Folder Structure

Analysis of Folder Structure Changes
1. Inventor Notebook
  - @inventor-notebook/
  - Created with subfolders:
    - raw/
    - scott/ (containing proposed-by-others.md)
    - tom/ (containing proposed-by-others.md)
    - transcripts/ (containing dated conversation transcripts)

2. Key Changes Made
  - Creation of named folders for each contributor (Scott and Tom)
  - Intended purpose of the inventor notebook is to provide a space for each contributor to propose new ideas, to track their progress and to cross-reference ideas and concepts between notebooks.
  - Creation of Proposed-by-others Records
    - Intended to track proposals based from other inventors without the need to clone or edit that inventor's notebook.
  - Creation of Transcripts Folder
    - Intended to contain dated conversation transcripts, but not yet used for that purpose.

## Stuck Loop Process Refinements

Recent updates have been made to the Stuck Loop Process to ensure that all [Stucks](stuck.md), regardless of type or data availability, are addressed methodically, resulting in the development or improvement of a [NAPP](napp.md).

### **Key Updates in `stuck-loop-process.md`**

#### **Purpose**

- The Stuck Loop Process was previously implied in stucks.md.  The process is now explicitly defined in `stuck-loop-process.md`.
- It aims to capture the process of transforming a Stuck into a NAPP or improving an existing NAPP.
- Now involves Quality Assurance (QA) through evaluation and testing.
- Incorporates iterative improvement via feedback and data to ensure changes do not result in a failed evaluation.

#### **Additions**

   - **Direct Stucks**: [direct-stuck.md](direct-stuck.md) Identified through explicit reports from [Actors](actor.md).
   - **Implied Stucks**: [implied-stuck.md](implied-stuck.md) Detected through system monitoring and analysis of user behavior patterns (e.g., using [Analytics](analytics.md)).
=
4. **Evaluation and Testing**

   - **Quality Assurance**:
     - Utilize both automated and manual [Quality Assurance (QA)](qa.md) methods.
     - Test the NAPP to verify it effectively resolves the Stuck without introducing new issues.
   - **User Feedback**:
     - Engage Actors, when appropriate, to gather feedback on the proposed solution.

[Refer to `gold-definitions/stuck-loop-process.md` for full details.]

---

## **Action Items**

- **Implement Folder Structure Changes**

  - Review and agree upon the proposed folder structures.
  - Establish separate areas for gold definitions, personal exploration, and work reports.
  - Set up a staging area for definitions to facilitate collaborative editing.

- **Update Definitions**

  - Incorporate the refined Stuck Loop Process and NAPP definitions into the gold definitions.
  - Ensure consistency across all related definitions and documents.

- **Enhance Work Processes**

  - Begin summarizing threads at the end of each day.
  - Utilize AI tools for diff analysis, summarization, and structuring thoughts.
  - Store threads and transcripts systematically for future reference.

- **Quality Assurance Integration**

  - Emphasize QA's role in evaluating and testing NAPPs within the Stuck Loop Process.
  - Update QA methodologies to reflect new processes.

---

My thoughts:

1. When asking to check for the internal coherence of the gold defs, there's a marked difference between LLM models.  Without evals, anyone making changes can get into chasing their own tail by simply asking whether gold is still even self coherent.  Of the models 01 is definitely the best.
2. O1 however has a lousy memory.  I had to start a new thread each time when I wanted to get it's more accurate answer.  Context window, hey...
3. Context/prompt combo selection is REALLY important.  E.g. I asked O1 to check for internal considency for all of gold-defs, and it produced a bunch of changes that each seemed reasonable, but which would have dropped a lot of info and nuance on the floor. Should be checking for this.  STUCK: in due course, a NAPP that was trained to look out for this will be necessary.
4. We can't rely on LLM to do the eval.  I know I gave that a 20% chance.  Withdrawing that.  Perhaps an Eval aware NAPP could do it, but relying as I had hinted that o1 is smart enough with just the gold defs is wrong.  Junk that idea.
5. That NAPP also needs to be kinder in not only running the evals, but also pointing out the implications of the changes proposed.  Or at least summarising the diffs.
6. Even on this short evening on tightening up the gold defs it's quickly apparent that complexity grows exponentially, and interestingly grows more quickly when there's more NL in the defs.  This is more a note for me, but there seems to be a sweet spot.  My starter for 10 is that no definition repeats anything else in another definition.  It defines itself, and it's relationship and expectation with other defs, and nothing else. 
7. Now hands on, I'm starting to suspect that grouping defs a bit like Napps would be helpful.  Not sure yet, but reduces complexity.  E.g. I don't want to have to be asked about a change in Impact Crystals necessarily when talking about Direct and Implied Stucks.  Sure, they're connected, but at arms length.  In the same was as we've to figure out how to nest NAPPs e.g. through MCP, there seems to be something in saying that any relatively complex system that an AI is asking whether it's ok to be changed should be talking in chunks which can be altered if necessary in iterations.  E.g. i want to change stucks.  Cool.  What's the first order connection between stucks and anything else.  Consider only that.  Done.  Now, that chunk I've just altered, what other chunks are second order now I've sorted first order.
8. NOTE TO SELF:Where we want to get to is the situation where the Actor is like a General.  Don't tell me the details, tell me how the war is going...
