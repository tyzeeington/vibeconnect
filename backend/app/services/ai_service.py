from openai import OpenAI
from app.config import settings
from typing import Dict, List
import json

client = OpenAI(api_key=settings.OPENAI_API_KEY)

PERSONALITY_ANALYSIS_PROMPT = """You are a personality analyzer for VibeConnect, a platform that helps people make authentic connections at events.

Based on the user's responses, analyze their personality across 5 core dimensions and score them 0-100:

1. **Goals** - What they're building toward (career, creative projects, personal growth, family, wealth, impact)
2. **Intuition** - How they make decisions (gut feeling, data-driven, spiritual, logical)
3. **Philosophy** - Their worldview (optimist/realist, individualist/collectivist, material/spiritual)
4. **Expectations** - What they want from connections (collaboration, friendship, romance, mentorship, inspiration)
5. **Leisure Time** - How they recharge (music, sports, nature, creating, reading, partying)

Also identify their multi-faceted intentions from these options:
- build_together
- make_friends
- find_romance
- deep_conversation
- dance_vibe
- learn_from_others
- network_professionally
- just_be_present

Return ONLY a valid JSON object with this structure:
{
  "dimensions": {
    "goals": 75,
    "intuition": 60,
    "philosophy": 85,
    "expectations": 50,
    "leisure_time": 90
  },
  "intentions": ["build_together", "deep_conversation"],
  "insights": "Brief 1-2 sentence summary of their vibe"
}
"""

async def analyze_onboarding_responses(user_responses: str) -> Dict:
    """
    Analyze user's onboarding responses to build initial personality profile
    
    Args:
        user_responses: User's text responses to onboarding questions
        
    Returns:
        Dictionary with dimensions, intentions, and insights
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": PERSONALITY_ANALYSIS_PROMPT},
                {"role": "user", "content": f"User responses: {user_responses}"}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        # Parse the JSON response
        result = json.loads(response.choices[0].message.content)
        return result
        
    except Exception as e:
        print(f"Error in personality analysis: {e}")
        # Return default profile if AI fails
        return {
            "dimensions": {
                "goals": 50,
                "intuition": 50,
                "philosophy": 50,
                "expectations": 50,
                "leisure_time": 50
            },
            "intentions": ["just_be_present"],
            "insights": "Profile needs more data for analysis"
        }

async def refine_profile_from_behavior(
    current_profile: Dict,
    connection_history: List[Dict]
) -> Dict:
    """
    Refine user's profile based on actual connection behavior
    
    Args:
        current_profile: Current dimension scores
        connection_history: List of connections with acceptance/rejection data
        
    Returns:
        Updated dimension scores
    """
    
    if len(connection_history) < 5:
        # Not enough data to refine
        return current_profile
    
    # Prepare connection summary for AI
    accepted = [c for c in connection_history if c['status'] == 'accepted']
    rejected = [c for c in connection_history if c['status'] == 'rejected']
    
    prompt = f"""
    Current profile dimensions:
    {json.dumps(current_profile['dimensions'], indent=2)}
    
    User has accepted {len(accepted)} connections and rejected {len(rejected)}.
    
    Accepted connections had these average dimensions:
    {json.dumps(_average_dimensions(accepted), indent=2)}
    
    Rejected connections had these average dimensions:
    {json.dumps(_average_dimensions(rejected), indent=2)}
    
    Based on actual behavior, adjust the user's dimension scores to better reflect who they ACTUALLY connect with.
    Return updated scores as JSON: {{"goals": X, "intuition": Y, ...}}
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You refine personality profiles based on connection behavior. Return only JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=200
        )
        
        refined_dimensions = json.loads(response.choices[0].message.content)
        return {
            "dimensions": refined_dimensions,
            "intentions": current_profile['intentions'],
            "profile_confidence": min(1.0, len(connection_history) / 20)  # Max confidence at 20 connections
        }
        
    except Exception as e:
        print(f"Error refining profile: {e}")
        return current_profile

def _average_dimensions(connections: List[Dict]) -> Dict:
    """Helper to calculate average dimension scores from a list of connections"""
    if not connections:
        return {}
    
    dimension_sums = {
        "goals": 0,
        "intuition": 0,
        "philosophy": 0,
        "expectations": 0,
        "leisure_time": 0
    }
    
    for conn in connections:
        for dim, value in conn.get('other_user_dimensions', {}).items():
            dimension_sums[dim] += value
    
    count = len(connections)
    return {dim: round(total / count, 1) for dim, total in dimension_sums.items()}

async def generate_conversational_onboarding() -> List[str]:
    """
    Generate conversational onboarding questions for new users
    
    Returns:
        List of questions to ask the user
    """
    return [
        "What brings you to VibeConnect? What are you hoping to discover or build?",
        "When you meet someone new, what matters most to you - shared goals, similar energy, or something else?",
        "How do you usually spend your free time when you want to recharge?",
        "Are you more of a 'go with the flow' person or do you like to plan things out?",
        "What's your vibe when you're out at an event - are you there to connect, create, dance, or just be present?"
    ]
