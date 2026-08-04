import json
import httpx
from app.config import config

class AIService:
    @staticmethod
    async def analyze_ticket(title: str, description: str) -> dict:
        api_key = config.GEMINI_API_KEY
        if not api_key:
            # Fallback to local mock response if API Key is not set
            tags = ["support"]
            desc_lower = description.lower()
            title_lower = title.lower()
            if "login" in desc_lower or "password" in desc_lower or "login" in title_lower:
                tags.append("auth")
                sentiment = "Frustrated"
                reply = "Hi there, thank you for reaching out. It seems like you are having trouble logging in. Let's reset your password. Please click on 'Forgot Password' or let us know if you need a password reset link."
            elif "billing" in desc_lower or "payment" in desc_lower or "price" in desc_lower or "invoice" in desc_lower:
                tags.append("billing")
                sentiment = "Frustrated"
                reply = "Hi there, I understand you have a billing question. Let me check your account billing history. I will get back to you shortly with more details."
            else:
                tags.append("general")
                sentiment = "Neutral"
                reply = f"Hello, thanks for contacting support. I have received your request regarding '{title}'. An agent will investigate this and respond shortly."

            return {
                "summary": f"User is reporting: {title}. Details: {description[:100]}...",
                "suggested_tags": tags,
                "sentiment": sentiment,
                "suggested_reply": reply
            }

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        prompt = (
            f"You are an AI support assistant. Analyze the following customer support ticket.\n"
            f"Title: {title}\n"
            f"Description: {description}\n\n"
            f"Please output a JSON object with the following fields:\n"
            f"1. 'summary': A concise 1-2 sentence summary of the issue.\n"
            f"2. 'suggested_tags': A list of 2-4 relevant tags (e.g. billing, login, bug, billing, feature-request).\n"
            f"3. 'sentiment': A single-word descriptor of the customer's sentiment (e.g., Frustrated, Neutral, Happy).\n"
            f"4. 'suggested_reply': A professional, helpful draft response that the support agent can send to the user.\n\n"
            f"Ensure your response is valid JSON only. Do not wrap it in markdown code blocks or add any other text."
        )

        payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, timeout=15.0)
                if response.status_code == 200:
                    data = response.json()
                    text = data['candidates'][0]['content']['parts'][0]['text']
                    return json.loads(text.strip())
                else:
                    raise Exception(f"Gemini API returned status code {response.status_code}: {response.text}")
        except Exception as e:
            return {
                "summary": f"Could not generate AI summary due to error: {str(e)}",
                "suggested_tags": ["error", "gemini-fallback"],
                "sentiment": "Unknown",
                "suggested_reply": "AI summary failed. Please review the ticket details manually."
            }
