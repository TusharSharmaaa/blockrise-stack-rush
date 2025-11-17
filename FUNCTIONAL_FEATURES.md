# Functional Logic Features in BlockRise Stack Rush

## Level System & Progression

1. **First 5 Levels Free** - Levels 1-5 are automatically unlocked when starting the game
2. **Level Unlocking via Ads** - Watch 3 ads to unlock each new level (after level 5)
3. **Daily Ad Limit** - Maximum 10 ads can be watched per day to unlock levels
4. **Ad Watch Progress Tracking** - System tracks how many ads watched toward next level unlock
5. **Level Score Requirements** - Each level has specific score requirements to complete:
   - Level 1: 500 points
   - Level 2: 800 points
   - Level 3: 1200 points
   - Level 4: 1800 points
   - Level 5: 2500 points
   - Level 10: 5000 points
   - Level 15: 8000 points
   - Level 20: 12000 points
   - Level 25: 18000 points
   - Level 30: 25000 points
   - Level 40: 40000 points
   - Level 50: 60000 points
6. **Level Best Score Tracking** - System tracks best score achieved for each individual level
7. **Level Completion Detection** - Game detects when score requirement is met for current level
8. **50 Total Levels** - Maximum level cap is 50

## Ad Reward System

9. **Watch Ad for Level Unlock** - Watch rewarded ads to progress toward unlocking new levels
10. **Coin Rewards from Ads** - Earn 10 coins per ad watched, plus 50 bonus coins when level is unlocked
11. **Ad Watch Date Tracking** - System tracks last date ads were watched to reset daily limits
12. **Daily Ad Counter Reset** - Ad watch counter resets each new day
13. **Interstitial Ads After Game Over** - Interstitial ad shown automatically 1 second after game ends
14. **Continue Playing with Ad** - Option to watch rewarded ad to continue playing after game over (grants 50 coins)

## Coin & Currency System

15. **Starting Coins** - Players start with 100 coins
16. **Coin Earning from Ads** - 10 coins per ad watched, 50 bonus on level unlock
17. **Coin Earning from Daily Rewards** - Base 50 coins + streak bonus (streak × 10)
18. **Coin Earning from Achievements** - Various coin rewards for unlocking achievements
19. **Coin Spending in Shop** - Coins can be spent to purchase power-ups:
   - Slow Time: 100 coins
   - Clear Line: 150 coins
   - Block Shuffle: 75 coins
   - Bomb: 200 coins
20. **Coin Balance Validation** - System checks if player has enough coins before purchase
21. **Coin Deduction on Purchase** - Coins are deducted when power-ups are purchased

## Daily Rewards & Streaks

22. **Daily Reward System** - Players can claim daily reward once per day
23. **Daily Streak Tracking** - System tracks consecutive days played
24. **Streak Bonus Calculation** - Daily reward = 50 base coins + (streak × 10 bonus coins)
25. **Streak Reset Logic** - Streak resets if player misses more than 1 day
26. **Streak Increment** - Streak increases by 1 if player plays on consecutive days
27. **Daily Reward Claim Flag** - System prevents claiming reward multiple times per day
28. **Last Played Date Tracking** - System tracks last date game was played for streak calculation

## Achievement System

29. **Achievement Unlocking** - System automatically checks and unlocks achievements based on progress
30. **Achievement Progress Tracking** - Each achievement tracks current progress toward goal
31. **Achievement Coin Rewards** - Unlocking achievements grants coins:
   - First Game: 50 coins
   - Score 1000: 100 coins
   - Score 5000: 250 coins
   - Score 10000: 500 coins
   - Reach Level 10: 150 coins
   - Reach Level 25: 300 coins
   - Reach Level 50: 500 coins
   - Play 10 Games: 100 coins
   - Beat High Score: 75 coins
   - 7-Day Streak: 200 coins
32. **Achievement Unlock Date** - System records date when achievement was unlocked
33. **Achievement Progress Updates** - Progress updates automatically during gameplay

## Leaderboard System

34. **Current User Highlighting** - Current user's entry is marked with border and "You" badge
35. **Leaderboard Ranking** - Players ranked by highest score in descending order
36. **Top 3 Special Icons** - Rank 1 gets trophy icon, rank 2-3 get medal icons
37. **Top 3 Background Highlight** - Top 3 players get special gradient background
38. **Profile Required for Leaderboard** - Players must create profile to appear on leaderboard
39. **Real-time Leaderboard Updates** - Leaderboard subscribes to database changes for real-time updates
40. **Leaderboard Limit** - Shows top 100 players
41. **Score Submission** - Game automatically submits scores to leaderboard after game ends

## Profile System

42. **Unique Username Requirement** - Username must be unique across all players
43. **Username Availability Check** - Real-time checking if username is available (with debouncing)
44. **Username Validation** - Minimum 3 characters, maximum 30 characters
45. **Profile Creation Mandatory** - Players cannot proceed without creating profile
46. **Profile Data Sync** - Profile data syncs to Supabase backend
47. **Profile ID Storage** - Profile ID stored in localStorage for session persistence
48. **Profile Completion Flag** - System tracks if profile setup is complete
49. **Username Uniqueness Validation** - Checks database before allowing username creation/update
50. **Offline Profile Creation Prevention** - Profile cannot be created when offline

## Power-up System

51. **Power-up Inventory** - System tracks quantity of each power-up type owned
52. **Power-up Purchase** - Power-ups can be purchased from shop using coins
53. **Power-up Usage** - Power-ups can be activated during gameplay
54. **Single Active Power-up** - Only one power-up can be active at a time
55. **Power-up Duration** - Power-ups have 30 second duration
56. **Power-up Auto-deactivation** - Power-ups automatically deactivate after duration expires
57. **Power-up Inventory Persistence** - Power-up inventory saved to local storage
58. **Power-up Availability Check** - System checks if player has power-up before allowing use

## Game Progress & Stats

59. **Total Games Played Counter** - Tracks total number of games completed
60. **Highest Score Tracking** - System tracks player's all-time highest score
61. **Level Scores Tracking** - Best score for each individual level is tracked separately
62. **Progress Sync to Backend** - Game progress automatically syncs to Supabase after each game
63. **Local Progress Storage** - Progress saved to Capacitor Preferences for offline access
64. **Progress Loading** - Progress loads from local storage on app startup
65. **Game Stats Update** - Stats update after each game completion

## Game Mechanics

66. **Level-based Speed** - Game speed increases with each level
67. **Score Requirement for Level Completion** - Must reach target score to complete level
68. **Level Progression** - Player advances to next level after completing current level
69. **Game Over Detection** - System detects when game ends
70. **Score Calculation** - Points awarded for clearing lines
71. **Level Selection** - Players can select any unlocked level to play

## Shop & Purchases

72. **Power-up Purchase Validation** - Checks coin balance before allowing purchase
73. **Coin Pack Display** - Shows coin packs with bonus coins (100, 500+50, 1000+150)
74. **Premium Items** - Remove Ads and Premium Pass items (IAP integration pending)
75. **Purchase Disabled State** - Purchase buttons disabled when insufficient coins
76. **Purchase Confirmation** - Toast notifications confirm successful purchases

## Data Persistence

77. **Local Storage for Progress** - Game progress saved to Capacitor Preferences
78. **Backend Sync** - Progress syncs to Supabase when profile exists
79. **Profile ID Persistence** - Profile ID stored in localStorage
80. **Achievement Storage** - Achievements saved to local storage
81. **Power-up Inventory Storage** - Power-up inventory saved to local storage
82. **Daily Streak Persistence** - Streak data persists across app sessions

## Validation & Restrictions

83. **Username Length Validation** - 3-30 character limit enforced
84. **Country Selection Required** - Country must be selected for profile creation
85. **Online Status Check** - Profile operations require internet connection
86. **Username Uniqueness Enforcement** - Database constraint prevents duplicate usernames
87. **Score Validation** - Scores must be positive (database constraint)
88. **Level Range Validation** - Levels must be between 1-50 (database constraint)
89. **Coin Balance Validation** - Coins cannot go negative (database constraint)

## Real-time Features

90. **Leaderboard Real-time Updates** - Leaderboard updates automatically when profiles change
91. **Database Subscription** - App subscribes to Supabase real-time changes for leaderboard

## Game Session Features

92. **Game Pause Functionality** - Players can pause game (P key or Escape)
93. **Continue After Game Over** - Option to watch ad to continue playing
94. **Level Target Display** - Shows required score to complete current level
95. **Score Display** - Real-time score display during gameplay
96. **Level Display** - Current level shown during gameplay

## Profile Setup Features

97. **Mandatory Profile Dialog** - Profile setup dialog cannot be closed until profile created
98. **Username Suggestions** - System suggests available usernames if chosen one is taken
99. **Fuzzy Country Search** - Country selection with fuzzy search functionality
100. **Username Check Caching** - Username availability checks cached for 5 minutes
101. **Skip Validation Option** - Option to skip username validation after 5 seconds timeout
102. **Profile Verification** - System verifies profile was saved to backend after creation


