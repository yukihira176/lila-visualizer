# INSIGHTS.md : What the Data Revealed

*Analysis based on 796 matches, 1,243 player journey files, and 5 days of production data (February 10–14, 2026) across three maps: Ambrose Valley (566 matches), Grand Rift (59 matches), and Lockdown (171 matches).*

---

## Insight 1: Grand Rift — Loot Distribution Is Not the Root Cause of Mine Pit Concentration

**Observation:**
A surface-level reading of Grand Rift's heatmaps suggests that Mine Pit dominates player activity because it holds the most loot. However, cross-referencing the loot heatmap against the kill and traffic heatmaps reveals a more nuanced problem. Loot markers are present at Gas Station, Engineer's Quarters, and Labour Quarters, loot is already distributed across the map. Despite this, kill, death, and traffic heatmaps converge almost entirely on Mine Pit.

**Supporting Evidence:**
If loot distribution were the primary driver of player behaviour, kills would be expected to follow loot across multiple zones. They do not. Players have access to alternatives and are consistently choosing to ignore them. Mine Pit is not functioning as a loot trap, it is functioning as a psychological anchor. Something about Mine Pit, whether extraction point proximity, superior cover, or established player meta, is making it feel mandatory regardless of what other zones offer.

**Recommended Actions and Metrics:**
Further redistributing loot is unlikely to produce meaningful change until the underlying pull factor is identified and addressed. The recommended first step is to audit extraction point placement and spawn distribution relative to Mine Pit before making any loot changes.
- **Metric to watch:** Kill spread index across named zones, the ratio of kills occurring in Mine Pit versus the rest of the map
- **Proposed test:** Relocate or add an extraction point near Gas Station. If kill activity follows, the pull is mechanical and addressable through design. If it does not, the issue is behavioural and will require a different intervention.

**Why This Matters:**
Shipping a loot rebalance patch without addressing the actual cause will produce no measurable change in player distribution and will consume a design and engineering cycle unnecessarily. Identifying the correct root cause is the prerequisite to any effective fix.

---

## Insight 2: Grand Rift — Map Architecture and Storm Behaviour Have Eliminated Player Choice

**Observation:**
After establishing that loot distribution was not driving Mine Pit concentration, the storm death heatmap was examined to understand where players who avoided Mine Pit ended up. Storm deaths cluster consistently at Maintenance Bay, Burnt Zone, and Labour Quarters — all peripheral zones, all outside Mine Pit.

**Supporting Evidence:**
There is no named zone on Grand Rift with meaningful PvP activity outside of Mine Pit. Players who spawn at the map periphery and attempt to loot secondary zones do not survive long enough to reach a combat encounter — the storm closes over them before they can rotate. The map currently presents players with two outcomes: drop at Mine Pit and engage in PvP, or avoid Mine Pit and die passively to the storm. No viable third routing option exists.

**Recommended Actions and Metrics:**
This is a systems-level problem requiring the storm timing, shrink speed, spawn distribution, and map traversal distances to be reviewed together rather than in isolation.
- **Metric to watch:** Time-of-death distribution for storm deaths versus PvP deaths on Grand Rift. Storm deaths concentrated in the first half of the match indicate that the early shrink phase is too aggressive for the map's traversal distances.
- **Proposed action:** Reduce early-game storm shrink speed on Grand Rift to extend the viable rotation window for peripheral spawns. Monitor whether PvP activity begins to distribute across a second zone following the adjustment.

**Why This Matters:**
In an extraction shooter, passive death, dying without meaningful player interaction, represents the lowest quality match outcome. A map where spawn location is a significant determinant of survival is not creating tension; it is creating inequity. Grand Rift's match count of 59 against Ambrose Valley's 566 is consistent with a map that players are choosing not to return to.

---

## Insight 3: Lockdown — Bot Patrol Distribution May Be Suppressing the Exploration the Map Was Designed to Enable

**Observation:**
On Ambrose Valley and Grand Rift, bot kill events cluster around the same zones that attract human players. On Lockdown, bot kill markers are distributed across the entire map with no discernible concentration. Every zone, including areas with low human traffic, shows bot activity. This pattern is anomalous and warrants closer examination.

**Supporting Evidence:**
Lockdown's loot heatmap is the most evenly distributed of the three maps, with loot present across upper, central, and lower zones, a layout that suggests the map was intentionally designed to reward and encourage exploration. However, the traffic heatmap shows human players concentrating in the northern section of the map, leaving well-stocked southern and western zones largely unvisited. The even loot distribution is not producing even player distribution. A plausible explanation is that bots patrolling low-traffic zones are creating unpredictable ambush conditions that disincentivise players from exploring off the main path.

**Recommended Actions and Metrics:**
Bot density is rarely examined as a variable in post-launch map analysis, but it directly shapes the risk profile of different zones. If bots are active everywhere, players learn that exploration carries a consistent danger tax, and they respond by clustering in areas where other human players provide safety in numbers.
- **Metric to watch:** Human death rate by zone segmented by killer type (bot, human, storm) on Lockdown
- **Proposed test:** Reduce bot patrol density in one or two southern and western zones for a defined session window. If human traffic redistributes toward those zones, bot density was suppressing the map's intended play pattern.

**Why This Matters:**
A map designed around exploration cannot function as intended if the AI population makes exploration consistently punishing. If this hypothesis is confirmed, the fix is a tuning adjustment to bot spawns, not a redesign of the map itself. Identifying this early prevents a misattribution of the problem to level design when the actual variable is AI configuration.