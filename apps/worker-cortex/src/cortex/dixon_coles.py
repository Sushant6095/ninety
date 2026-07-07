"""Dixon-Coles intensities + a small particle filter -> the 0.2 model term of fair = 0.2*model + 0.8*consensus.

DEFERRED (ADR-022): this is the "stretch only if ahead" item. v1 ships model term = 0 (consensus is king), so
`model_probs` returns None and pricing collapses the blend to pure devigged consensus. When built, this fits
bivariate-Poisson attack/defence intensities with in-play time decay + event bumps, runs a ~500-particle
posterior, and derives market-specific probabilities to blend at MODEL_W.
"""


def model_probs(state=None) -> list[float] | None:
    """Return the model's fair probability vector, or None when the model term is off (v1)."""
    return None  # ponytail: v1 has no model term; wire the particle filter here when ahead of schedule
