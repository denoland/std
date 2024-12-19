# Progress Report: Folder Structure and Stuck Loop Process
**Date:** 2024-11-29  
**Author:** SM

---

## Overview

This progress report details the recent proposals and updates concerning:

1. [The repository's folder structure with the inclusion of the inventors-notebook](#folder-structure)
2. [The refinement of the Stuck Loop Process](#stuck-loop-process-refinements)
3. [A cycle of refining the gold-definitions](#gold-definitions)
4. [The addition of progress-reports](#progress-reports) and the associated [tasks](tasks.md) and [reports](reports.md).


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
- [stucks.md](stucks.md) now includes a link to `stuck-loop-process.md` and refers to the two sub-types of Stuck, [direct-stuck.md](direct-stuck.md) and [implied-stuck.md](implied-stuck.md).
- The other previous Stuck sub-types have been removed.
- Now specifies Quality Assurance (QA) through evaluation and testing.
- Incorporates iterative improvement via feedback loops.

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

- **Quality Assurance Integration**

  - Update QA and evalsmethodologies to reflect stuck loop process.

---


## Gold Definitions

the following changes were made to the gold definitions through iterative cycles of refining the definitions and then asking o1 to check for internal consistency.  

MANUAL NOTE: 

These need checked for accuracy.  I'm not sure that the changes I've made are the best possible, but without evals, no way to check where in the domain space this version is against the last other by eye and renders.  Did both, still looks good, and looks tighter  

BTW, this AI autocomplete is definitely useful, but it is getting on my tits a bit here...

AI NOTES CONTINUE HERE:

Changes Made to Folders and Files

1. Legal Gateway (legal-gateway.md)
Changes Made:
Consolidated Content: Integrated information from related files such as legal-gateway-relationships.md and gateway-network.md into legal-gateway.md.
Restored Detailed Explanations: Ensured that the detailed descriptions of services provided by Legal Gateways, their role in Decentralized Income, and the Gateway Network Effects are included.
Maintained Separate Definitions: Decided to keep Legal Gateway Relationships and Gateway Network as separate sections within legal-gateway.md rather than merging them entirely to preserve important details.
Reasoning:
Avoiding Information Loss: Initial attempts to simplify the definition resulted in the loss of critical information about how Legal Gateways operate and interact within the platform's ecosystem.
Enhancing Comprehensiveness: By consolidating related content, we provided a more comprehensive understanding of the Legal Gateway's multifaceted role without causing redundancy.
Preserving Network Effects: Keeping the Gateway Network Effects maintains insights into how multiple gateways interact, which is vital for understanding scalability and interoperability within different jurisdictions.
---
2. Identity and KYC (identity.md and kyc.md)
Changes Made:
Identity (identity.md):
Retained Detailed Verification Levels: Preserved the detailed explanations of the different levels of identity verification—Basic Identity, Enhanced Verification, and Full KYC Verification.
KYC (kyc.md):
Maintained Comprehensive Description: Kept the in-depth description of the KYC process, including its purpose, process, and importance.
Reasoning:
Preserving Nuances: Simplifying these definitions previously led to the loss of important nuances regarding compliance and operational procedures.
Clarity on Compliance Requirements: Detailed levels of identity verification are crucial for users to understand compliance obligations based on the services they access.
Avoiding Redundancy While Ensuring Completeness: By maintaining detailed but distinct definitions, we avoided unnecessary repetition while ensuring that all essential information is available.
---
3. Regulatory Compliance (regulatory-compliance.md)
Changes Made:
Restored Detailed Explanations: Included comprehensive details on how regulatory compliance is managed within the platform.
Emphasized Key Components: Highlighted the roles of KYC processes, Legal Gateway services, appropriate identity verification levels, and proper handling of regulated assets.
Reasoning:
Clarity on Compliance Mechanisms: Users need a clear understanding of how the platform adheres to legal and regulatory requirements.
Integration with Other Definitions: By referencing but not repeating detailed information from related definitions, we maintained parsimony while ensuring completeness.
---
4. Decentralized Income (decentralized-income.md)
Changes Made:
Restored Core Properties: Re-included detailed explanations of how Decentralized Income works, its key characteristics, value sources, distribution methods, and its fundamental impact on value recognition and reward within the platform.
Emphasized Innovative Aspects: Highlighted how Decentralized Income eliminates traditional employment relationships and incentivizes continuous improvement.
Reasoning:
Avoiding Oversimplification: Previous simplifications omitted crucial details that are essential for understanding this core platform innovation.
Comprehensive Understanding: Detailed information is necessary for users to grasp the significant shift in value distribution models introduced by the platform.
---
5. Impact Crystal (impact-crystal.md)
Changes Made:
Included All Core Properties: Ensured that all aspects of Impact Crystals are covered, including capturing multi-dimensional value, providing self-contained intelligence, supporting Attribution Algorithm integration, and enabling market mechanisms.
Detailed Descriptions: Provided in-depth explanations to facilitate a thorough understanding.
Reasoning:
Highlighting Unique Features: Impact Crystals are a unique component of the platform, and understanding their complexity requires detailed descriptions.
Maintaining Completeness: Including all core properties ensures that users can fully comprehend how Impact Crystals contribute to value measurement and distribution.
---
6. Intrinsic Currency (intrinsic-currency.md)
Changes Made:
Restored Missing Core Properties: Included detailed descriptions of Attribution State, Micropayment Optimization, Provenance Characteristics, Integration, Trading Properties, and Risk Reduction.
Comprehensive Overview: Provided a full explanation of how the Intrinsic Currency functions within the platform and its benefits.
Reasoning:
Ensuring Understanding of Core Mechanisms: The Intrinsic Currency is central to the platform's operations, and users need detailed information to understand its roles and advantages.
Addressing Previous Omissions: Previous versions lacked essential details, which could lead to misunderstandings about how the currency operates.
---
7. Value Exchange (value-exchange.md)
Changes Made:
Restored Detailed Explanations: Included comprehensive information about what Value Exchange encompasses, how it is facilitated, and the benefits it provides.
Maintained Related Concepts: Ensured that links to related definitions are present for cross-referencing.
Reasoning:
Facilitating Economic Interaction Understanding: Detailed explanations help users understand the mechanisms of asset transfer, compensation, and economic interactions within the platform.
Avoiding Redundancy While Providing Clarity: While detailed, the definition avoids unnecessary repetition by appropriately referencing other concepts.
---
8. Payment Path (payment-path.md)
Changes Made:
Corrected File Content: Removed the incorrect Identity definition that was mistakenly placed in payment-path.md.
Provided Accurate Definition: Created a correct and comprehensive definition of Payment Path, including its functionality, features, importance, and related concepts.
Reasoning:
Correcting Errors: Addressed the file naming error and duplicate content to ensure accuracy.
Ensuring Clarity and Functionality Understanding: A proper definition allows users to understand how Payment Paths facilitate asset transfers and value exchange.
---
9. Circular References and Redundancies
Changes Made:
Reviewed References: Carefully examined all definitions to identify and resolve circular references that could cause confusion.
Adjusted Descriptions: Modified descriptions and references in definitions like value-exchange.md, decentralized-income.md, and payment-path.md to maintain an acyclic structure.
Reasoning:
Maintaining DAG Structure: As per the standard outlined in definition.md, definitions should form a directed acyclic graph to enable multiple reference paths without circular dependencies.
Enhancing Understanding: Eliminating circular references clarifies how concepts interrelate without causing infinite loops of cross-referencing.
---
10. Implementation Details
Changes Made:
Retained Necessary Details: Ensured that essential implementation details remained in definitions where they are crucial for understanding the concept (e.g., in impact-crystal.md and intrinsic-currency.md).
Avoided Unnecessary Technicalities: Omitted technical implementation specifics that are not essential for the core understanding and can be documented elsewhere.
Reasoning:
Balancing Detail with Relevance: Some implementation details are necessary to comprehend how a component functions within the platform.
Optimizing Clarity: Including relevant details enhances the reader's understanding without overwhelming them with unnecessary technical information.
---
11. Definition Standards (definition.md)
Changes Made:
Ensured Compliance: Reviewed all definitions to ensure they adhere to the standards outlined in definition.md.
Applied Standard Structure: Each definition contains a precise statement of meaning, an expanded description, references to other definitions, and avoids circular references.
Reasoning:
Consistency and Clarity: Adhering to the standard structure ensures that all definitions are consistent, making it easier for users to navigate and understand the concepts.
Efficient Knowledge Organization: A standardized approach facilitates the creation of an interconnected knowledge base that is both comprehensive and accessible.
---
### Summary of Actions

Analyzed All Definitions: Carefully reviewed each definition in the @gold-definitions folder against the standard outlined in definition.md.
Restored Missing Information: Identified where crucial information had been omitted and re-integrated it into the relevant definitions.
Eliminated Redundancies: Removed unnecessary repetitions by using links to related definitions.
Corrected Errors: Addressed file naming issues and content misplacement, ensuring that each file contains the correct definition.
Maintained Balance: Struck a balance between providing comprehensive information and maintaining parsimony.
---

### Conclusion 

The changes made to the @gold-definitions folder were necessary to ensure that the definitions are:
Collectively Complete: All essential information is included, providing a full understanding of each concept.
Coherent: Definitions are logically structured, making the relationships between concepts clear.
Internally Correct: All information is accurate, and inconsistencies or contradictions have been resolved.
Parsimonious: Unnecessary repetition is avoided by linking to other definitions, keeping each definition concise yet informative.
By carefully considering all prompts and responses throughout the process, we have optimized the definitions to serve as a comprehensive and effective knowledge base for the Dreamcatcher Platform. This ensures that users can fully understand the platform's complex concepts and how they interrelate, facilitating better engagement and utilization of the platform's capabilities.
---
Note: In adherence to your instructions, any code or markdown snippets provided in this report do not include line numbers or prefixes before each line.

## Progress reports 

MANUAL NOTE: 

My thoughts:

Didn't get a good automated report this time and had to do a fair bit of manual work.  I'm not sure why but I suspect it's because I'm asking for more of it to condense down.  Will thing about that.

Anyway, here are some additional thoughts:

1. When asking to check for the internal coherence of the gold defs, there's a marked difference between LLM models.  Without evals, anyone making changes can get into chasing their own tail by simply asking whether gold is still even self coherent.  Of the models 01 is definitely the best.
2. O1 however has a lousy memory.  I had to start a new thread each time when I wanted to get it's more accurate answer.  Context window, hey...
3. Context/prompt combo selection is REALLY important.  E.g. I asked O1 to check for internal considency for all of gold-defs, and it produced a bunch of changes that each seemed reasonable, but which would have dropped a lot of info and nuance on the floor. Should be checking for this.  STUCK: in due course, a NAPP that was trained to look out for this will be necessary.
4. We can't rely on LLM to do the eval.  I know I gave that a 20% chance.  Withdrawing that.  Perhaps an Eval aware NAPP could do it, but relying as I had hinted that o1 is smart enough with just the gold defs is wrong.  Junk that idea.
5. That NAPP also needs to be kinder in not only running the evals, but also pointing out the implications of the changes proposed.  Or at least summarising the diffs.
6. Even on this short evening on tightening up the gold defs it's quickly apparent that complexity grows exponentially, and interestingly grows more quickly when there's more NL in the defs.  This is more a note for me, but there seems to be a sweet spot.  My starter for 10 is that no definition repeats anything else in another definition.  It defines itself, and it's relationship and expectation with other defs, and nothing else. 
7. Now hands on, I'm starting to suspect that grouping defs a bit like Napps would be helpful.  Not sure yet, but reduces complexity.  E.g. I don't want to have to be asked about a change in Impact Crystals necessarily when talking about Direct and Implied Stucks.  Sure, they're connected, but at arms length.  In the same was as we've to figure out how to nest NAPPs e.g. through MCP, there seems to be something in saying that any relatively complex system that an AI is asking whether it's ok to be changed should be talking in chunks which can be altered if necessary in iterations.  E.g. i want to change stucks.  Cool.  What's the first order connection between stucks and anything else.  Consider only that.  Done.  Now, that chunk I've just altered, what other chunks are second order now I've sorted first order.
8. NOTE TO SELF:Where we want to get to is the situation where the Actor is like a General.  Don't tell me the details, tell me how the war is going...
