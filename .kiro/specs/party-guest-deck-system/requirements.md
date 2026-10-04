# Requirements Document

## Introduction

This document specifies requirements for a deck-based party guest system in an Angular PWA game. The system manages a collection of potential party guests that can be invited during the Party phase. Guests are drawn from a shuffled deck and displayed as cards. When the Party phase ends, all guests return to the deck for future use.

## Glossary

- **Deck**: The collection of all potential party guests available to the player, managed as a shuffled stack
- **Party**: The collection of guests currently invited during the active Party phase
- **Old_Friend**: A type of guest with a unique name but identical functionality
- **Party_Phase**: The game phase during which players can invite guests to their party
- **Guest_Card**: The visual representation of a guest showing their type and name
- **Game_Store**: The NgRx SignalStore managing game state including deck and party collections

## Requirements

### Requirement 1: Initialize Starting Deck

**User Story:** As a player, I want to start the game with a set of Old Friend guests in my deck, so that I have guests available to invite to my party.

#### Acceptance Criteria

1. WHEN the game initializes, THE Game_Store SHALL create a Deck containing exactly 6 Old_Friend guests
2. THE Game_Store SHALL assign the names "Brian", "Colin", "Anthony", "Emily", "Rachelle", and "Teresa" to the 6 Old_Friend guests
3. THE Game_Store SHALL shuffle the Deck after initialization
4. FOR ALL guests in the starting Deck, each guest SHALL have a unique name from the specified list

### Requirement 2: Manage Deck as Stack

**User Story:** As a player, I want the deck to work like a shuffled deck of cards, so that I get variety in which guests I can invite.

#### Acceptance Criteria

1. THE Deck SHALL maintain guests in a specific order after shuffling
2. WHEN a guest is drawn from the Deck, THE Game_Store SHALL remove the guest from the top of the Deck
3. WHEN a guest is returned to the Deck, THE Game_Store SHALL add the guest to the bottom of the Deck
4. THE Deck SHALL preserve the order of remaining guests when a guest is drawn

### Requirement 3: Display Invite Guest Button

**User Story:** As a player, I want to see an "Invite Guest" button during the Party phase, so that I can invite guests to my party.

#### Acceptance Criteria

1. WHILE the current phase is Party_Phase, THE Gameplay_Component SHALL display an "Invite Guest" button in the side panel
2. WHILE the current phase is not Party_Phase, THE Gameplay_Component SHALL hide the "Invite Guest" button
3. WHILE the Deck contains at least one guest, THE "Invite Guest" button SHALL be enabled

### Requirement 4: Invite Guest to Party

**User Story:** As a player, I want to click the "Invite Guest" button to add a guest to my party, so that I can build my party during the Party phase.

#### Acceptance Criteria

1. WHEN the "Invite Guest" button is clicked, THE Game_Store SHALL remove the top guest from the Deck
2. WHEN the "Invite Guest" button is clicked, THE Game_Store SHALL add the removed guest to the Party
3. WHEN a guest is added to the Party, THE Game_Store SHALL preserve the guest's name and type
4. FOR ALL invite operations where the Deck is not empty, the Deck size SHALL decrease by 1 and the Party size SHALL increase by 1

### Requirement 5: Display Guest Cards

**User Story:** As a player, I want to see each guest in my party as a card, so that I can view all the guests I've invited.

#### Acceptance Criteria

1. FOR ALL guests in the Party, THE Gameplay_Component SHALL display a Guest_Card in the main content area
2. THE Guest_Card SHALL display "Old Friend" as the header label
3. THE Guest_Card SHALL display a generic person placeholder image
4. THE Guest_Card SHALL display the guest's name as a caption
5. THE Gameplay_Component SHALL display Guest_Cards with the most recently invited guest first and the oldest invited guest last

### Requirement 6: Return Guests to Deck

**User Story:** As a player, I want all guests to return to my deck when the Party phase ends, so that I can invite them again in future turns.

#### Acceptance Criteria

1. WHEN the Party_Phase ends, THE Game_Store SHALL remove all guests from the Party
2. WHEN the Party_Phase ends, THE Game_Store SHALL add all removed guests to the Deck
3. WHEN guests are returned to the Deck, THE Game_Store SHALL add each guest to the bottom of the Deck
4. FOR ALL phase transitions from Party_Phase to another phase, the Party SHALL be empty after the transition

### Requirement 7: Maintain Guest Identity

**User Story:** As a player, I want each Old Friend to keep their unique name throughout the game, so that I can recognize individual guests across multiple turns.

#### Acceptance Criteria

1. WHEN a guest is drawn from the Deck, THE Game_Store SHALL preserve the guest's name
2. WHEN a guest is added to the Party, THE Game_Store SHALL preserve the guest's name
3. WHEN a guest is returned to the Deck, THE Game_Store SHALL preserve the guest's name
4. FOR ALL Old_Friend guests, the name SHALL remain constant throughout all deck and party operations

### Requirement 8: Handle Empty Deck State

**User Story:** As a player, I want clear feedback when my deck is empty, so that I understand why I cannot invite more guests.

#### Acceptance Criteria

1. WHEN the "Invite Guest" button is clicked AND the Deck is empty, THE Gameplay_Component SHALL display a message "No more guests!"
2. WHEN the Deck is empty AND the "Invite Guest" button is clicked, THE Game_Store SHALL NOT modify the Deck or Party
3. WHEN all guests are in the Party and the Party_Phase ends, THE Game_Store SHALL return all guests to the Deck
4. FOR ALL game states, the total count of guests in Deck plus Party SHALL equal 6
