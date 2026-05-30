from app.agents import SupervisorAgent

def test_supervisor_routes_to_create():
    # 1. Initialize the agent
    supervisor = SupervisorAgent()
    
    # 2. Feed it a fake prompt
    fake_prompt = "Design a new poster for the summer sale."
    result = supervisor.route_request(fake_prompt)
    
    # 3. Assert the outcome (If this fails, the test turns red)
    assert result == "CREATE"