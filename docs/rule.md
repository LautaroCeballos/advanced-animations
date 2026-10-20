# Rule

Constructs a rule for checking the state of a sprite. Rules with more clauses override rules with fewer clauses. Invalid rules (e.g. "moving left" AND "moving right", or "moving down" AND "hitting wall down") are ignored.

A rule accepts up to seven predicates. To override a movement rule with an attack rule, the attack rule must be strictly more specific:

- Movement rule: `moving AND facing right` (2 predicates)
- Attack rule: `moving AND facing right AND attacking` (3 predicates) — this one wins while attacking
