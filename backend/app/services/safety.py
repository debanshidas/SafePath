"""Rule-based route safety scoring.

Uses sample data only. Scores are indicators, never a safety guarantee.
"""

from ..schemas import SafetyAssessment, SafetyFactors, SafetyQuery

# Penalties applied to the base score, by travel mode.
MODE_PENALTY = {"walk": 6, "bike": 4, "transit": 2, "cab": 0}


def _rating(score: int) -> str:
    if score >= 86:
        return "LOW RISK (SAFE)"
    if score >= 70:
        return "MEDIUM RISK"
    return "HIGH RISK"


def assess(query: SafetyQuery) -> SafetyAssessment:
    is_night = (query.time or "day").lower() == "night"

    score = 94 if not is_night else 82
    score -= MODE_PENALTY.get(query.mode, 4) if is_night else 0
    score = max(0, min(100, score))

    factors = SafetyFactors(
        lighting_score=78 if is_night else 98,
        crowd_density="Moderate" if is_night else "High / Active",
        police_booths_nearby=3,
        cctv_coverage="85% of route monitored" if is_night else "92% of route monitored",
        emergency_stops_count=4,
    )
    return SafetyAssessment(safety_score=score, rating=_rating(score), factors=factors)
