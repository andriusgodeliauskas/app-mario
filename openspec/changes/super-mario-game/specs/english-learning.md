## ADDED: English Learning Integration

### Requirements
- Target audience: Lithuanian-speaking child learning English through gameplay
- All HUD text displayed in English: "Score", "Lives", "Level", "Coins"

#### Object Name Popups
- When Mario collects or interacts with a key object, an English word popup appears above Mario
- Popup style: white text with black outline, 24px pixel font, floats upward and fades over 1.5s
- Popup words by object:
  - Coin collected: "Coin!"
  - Mushroom collected: "Mushroom!"
  - Star collected: "Star!"
  - Brick broken: "Brick!"
  - ? block hit: "Question Block!"
  - Goomba stomped: "Goomba!"
  - Koopa stomped: "Turtle!"
  - Flagpole reached: "Flag!"
  - Extra life: "1-UP!"
- Each popup also briefly shows a smaller Lithuanian translation below in parentheses:
  - "Coin!" / "(Moneta)"
  - "Mushroom!" / "(Grybas)"
  - "Star!" / "(Zvaigzde)"
  - "Brick!" / "(Plyta)"
  - "Question Block!" / "(Klausimo blokas)"
  - "Goomba!" / "(Goomba)"
  - "Turtle!" / "(Veplys)"
  - "Flag!" / "(Veliava)"
  - "1-UP!" / "(Papildomas gyvenimas)"

#### Princess Dialogue
- When Mario reaches the princess at the end of level 1-4, a dialogue box appears
- Dialogue is displayed line by line with typewriter effect (40ms per character)
- Dialogue content (alternating EN/LT):
  - Princess: "Thank you, Mario! You saved me!" / "Dekoju, Mario! Tu mane isgelbejei!"
  - Mario: "It was a great adventure!" / "Tai buvo puikus nuotykis!"
  - Princess: "You are a real hero!" / "Tu esi tikras herojus!"
- After dialogue, show "THE END" / "PABAIGA" with final score

#### End-of-Level Vocabulary Recap
- After completing each level (1-1 through 1-3), show a brief vocabulary screen
- Lists all English words encountered during that level with Lithuanian translations
- Display for 5 seconds or until player presses any key

### Scenarios
- Given Mario collects a coin, When the coin is picked up, Then "Coin!" appears above Mario with "(Moneta)" below it, floating up and fading
- Given Mario collects a mushroom, When the power-up is obtained, Then "Mushroom!" and "(Grybas)" popup appears
- Given Mario stomps a Goomba, When the enemy is defeated, Then "Goomba!" popup appears above the defeated enemy position
- Given the HUD is displayed, When the player looks at the UI overlay, Then labels read "Score", "Lives", "Level", "Coins" in English
- Given Mario reaches the princess, When the dialogue triggers, Then lines appear with typewriter effect in both English and Lithuanian
- Given level 1-2 is completed, When the flagpole sequence ends, Then a vocabulary recap screen shows all English words from that level with Lithuanian translations
- Given the player finishes the final dialogue, When all lines are shown, Then "THE END / PABAIGA" screen appears with the final score
