# Database Schema (Memory)

The system utilizes a relational PostgreSQL database to separate heavy assets from dynamic tracking data.

## 1. Persona Table (Campaign Parent)
* **Stores:** Campaign Goal, content produced, funnel figures, insight findings.
* **Purpose:** Acts as the primary container for a specific marketing initiative.

## 2. Content Table (Assets & Metrics)
* **Stores:** Tracking slug, clicks, leads, active, dropped, converted, avg days to entry.
* **Purpose:** Stores the generated materials (text and image BLOBs) alongside their specific performance counters.

## 3. Lead Table (User Journey)
* **Stores:** Entry date, source content, channel, stage history.
* **Purpose:** Logs individual interactions to build accurate funnel metrics. 

## 4. Agent Run Table (Audit Log)
* **Stores:** Run type, persona ID, proposed plan, human decision, LLM provider, tokens used.
* **Purpose:** Acts as a system black box. Tracks API spending and agent reasoning for debugging and accountability.