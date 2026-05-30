# The Agent Cycle

The pipeline executes in a strict, chronological loop managed by four distinct agents:

1. **Coordinator Agent (Planning)**
   * **Trigger:** Human submits a campaign goal.
   * **Action:** Reads the goal and past memory. Generates a strategic, step-by-step marketing plan. Requires human approval before proceeding.

2. **Content Agent (Execution)**
   * **Trigger:** Plan is approved.
   * **Action:** Generates the post text and image graphic based on the plan. Assigns a unique tracking link (slug) to the asset and logs it in the database.

3. **Attribution Agent (Tracking)**
   * **Trigger:** A user clicks a tracking link or is manually entered.
   * **Action:** Operates without LLM dependency. Tags the lead to the source content item and updates funnel counters (clicks, leads, conversions) in real-time.

4. **Insight Agent (Analysis)**
   * **Trigger:** End of campaign / manual trigger.
   * **Action:** Reads the original goal and the final funnel data gathered by the Attribution Agent. Analyzes the delta between the goal and actual performance, feeding findings back to the Coordinator for future RAG context.