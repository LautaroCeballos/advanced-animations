# Rule

Constructs a rule for checking the state of a sprite. Rules with more clauses override rules with fewer clauses. Invalid rules (e.g. "moving left" AND "moving right", or "moving down" AND "hitting wall down") are ignored.

A rule accepts up to seven predicates. Because button predicates are added to the movement state, you can build attack rules that only apply while a button is held:

- Walk rule: `moving AND facing right` (2 predicates)
- Attack rule: `moving AND facing right AND button A pressed` (3 predicates) — this one wins while A is held, and the walk rule resumes when A is released
