from fastapi import APIRouter

from ..schemas import SafetyAssessment, SafetyQuery
from ..services import safety

router = APIRouter(prefix="/safety", tags=["safety"])


@router.post("/assess", response_model=SafetyAssessment)
def assess_route(query: SafetyQuery):
    """Rule-based risk indicator. Sample data only - not a safety guarantee."""
    return safety.assess(query)
