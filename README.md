# moodle-local_ai_content

# Index Control

Allows end-users to specify if an activity (possibly context) should be:
1. Indexed in the first place
2. Not returned as a result because it was erroneously indexed, and has not (yet) been removed from the index.

# Content Control

Provides a control that a developer can add to an AI plugin to 
* expose other content sources to contextualise 
* select what sources may be used in a RAG step.

The goal is to allow (say) a Chat activity to be configured to allow content from a course or selected activities within the course to be used to ground the Chat. 