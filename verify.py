import asyncio
import httpx
import sys

BASE_URL = "http://127.0.0.1:8000"

async def run_verification():
    print("==================================================")
    print("      AI Support Ticket Tracker API Verification   ")
    print("==================================================")

    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        # Step 1: Check root endpoint
        try:
            r = await client.get("/")
            if r.status_code == 200:
                print("[OK] Backend root endpoint accessible.")
            else:
                print("[FAIL] Backend root endpoint failed.")
                return
        except Exception as e:
            print(f"[FAIL] Backend server not running at {BASE_URL}. Error: {e}")
            return

        # Step 2: List users and verify seeding
        r = await client.get("/users")
        users = r.json()
        print(f"[OK] Seeding verification: Found {len(users)} seeded users.")
        for u in users:
            print(f"   - ID: {u['id']}, Name: {u['name']}, Role: {u['role']}")
        
        john_id = next(u['id'] for u in users if u['name'] == 'John')
        sarah_id = next(u['id'] for u in users if u['name'] == 'Sarah')
        david_id = next(u['id'] for u in users if u['name'] == 'David')

        # Step 3: Test authentication endpoints
        r = await client.post("/login", json={"userId": john_id})
        assert r.json()["role"] == "Agent"
        print("[OK] Mock authentication for Agent John successful.")

        r = await client.post("/login", json={"userId": david_id})
        assert r.json()["role"] == "Manager"
        print("[OK] Mock authentication for Manager David successful.")

        # Step 4: Create ticket as Manager (David) and assign to Sarah
        headers_david = {"X-User-Id": str(david_id)}
        ticket_payload = {
            "title": "Slow checkout page response",
            "description": "Customer checkout operations take more than 5 seconds during peak loads.",
            "assignedAgentId": sarah_id
        }
        r = await client.post("/tickets", json=ticket_payload, headers=headers_david)
        assert r.status_code == 201
        res = r.json()
        ticket_id = res["ticketId"]
        print(f"[OK] Ticket creation & assignment by Manager successful (Ticket ID: {ticket_id}).")

        # Step 5: Verify role-based list visibility
        # Agent John should NOT see tickets assigned to Sarah
        headers_john = {"X-User-Id": str(john_id)}
        r = await client.get("/tickets", headers=headers_john)
        john_tickets = r.json()
        assert not any(t["id"] == ticket_id for t in john_tickets)
        print("[OK] Visibility isolation: Agent John cannot see Sarah's ticket.")

        # Agent Sarah SHOULD see the ticket assigned to her
        headers_sarah = {"X-User-Id": str(sarah_id)}
        r = await client.get("/tickets", headers=headers_sarah)
        sarah_tickets = r.json()
        print("Sarah tickets:", sarah_tickets)
        print("Expected ticket ID:", ticket_id)
        assert any(t["id"] == ticket_id for t in sarah_tickets)
        print("[OK] Visibility isolation: Agent Sarah can see her assigned ticket.")

        # Step 6: Test status transition validations
        # Sarah starts investigation: New -> In Progress
        r = await client.put(
            f"/tickets/{ticket_id}/status",
            json={"status": "In Progress", "changedBy": sarah_id},
            headers=headers_sarah
        )
        assert r.status_code == 200
        print("[OK] Permitted transition: Sarah progressed status 'New' -> 'In Progress'.")

        # Verify history logs
        r = await client.get(f"/tickets/{ticket_id}/history", headers=headers_sarah)
        history = r.json()
        assert len(history) >= 2 # created + progressed
        print("[OK] Audit log history verification: Transitions successfully tracked.")

        # Sarah tries to reopen (In Progress -> Resolved, then Resolved -> In Progress) - should be BLOCKED
        r = await client.put(
            f"/tickets/{ticket_id}/status",
            json={"status": "Resolved", "changedBy": sarah_id},
            headers=headers_sarah
        )
        assert r.status_code == 200
        print("[OK] Permitted transition: Sarah resolved the ticket 'In Progress' -> 'Resolved'.")

        # Sarah tries to transition Resolved -> In Progress
        r = await client.put(
            f"/tickets/{ticket_id}/status",
            json={"status": "In Progress", "changedBy": sarah_id},
            headers=headers_sarah
        )
        assert r.status_code == 400
        print("[OK] Business Rule Enforced: Agent Sarah rejected when attempting to reopen Resolved ticket (Status 400).")

        # Manager (David) reopens ticket: Resolved -> In Progress
        r = await client.put(
            f"/tickets/{ticket_id}/status",
            json={"status": "In Progress", "changedBy": david_id},
            headers=headers_david
        )
        assert r.status_code == 200
        print("[OK] Permitted transition: Manager David successfully reopened Resolved ticket.")

        # Step 7: Test ticket reassignment by Manager
        r = await client.put(
            f"/tickets/{ticket_id}/assign",
            json={"agentId": john_id},
            headers=headers_david
        )
        assert r.status_code == 200
        print("[OK] Reassignment successful: Manager David reassigned Sarah's ticket to John.")

        # Step 8: Verify AI analysis integrations
        r = await client.get(f"/tickets/{ticket_id}/ai-analysis", headers=headers_david)
        assert r.status_code == 200
        analysis = r.json()
        print("[OK] AI Ticket Insights Integration successful:")
        print(f"   - Detected Sentiment: {analysis['sentiment']}")
        print(f"   - Suggested Tags: {analysis['suggested_tags']}")
        print(f"   - AI Summary: {analysis['summary']}")
        print(f"   - Suggested Draft Reply: {analysis['suggested_reply'][:60]}...")

        print("\n==================================================")
        print("[SUCCESS] All business logic verifications passed!")
        print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_verification())
