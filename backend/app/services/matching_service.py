from typing import Dict, List, Tuple
import numpy as np
from datetime import datetime, timedelta

class MatchingEngine:
    """
    AI-powered matching engine that calculates compatibility between users
    based on the 5 core dimensions, intentions, and proximity data
    """
    
    # Weights for each dimension (can be tuned based on data)
    DIMENSION_WEIGHTS = {
        "goals": 0.25,
        "intuition": 0.15,
        "philosophy": 0.20,
        "expectations": 0.25,
        "leisure_time": 0.15
    }
    
    def calculate_compatibility(
        self,
        user_a_profile: Dict,
        user_b_profile: Dict,
        proximity_minutes: int = 0
    ) -> Tuple[float, Dict]:
        """
        Calculate compatibility score between two users
        
        Args:
            user_a_profile: User A's profile data (dimensions, intentions)
            user_b_profile: User B's profile data (dimensions, intentions)
            proximity_minutes: How long they were near each other
            
        Returns:
            Tuple of (compatibility_score, dimension_alignment)
        """
        
        # 1. Calculate dimension similarity (0-100 scale)
        dimension_scores = {}
        total_weighted_score = 0
        
        for dimension, weight in self.DIMENSION_WEIGHTS.items():
            user_a_val = user_a_profile['dimensions'].get(dimension, 50)
            user_b_val = user_b_profile['dimensions'].get(dimension, 50)
            
            # Calculate similarity (inverse of difference, scaled to 0-100)
            difference = abs(user_a_val - user_b_val)
            similarity = 100 - difference
            
            dimension_scores[dimension] = round(similarity, 1)
            total_weighted_score += similarity * weight
        
        # 2. Calculate intention overlap (0-1 multiplier)
        intentions_a = set(user_a_profile.get('intentions', []))
        intentions_b = set(user_b_profile.get('intentions', []))
        
        if intentions_a and intentions_b:
            intention_overlap = len(intentions_a & intentions_b) / len(intentions_a | intentions_b)
        else:
            intention_overlap = 0.5  # Neutral if no intentions set
        
        # 3. Proximity bonus (up to 20% boost)
        proximity_bonus = min(20, proximity_minutes / 3)  # Max 20 points for 60+ minutes together
        
        # 4. Final compatibility score
        base_score = total_weighted_score
        intention_multiplier = 0.8 + (intention_overlap * 0.4)  # Range: 0.8 to 1.2
        
        compatibility_score = (base_score * intention_multiplier) + proximity_bonus
        compatibility_score = min(100, max(0, compatibility_score))  # Clamp to 0-100
        
        return round(compatibility_score, 1), dimension_scores
    
    def find_matches_for_event(
        self,
        user_profile: Dict,
        other_users: List[Dict],
        proximity_data: Dict[int, int] = None,
        top_n: int = 5
    ) -> List[Dict]:
        """
        Find top N matches for a user at an event
        
        Args:
            user_profile: The user's profile
            other_users: List of other users at the event with their profiles
            proximity_data: Dict mapping user_id -> minutes_of_proximity
            top_n: Number of top matches to return
            
        Returns:
            List of match dictionaries sorted by compatibility
        """
        
        matches = []
        proximity_data = proximity_data or {}
        
        for other_user in other_users:
            proximity_minutes = proximity_data.get(other_user['id'], 0)
            
            compatibility, dimension_alignment = self.calculate_compatibility(
                user_profile,
                other_user,
                proximity_minutes
            )
            
            matches.append({
                'user_id': other_user['id'],
                'username': other_user.get('username', 'Anonymous'),
                'wallet_address': other_user['wallet_address'],
                'compatibility_score': compatibility,
                'dimension_alignment': dimension_alignment,
                'proximity_overlap_minutes': proximity_minutes,
                'shared_intentions': list(
                    set(user_profile.get('intentions', [])) & 
                    set(other_user.get('intentions', []))
                )
            })
        
        # Sort by compatibility score (highest first)
        matches.sort(key=lambda x: x['compatibility_score'], reverse=True)
        
        return matches[:top_n]
    
    def calculate_proximity_overlap(
        self,
        checkin_a: Dict,
        checkin_b: Dict,
        max_distance_meters: float = 50.0
    ) -> int:
        """
        Calculate how many minutes two users were near each other
        
        Args:
            checkin_a: User A's check-in data (check_in_time, check_out_time, lat, lon)
            checkin_b: User B's check-in data
            max_distance_meters: Maximum distance to be considered "near" (default 50m)
            
        Returns:
            Number of minutes they overlapped in proximity
        """
        
        # Calculate time overlap
        start_a = checkin_a['check_in_time']
        end_a = checkin_a.get('check_out_time') or datetime.utcnow()
        start_b = checkin_b['check_in_time']
        end_b = checkin_b.get('check_out_time') or datetime.utcnow()
        
        overlap_start = max(start_a, start_b)
        overlap_end = min(end_a, end_b)
        
        if overlap_start >= overlap_end:
            return 0  # No time overlap
        
        # For MVP, assume if they were at same event with time overlap, they were "near"
        # In future, use actual GPS tracking for precise proximity
        time_overlap = (overlap_end - overlap_start).total_seconds() / 60
        
        # If we have GPS data, check distance
        if all([
            checkin_a.get('latitude'),
            checkin_a.get('longitude'),
            checkin_b.get('latitude'),
            checkin_b.get('longitude')
        ]):
            distance = self._haversine_distance(
                checkin_a['latitude'],
                checkin_a['longitude'],
                checkin_b['latitude'],
                checkin_b['longitude']
            )
            
            if distance > max_distance_meters:
                return 0
        
        return int(time_overlap)
    
    def _haversine_distance(
        self,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float
    ) -> float:
        """
        Calculate distance between two GPS coordinates in meters
        """
        R = 6371000  # Earth's radius in meters
        
        phi1 = np.radians(lat1)
        phi2 = np.radians(lat2)
        delta_phi = np.radians(lat2 - lat1)
        delta_lambda = np.radians(lon2 - lon1)
        
        a = np.sin(delta_phi/2)**2 + \
            np.cos(phi1) * np.cos(phi2) * np.sin(delta_lambda/2)**2
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
        
        return R * c

# Initialize matching engine
matching_engine = MatchingEngine()
