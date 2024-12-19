

Below is a list of definitions for each named item referenced in the diagrams. These descriptions clarify what each component does and how it fits into the overall interface.

**Normal Mode Components**

```less
                                                                                    
+------------------------------------------------------------------------------+ 
| [ ] Toggle Sidebar |                                                         | 
|--------------------|                       Main Window                       | 
|                    |                                                         | 
|    Chat History    | [NappSelector Dropdown]                                 | 
|    (Past Chats)    |---------------------------------------------------------| 
|    - Chat 1        |                                                         | 
|    - Chat 2        |  Current Conversation                                   | 
|    - Chat 3        |  ------------------------------------------------------ | 
|    New Chat        |  [User]: Hello!                                         | 
|    Search Chats    |    [edit]                                               | 
|                    |  [AI/Napp]: Hi there! How can I assist you today?       | 
|    User(Bob) [▼]   |    [copy] [thumbsUp] [🔧 Fix]                           | 
|    (Click to show  |  [User]: I need help with my account.                   | 
|     Help/Balance/  |    [edit]                                               | 
|     Theme/Credits) |  [AI/Napp]: Sure, let's look into that.                 | 
|                    |    [copy] [thumbsUp] [🔧 Fix]                           | 
|                    |  ------------------------------------------------------ | 
|                    |  [ Type your message here...        (Mic) (Send) ]      | 
|                    |                                                         | 
+------------------------------------------------------------------------------+ 
                                                                                     
```

1. **ChatHistory**:  
   A vertical panel on the left side of the screen that displays a list of previously occurred chats. It allows the user to view and navigate through their existing conversation history.

2. **NewChatButton**:  
   A button located at the top of the ChatHistory area. Clicking this starts a brand-new conversation thread.

3. **SearchChatsButton**:  
   A button in the ChatHistory area that, when clicked, begins a special "search chat." This search chat allows the user to query and find previously discussed topics, messages, or chats without manually scrolling through the history.

4. **UserAdminButton**:  
   A single button located at the bottom of the ChatHistory. When clicked, it reveals a dropdown with user account-related functions such as signing out, viewing account balance, toggling light/dark mode, and accessing help.

5. **NappSelector**:  
   A selection dropdown (shown in normal mode above the Conversation) that lets the user pick which Napp(s) (agents or models) will be used for the current and future chat interactions.

6. **Conversation**:  
   The central area in normal mode where the current chat’s messages are displayed. This area shows all the exchanged messages, inline UI elements, and the user’s ongoing discussion context.

7. **Inline UI Elements**:  
   Interactive elements displayed inside the Conversation. They may include quick actions or suggestions that can be clicked to perform operations or load content related to the conversation’s context.

8. **TextEntryField**:  
   The input box where the user types their next message or query.

9. **MicButton**:  
   A button next to the TextEntryField that enables voice recognition input. When used, it allows the user to speak their query instead of typing it.

10. **AttachContext**:  
    A button next to the TextEntryField and MicButton that, when clicked, opens the StateBoard. This is used to attach additional context, documents, tools, or configurations to the ongoing conversation, rather than just attaching files in the traditional sense.

11. **Send**:  
    A button that sends the user’s typed (or spoken) message to the Napp(s) for processing, continuing the conversation.

---

**StateBoard Mode Components**

When entering StateBoard mode, the layout changes. The Conversation remains on the left, but the ChatHistory and NappSelector are not visible. The StateBoard appears on the right.

```less
+-------------------------|----------------------------------------------------+
|[User]: Show me the doc  |Title: "Project Roadmap"                            |
|[AI/Napp]: One moment... |Short Desc: Upcoming milestones & tasks             |
|[AI/Napp]: Here it is:   |[Prev] [Next]                                       |
|- Key deliverables       |Document Content:                                   |
|- Scroll for details...  |- Detailed text, charts, or widgets                 |
|                         |- May be scrollable                                 |
|[Input: Type...] (Mic)   |(Viewing old version?) [Restore] [Back to latest]   |
|(AttachCxt)(Send)        |                                                    |
+-------------------------|----------------------------------------------------+

```


1. **StateBoard (Right Side)**:  
   A large, dedicated space that takes over the right side of the interface. It is triggered by the AttachContext action from the Conversation area. It provides advanced context management, versioning, and complex content display.

2. **StateBoard Header**:  
   The top portion of the StateBoard. It includes:  
   - **Title**: A short, descriptive title for the currently displayed content or context.  
   - **Short Description**: A brief explanatory text giving context or instructions.  
   - **Version Controls (PreviousVersion / NextVersion)**: Buttons to navigate through different saved or tracked versions of the displayed content.

3. **Document/Widgets/Freeform Content Area**:  
   The main body area of the StateBoard. It can display documents, interactive widgets, data visualizations, or any form of freeform information related to the conversation’s context. This area may be scrollable if the content exceeds available space.

4. **Optional Footer (Shown When Viewing a Previous Version)**:  
   A footer displayed only if the user is viewing an older version of the content. It typically includes:  
   - Informational text (e.g., "You are viewing a previous version" and instructions like "Restore this version to make edits").  
   - Action buttons (e.g., "Restore this version" to revert the content to the displayed older version, or "Back to latest version" to return to the most recent state).

---

**In Summary**:  
- **ChatHistory** & related buttons (NewChat, SearchChats, UserAdmin) manage and navigate between existing chats.  
- **Conversation**, **NappSelector**, and related input elements (TextEntryField, MicButton, AttachContext, Send) handle the active chat interaction.  
- **StateBoard** and its components (Header, Document/Widgets area, Optional Footer) support deep context management, versioning, and extended configuration options beyond the simple message interface.