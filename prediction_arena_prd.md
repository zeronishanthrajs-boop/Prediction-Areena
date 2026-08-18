# Prediction Arena — Web App PRD

## 1. Product

**Working name:** Prediction Arena

Prediction Arena is a social, competitive prediction simulator built around free virtual Practice Coins.

Users can:
- Predict sports outcomes.
- Predict whether a continuously moving simulated market will go UP or DOWN.
- Compete with friends.
- Climb global, weekly, monthly and friends leaderboards.
- Complete challenges and achievements.
- Earn free Practice Coins through login rewards and optional rewarded ads.

### Hard product boundary

This is a virtual game, not a financial or real-money betting product.

Practice Coins:
- are free virtual game currency;
- have no monetary value;
- cannot be purchased;
- cannot be withdrawn;
- cannot be transferred;
- cannot be exchanged for cash, crypto, gift cards or valuable goods.

The product must clearly disclose this to users and must be reviewed for applicable laws, platform policies and advertising policies before launch.

---

# 2. Product Vision

> Make prediction feel like a competitive game.

The core loop:

**Open → Claim reward → Choose game → Predict → See result → Earn XP → Improve rating → Challenge friends → Return for new challenges**

The product should feel premium, fast and exciting while avoiding deceptive or compulsive dark patterns.

---

# 3. Design Direction

Create a **premium dark gaming/market interface**.

### Visual language

- Dark near-black background.
- Electric blue primary accent.
- Green for positive/UP states.
- Red for negative/DOWN states.
- Purple for special events.
- Gold for achievements/rank.
- Glassmorphism used selectively.
- Large numerical typography.
- Smooth chart animations.
- Subtle glow and depth.
- High-quality micro-interactions.
- Mobile-first responsive layout.

The visual reference should feel like a blend of:
- modern trading dashboard,
- competitive gaming interface,
- sports prediction app,
- premium fintech dashboard.

Do not copy the UI of Binance or another existing product.

---

# 4. Main Navigation

Desktop:

`Logo | Play | Markets | Sports | Friends | Rankings | Profile | Practice Coins`

Mobile bottom navigation:

`Home | Play | Rankings | Friends | Profile`

---

# 5. Home Dashboard

The home page should immediately answer:

1. How many Practice Coins do I have?
2. What can I play now?
3. What is happening with my ranking?
4. What is today's challenge?

### Hero

Show:

- Greeting.
- Practice Coin balance.
- Daily reward.
- Current streak.
- Rating.
- Primary "Play Now" CTA.

Example:

**WHAT'S YOUR CALL?**

`10,428.51`

**Will the value be higher or lower in 30 seconds?**

`UP ↑` `DOWN ↓`

---

# 6. Practice Coin Economy

New account:

**10,000 Practice Coins**

Daily reward:

- Day 1 — 1,000
- Day 2 — 1,250
- Day 3 — 1,500
- Day 4 — 2,000
- Day 5 — 2,500
- Day 6 — 3,000
- Day 7 — 5,000

Missing a day should not destroy all progress.

Users can optionally watch a rewarded advertisement to:
- double the daily reward;
- receive a limited free refill when balance is empty.

Never force an ad to continue playing.

Never sell Practice Coins.

---

# 7. Game Mode A — Infinite Market

This is the flagship game.

A synthetic market continuously generates a simulated value.

Example:

`10,428.51`

The chart continuously moves.

Users select:

**UP** or **DOWN**

and choose a Practice Coin stake.

### MVP round

- 30-second duration.
- Fixed entry value.
- Server-controlled outcome.
- Result based on entry versus exit value.

Example:

`10,428 → 10,463`

Prediction: UP

Result: WIN

The UI should explicitly label this as a **simulated market**.

---

# 8. Synthetic Market Engine

Do not use a client-side random number generator for authoritative results.

The backend controls the market.

A market state can include:

- current value;
- trend;
- volatility;
- momentum;
- random component;
- market seed;
- tick timestamp.

Possible market profiles:

### Stable
Low volatility.

### Volatile
Larger movements.

### Momentum
Greater continuation of current movement.

### Reversal
Higher probability of directional reversal.

### Chaos
Highly unpredictable.

The market should be designed so players cannot reliably exploit deterministic patterns.

---

# 9. Infinite Market UI

Display:

- Market name.
- SIMULATED badge.
- Current value.
- Animated live chart.
- Current movement.
- Prediction duration.
- UP/DOWN controls.
- Stake selector.
- Confirmation state.
- Countdown.
- Prediction status.
- Result.

Example mobile layout:

```text
┌─────────────────────────┐
│ Practice Coins  12.4K   │
├─────────────────────────┤
│                         │
│   AI INDEX              │
│   SIMULATED MARKET      │
│                         │
│      10,428.51          │
│                         │
│    ╱╲      ╱╲           │
│ ──╱──╲────╱──╲────      │
│                         │
│       00:24             │
│                         │
│ ┌────────┐ ┌──────────┐ │
│ │   ↑    │ │    ↓     │ │
│ │  UP    │ │   DOWN   │ │
│ └────────┘ └──────────┘ │
│                         │
│ Stake: 500              │
└─────────────────────────┘
```

---

# 10. Game Mode B — Sports Prediction

Create a sports lobby.

Supported categories can include:
- Cricket
- Football
- Basketball
- Tennis
- Esports

For MVP, sports can initially use mock/demo events so the entire application works without external sports-data dependencies.

### Sports card

Show:

- teams/players;
- event status;
- prediction options;
- number of participants;
- closing time;
- user's existing prediction.

Example:

**INDIA vs AUSTRALIA**

`Who wins?`

`INDIA` / `AUSTRALIA`

All predictions use Practice Coins only.

If live sports data is later integrated, use licensed/appropriate data and review the relevant legal and platform requirements.

---

# 11. Prediction Flow

```text
Choose game
   ↓
Select prediction
   ↓
Choose Practice Coin amount
   ↓
Confirm
   ↓
Server validates
   ↓
Prediction locked
   ↓
Live countdown / event result
   ↓
Server resolves result
   ↓
Coins updated
   ↓
XP awarded
   ↓
Rating updated
   ↓
Result animation
```

All authoritative calculations happen on the backend.

---

# 12. Result Experience

### Win

Show:

- clear WIN state;
- entry value;
- exit value;
- Practice Coins gained;
- XP gained;
- new rating;
- current streak;
- optional achievement.

Example:

**YOU CALLED IT**

`10,428 → 10,463`

`+850 Practice Coins`

`+40 XP`

`Rating: 2,417 → 2,431`

### Loss

Show the result clearly without shame or manipulative messaging.

Example:

**The market moved down.**

`10,428 → 10,397`

`-500 Practice Coins`

`Accuracy: 61%`

CTA:

**Try another prediction**

---

# 13. XP and Levels

XP is separate from Practice Coins.

Users gain XP from:
- completed predictions;
- challenges;
- achievements;
- social competitions;
- daily objectives.

Example ranks:

1. Rookie
2. Analyst
3. Predictor
4. Strategist
5. Specialist
6. Expert
7. Master
8. Grandmaster

Level progress should be visible everywhere relevant.

---

# 14. Rating System

Do not rank players only by Practice Coin balance.

Create a separate **Prediction Rating**.

Rating can consider:
- prediction accuracy;
- consistency;
- difficulty;
- challenge performance;
- performance over time.

For MVP, implement a simple server-side rating formula and make it easy to replace later.

---

# 15. Leaderboards

Provide:

- Global
- Friends
- Weekly
- Monthly
- All-time

Leaderboard rows:

`Rank | Player | Rating | Accuracy | Streak`

Highlight the current user's row.

Show movement:

`↑ 11 places`

Avoid ranking users purely by time spent.

---

# 16. Friends

Users can:

- search usernames;
- send requests;
- accept/decline;
- view profiles;
- compare statistics;
- challenge friends.

---

# 17. Friend Challenges

A challenge contains:

- creator;
- invited users;
- number of rounds;
- prediction type;
- duration;
- scoreboard;
- winner.

Example:

**HEAD-TO-HEAD**

`CS vs Alex`

`10 Rounds`

`Best accuracy wins`

All rewards remain virtual.

---

# 18. Private Rooms

Users can create private rooms.

Settings:
- room name;
- participants;
- rounds;
- game mode;
- round duration.

Generate a shareable invite link.

No paid entry.

No cash prize.

---

# 19. Achievements

Examples:

- First Call — first prediction.
- Hot Start — 5 consecutive wins.
- Market Reader — 60% accuracy.
- Comeback — recover after a losing run.
- Marathon — 100 predictions.
- Social Player — challenge 10 friends.
- Perfect Session — 10 wins in one session.

Achievements reward exploration, consistency and skill.

---

# 20. Challenges

Daily examples:

- Make 3 predictions.
- Try 3 different markets.
- Reach 60% accuracy.
- Complete one friend challenge.
- Win 2 UP predictions.

Weekly examples:

- Make 20 predictions.
- Reach a rating milestone.
- Beat 3 friends.
- Try every market type.

Rewards:
- XP;
- free Practice Coins;
- badges;
- profile cosmetics.

---

# 21. Ethical Engagement

Use positive game mechanics:

- progression;
- achievements;
- skill statistics;
- daily content;
- friendly competition;
- weekly seasons;
- optional notifications;
- personalization.

Do NOT use:
- fake scarcity;
- fake countdowns;
- forced ads;
- hidden rules;
- misleading probabilities;
- shame after losses;
- "you must play now" messaging;
- artificial loss of earned rewards;
- monetary-value prizes.

Users must be able to leave the game at any time without being penalized.

---

# 22. Profile

Profile shows:

- username;
- avatar;
- level;
- XP;
- rating;
- accuracy;
- total predictions;
- best streak;
- achievements;
- recent performance;
- friends.

Example:

```text
CS
LEVEL 18

Rating       2,417
Accuracy       67%
Predictions    842
Best Streak     12

24 Achievements
```

---

# 23. Notifications

Useful notifications only:

- daily reward available;
- friend challenge received;
- weekly leaderboard ending;
- achievement unlocked.

Allow users to disable notifications.

---

# 24. Rewarded Advertising

Implement rewarded ads only where permitted by the ad provider.

Possible rewards:
- double daily Practice Coin reward;
- limited free refill;
- optional challenge bonus.

The client must never be trusted to claim a reward.

Flow:

```text
Ad provider
    ↓
Reward verification
    ↓
Backend
    ↓
Validate
    ↓
Credit Practice Coins
```

Prevent:
- duplicate claims;
- replay attacks;
- refresh exploits;
- multi-device abuse;
- bot farming.

---

# 25. Authentication

Support:

- email/password;
- Google login;
- unique username;
- avatar/profile image.

Implement:
- secure password hashing;
- email verification where appropriate;
- session management;
- rate limiting;
- abuse protection.

---

# 26. Backend Architecture

```text
                    Frontend
                       |
                    API Layer
                       |
       +---------------+---------------+
       |               |               |
 Authentication     Game Engine     Social
       |               |               |
       |        +------+-------+       |
       |        |              |       |
       |     Market         Sports     |
       |     Engine         Engine     |
       |        |              |       |
       +--------+--------------+-------+
                       |
                  PostgreSQL
                       |
                    Redis
```

Use WebSockets for live market updates and real-time game state where appropriate.

---

# 27. Recommended Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- lightweight charting library

### Backend
- Node.js
- TypeScript
- API routes or separate service layer

### Database
- PostgreSQL

### Cache / real-time support
- Redis

### Authentication
- Auth.js, Clerk, Supabase Auth or Firebase Auth

Choose one authentication provider for the MVP.

---

# 28. Core Database Entities

### User
- id
- username
- email
- avatar
- xp
- level
- rating
- created_at

### PracticeWallet
- user_id
- balance
- lifetime_earned
- lifetime_spent

### Prediction
- id
- user_id
- game_type
- market_id
- direction
- stake
- entry_value
- exit_value
- result
- created_at

### Market
- id
- name
- type
- current_value
- volatility
- status

### Friendship
- user_id
- friend_id
- status

### Challenge
- id
- creator_id
- type
- rounds
- status

### Achievement
- id
- name
- description
- requirement

### UserAchievement
- user_id
- achievement_id
- unlocked_at

---

# 29. Anti-Cheat

Never allow the browser to determine:

- final market result;
- Practice Coin balance;
- reward amount;
- prediction result;
- leaderboard rating.

Use:
- server timestamps;
- server-generated market state;
- database transactions;
- idempotent reward operations;
- rate limits;
- prediction locks;
- suspicious activity detection;
- leaderboard integrity checks.

---

# 30. Security

Implement:

- CSRF protection where applicable;
- XSS protection;
- input validation;
- authorization checks;
- secure cookies/tokens;
- rate limiting;
- API abuse protection;
- audit logs;
- server-side validation;
- database constraints;
- secure secrets management.

Never expose server secrets to the frontend.

---

# 31. Responsive Design

Build mobile-first.

Primary target:
- 390 × 844 viewport.

Also support:
- 360 × 800;
- 412 × 915;
- tablets;
- desktop;
- wide desktop.

The main game must remain usable with one hand on mobile.

---

# 32. Accessibility

Support:
- keyboard navigation;
- readable contrast;
- reduced-motion preference;
- accessible buttons;
- screen-reader labels;
- non-color-only UP/DOWN indicators;
- responsive text sizing.

---

# 33. Admin Dashboard

Build an internal admin dashboard with:

### Users
- search;
- view account;
- status;
- abuse flags.

### Markets
- create/disable markets;
- configure volatility;
- inspect market state.

### Predictions
- inspect games;
- investigate anomalies.

### Economy
- inspect coin distribution;
- reward events;
- ad rewards.

### Leaderboards
- inspect suspicious rankings;
- moderation tools.

### Analytics
- DAU;
- retention;
- predictions;
- ad opt-in;
- challenge participation;
- error rates.

Admin actions require authorization and audit logs.

---

# 34. Analytics

Track:

### Activation
First prediction completed.

### Retention
D1 / D7 / D30.

### Game engagement
Predictions per active user.

### Social
Friend additions and challenges.

### Ads
Rewarded-ad opt-in and successful reward verification.

### Economy
Coins earned/spent.

### Quality
Prediction completion rate and server error rate.

Do not optimize solely for maximum session length.

---

# 35. MVP Scope

Build first:

- Authentication
- Profile
- Practice Coin wallet
- Daily reward
- Infinite Market
- UP/DOWN predictions
- 30-second rounds
- Server-side market engine
- Prediction history
- XP
- Levels
- Global leaderboard
- Basic friends
- Rewarded-ad integration
- Anti-cheat basics
- Mobile-first UI
- Admin dashboard basics

Sports prediction can initially use mock events and become the next development phase.

---

# 36. Phase 2

- Real sports data integration where legally and commercially appropriate
- Friend challenges
- Private rooms
- Weekly competitions
- Achievements
- Daily challenges
- Multiple synthetic markets
- Advanced statistics
- Better personalization

---

# 37. Phase 3

- Seasons
- Tournaments
- Spectator mode
- Community challenges
- Creator-hosted rooms
- Advanced analytics
- Cosmetic customization
- Replays

---

# 38. Definition of Done

The MVP is complete when:

- A new user can register.
- They receive Practice Coins.
- They can play a simulated market.
- The chart moves in real time.
- They can choose UP/DOWN.
- The server resolves the result.
- Their wallet updates correctly.
- XP and rating update.
- Leaderboards update.
- They can add friends.
- Rewarded ads can grant verified virtual rewards where supported.
- Refreshing or manipulating the browser cannot create coins.
- The UI works cleanly on mobile and desktop.
- The product clearly communicates that Practice Coins have no monetary value.

---

# 39. Final Product Positioning

Do not market the product as:

> "Fake betting."

Position it as:

> **A competitive prediction game where you test how good you are at calling what happens next.**

The product should feel exciting because of **skill, competition, social interaction and progression**, not because users are being pushed toward real-money gambling.
