# Predicate

A clause for a sprite animation rule. Predicates describe a sprite's state at a single moment:

- Movement: `not moving`, `moving`, `moving up/right/down/left`
- Facing: `facing up/right/down/left`
- Walls: `hitting wall up/right/down/left`
- Buttons: `button A pressed`, `button B pressed`, `button A just pressed`, `button B just pressed`
- Action button: `action button pressed`, `action button just pressed` (configurable per sprite)

Combine predicates with the "rule" block. Rules with more predicates override rules with fewer.
