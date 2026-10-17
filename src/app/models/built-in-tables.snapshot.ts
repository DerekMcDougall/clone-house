// The seven per-type tables as they were before the guest type registry, so tests can check
// that the derived views still match. Delete once the derived views are retired.
export const BUILT_IN_TABLES_SNAPSHOT = {
  "labels": {
    "OLD_FRIEND": "Old Friend",
    "WILD_BUDDY": "Wild Buddy",
    "RICH_PAL": "Rich Pal",
    "MONKEY": "Monkey",
    "AUCTIONEER": "Auctioneer",
    "GANGSTER": "Gangster",
    "ROCK_STAR": "Rock Star",
    "GAMBLER": "Gambler",
    "CUTE_DOG": "Cute Dog",
    "HIPPY": "Hippy",
    "CATERER": "Caterer",
    "TICKET_TAKER": "Ticket Taker",
    "CLIMBER": "Climber",
    "MR_POPULAR": "Mr. Popular",
    "CELEBRITY": "Celebrity",
    "ALIEN": "Alien",
    "LEPRECHAUN": "Leprechaun",
    "DRAGON": "Dragon",
    "DINOSAUR": "Dinosaur",
    "MERMAID": "Mermaid",
    "UNICORN": "Unicorn",
    "SUPERHERO": "Superhero"
  },
  "defaults": {
    "OLD_FRIEND": {
      "popularityValue": 1,
      "troubleValue": 0,
      "moneyValue": 0,
      "peaceValue": 0,
      "starValue": 0
    },
    "WILD_BUDDY": {
      "popularityValue": 2,
      "troubleValue": 1,
      "moneyValue": 0,
      "peaceValue": 0,
      "starValue": 0
    },
    "RICH_PAL": {
      "popularityValue": 0,
      "troubleValue": 0,
      "moneyValue": 1,
      "peaceValue": 0,
      "starValue": 0
    },
    "MONKEY": {
      "popularityValue": 4,
      "troubleValue": 1,
      "moneyValue": 0,
      "peaceValue": 0,
      "starValue": 0
    },
    "AUCTIONEER": {
      "popularityValue": 0,
      "troubleValue": 0,
      "moneyValue": 3,
      "peaceValue": 0,
      "starValue": 0
    },
    "GANGSTER": {
      "popularityValue": 0,
      "troubleValue": 1,
      "moneyValue": 4,
      "peaceValue": 0,
      "starValue": 0
    },
    "ROCK_STAR": {
      "popularityValue": 3,
      "troubleValue": 1,
      "moneyValue": 2,
      "peaceValue": 0,
      "starValue": 0
    },
    "GAMBLER": {
      "popularityValue": 2,
      "troubleValue": 1,
      "moneyValue": 3,
      "peaceValue": 0,
      "starValue": 0
    },
    "CUTE_DOG": {
      "popularityValue": 2,
      "troubleValue": 0,
      "moneyValue": 0,
      "peaceValue": 1,
      "starValue": 0
    },
    "HIPPY": {
      "popularityValue": 1,
      "troubleValue": 0,
      "moneyValue": 0,
      "peaceValue": 1,
      "starValue": 0
    },
    "CATERER": {
      "popularityValue": 4,
      "troubleValue": 0,
      "moneyValue": -1,
      "peaceValue": 0,
      "starValue": 0
    },
    "TICKET_TAKER": {
      "popularityValue": -1,
      "troubleValue": 0,
      "moneyValue": 2,
      "peaceValue": 0,
      "starValue": 0
    },
    "CLIMBER": {
      "popularityValue": 0,
      "troubleValue": 0,
      "moneyValue": 0,
      "peaceValue": 0,
      "starValue": 0
    },
    "MR_POPULAR": {
      "popularityValue": 3,
      "troubleValue": 0,
      "moneyValue": 0,
      "peaceValue": 0,
      "starValue": 0
    },
    "CELEBRITY": {
      "popularityValue": 2,
      "troubleValue": 0,
      "moneyValue": 3,
      "peaceValue": 0,
      "starValue": 0
    },
    "ALIEN": {
      "popularityValue": 0,
      "troubleValue": 0,
      "moneyValue": 0,
      "peaceValue": 0,
      "starValue": 1
    },
    "LEPRECHAUN": {
      "popularityValue": 0,
      "troubleValue": 0,
      "moneyValue": 3,
      "peaceValue": 0,
      "starValue": 1
    },
    "DRAGON": {
      "popularityValue": 0,
      "troubleValue": 0,
      "moneyValue": -3,
      "peaceValue": 0,
      "starValue": 1
    },
    "DINOSAUR": {
      "popularityValue": 0,
      "troubleValue": 1,
      "moneyValue": 0,
      "peaceValue": 0,
      "starValue": 1
    },
    "MERMAID": {
      "popularityValue": 0,
      "troubleValue": 0,
      "moneyValue": 0,
      "peaceValue": 0,
      "starValue": 1
    },
    "UNICORN": {
      "popularityValue": 0,
      "troubleValue": 0,
      "moneyValue": 0,
      "peaceValue": 1,
      "starValue": 1
    },
    "SUPERHERO": {
      "popularityValue": 3,
      "troubleValue": 0,
      "moneyValue": 0,
      "peaceValue": 0,
      "starValue": 1
    }
  },
  "costs": {
    "OLD_FRIEND": 2,
    "WILD_BUDDY": null,
    "RICH_PAL": 3,
    "MONKEY": 3,
    "AUCTIONEER": 9,
    "GANGSTER": 6,
    "ROCK_STAR": 5,
    "GAMBLER": 7,
    "CUTE_DOG": 7,
    "HIPPY": 4,
    "CATERER": 5,
    "TICKET_TAKER": 4,
    "CLIMBER": 12,
    "MR_POPULAR": 5,
    "CELEBRITY": 11,
    "ALIEN": 40,
    "LEPRECHAUN": 50,
    "DRAGON": 30,
    "DINOSAUR": 25,
    "MERMAID": 35,
    "UNICORN": 45,
    "SUPERHERO": 50
  },
  "shopGuests": [
    {
      "type": "OLD_FRIEND",
      "name": "Matt"
    },
    {
      "type": "OLD_FRIEND",
      "name": "Chad"
    },
    {
      "type": "OLD_FRIEND",
      "name": "Wes"
    },
    {
      "type": "OLD_FRIEND",
      "name": "Caleb"
    },
    {
      "type": "RICH_PAL",
      "name": "Kevin"
    },
    {
      "type": "RICH_PAL",
      "name": "Arlene"
    },
    {
      "type": "RICH_PAL",
      "name": "Robert"
    },
    {
      "type": "RICH_PAL",
      "name": "Jim"
    },
    {
      "type": "MONKEY",
      "name": "George"
    },
    {
      "type": "MONKEY",
      "name": "Punch"
    },
    {
      "type": "MONKEY",
      "name": "Darwin"
    },
    {
      "type": "MONKEY",
      "name": "Diddy"
    },
    {
      "type": "AUCTIONEER",
      "name": "Christie"
    },
    {
      "type": "AUCTIONEER",
      "name": "Sotheby"
    },
    {
      "type": "AUCTIONEER",
      "name": "Phillip"
    },
    {
      "type": "AUCTIONEER",
      "name": "Bonham"
    },
    {
      "type": "GANGSTER",
      "name": "Tony"
    },
    {
      "type": "GANGSTER",
      "name": "Legs"
    },
    {
      "type": "GANGSTER",
      "name": "Louie"
    },
    {
      "type": "GANGSTER",
      "name": "Johnny"
    },
    {
      "type": "ROCK_STAR",
      "name": "Alanis"
    },
    {
      "type": "ROCK_STAR",
      "name": "Gord"
    },
    {
      "type": "ROCK_STAR",
      "name": "Neil"
    },
    {
      "type": "ROCK_STAR",
      "name": "Randy"
    },
    {
      "type": "GAMBLER",
      "name": "Kenny"
    },
    {
      "type": "GAMBLER",
      "name": "Ace"
    },
    {
      "type": "GAMBLER",
      "name": "Jack"
    },
    {
      "type": "GAMBLER",
      "name": "Raymond"
    },
    {
      "type": "CUTE_DOG",
      "name": "Oreo"
    },
    {
      "type": "CUTE_DOG",
      "name": "Lily"
    },
    {
      "type": "CUTE_DOG",
      "name": "Pearl"
    },
    {
      "type": "CUTE_DOG",
      "name": "Ronnie"
    },
    {
      "type": "HIPPY",
      "name": "Bob"
    },
    {
      "type": "HIPPY",
      "name": "Joni"
    },
    {
      "type": "HIPPY",
      "name": "Joan"
    },
    {
      "type": "HIPPY",
      "name": "Jerry"
    },
    {
      "type": "CATERER",
      "name": "Ronald"
    },
    {
      "type": "CATERER",
      "name": "Wendy"
    },
    {
      "type": "CATERER",
      "name": "Mario"
    },
    {
      "type": "CATERER",
      "name": "Tim"
    },
    {
      "type": "TICKET_TAKER",
      "name": "Val"
    },
    {
      "type": "TICKET_TAKER",
      "name": "Grant"
    },
    {
      "type": "TICKET_TAKER",
      "name": "Mark"
    },
    {
      "type": "TICKET_TAKER",
      "name": "Stubby"
    },
    {
      "type": "CLIMBER",
      "name": "Ascella"
    },
    {
      "type": "CLIMBER",
      "name": "Skye"
    },
    {
      "type": "CLIMBER",
      "name": "Icarus"
    },
    {
      "type": "CLIMBER",
      "name": "Vela"
    },
    {
      "type": "MR_POPULAR",
      "name": "Rowan"
    },
    {
      "type": "MR_POPULAR",
      "name": "Oscar"
    },
    {
      "type": "MR_POPULAR",
      "name": "Lawrence"
    },
    {
      "type": "MR_POPULAR",
      "name": "McDougall"
    },
    {
      "type": "CELEBRITY",
      "name": "Troy"
    },
    {
      "type": "CELEBRITY",
      "name": "Rainier"
    },
    {
      "type": "CELEBRITY",
      "name": "Pedro"
    },
    {
      "type": "CELEBRITY",
      "name": "Kent"
    },
    {
      "type": "ALIEN",
      "name": "ET"
    },
    {
      "type": "ALIEN",
      "name": "Rocky"
    },
    {
      "type": "ALIEN",
      "name": "Olimar"
    },
    {
      "type": "ALIEN",
      "name": "Alf"
    },
    {
      "type": "LEPRECHAUN",
      "name": "Lucky"
    },
    {
      "type": "LEPRECHAUN",
      "name": "Liam"
    },
    {
      "type": "LEPRECHAUN",
      "name": "Seamus"
    },
    {
      "type": "LEPRECHAUN",
      "name": "Patrick"
    },
    {
      "type": "DRAGON",
      "name": "Smaug"
    },
    {
      "type": "DRAGON",
      "name": "Clay"
    },
    {
      "type": "DRAGON",
      "name": "Malathrax"
    },
    {
      "type": "DRAGON",
      "name": "Toothless"
    },
    {
      "type": "DINOSAUR",
      "name": "Barney"
    },
    {
      "type": "DINOSAUR",
      "name": "Blue"
    },
    {
      "type": "DINOSAUR",
      "name": "Dino"
    },
    {
      "type": "DINOSAUR",
      "name": "Rex"
    },
    {
      "type": "MERMAID",
      "name": "Ariel"
    },
    {
      "type": "MERMAID",
      "name": "Marina"
    },
    {
      "type": "MERMAID",
      "name": "Calypso"
    },
    {
      "type": "MERMAID",
      "name": "Oceana"
    },
    {
      "type": "UNICORN",
      "name": "Sparkles"
    },
    {
      "type": "UNICORN",
      "name": "Glitter"
    },
    {
      "type": "UNICORN",
      "name": "Stardust"
    },
    {
      "type": "UNICORN",
      "name": "Moonbeam"
    },
    {
      "type": "SUPERHERO",
      "name": "Superman"
    },
    {
      "type": "SUPERHERO",
      "name": "Spider-man"
    },
    {
      "type": "SUPERHERO",
      "name": "Batman"
    },
    {
      "type": "SUPERHERO",
      "name": "Iron Man"
    }
  ],
  "initialGuests": [
    {
      "type": "OLD_FRIEND",
      "name": "Brian"
    },
    {
      "type": "OLD_FRIEND",
      "name": "Colin"
    },
    {
      "type": "OLD_FRIEND",
      "name": "Emily"
    },
    {
      "type": "OLD_FRIEND",
      "name": "Rachelle"
    },
    {
      "type": "WILD_BUDDY",
      "name": "Anthony"
    },
    {
      "type": "WILD_BUDDY",
      "name": "Teresa"
    },
    {
      "type": "WILD_BUDDY",
      "name": "Jacco"
    },
    {
      "type": "WILD_BUDDY",
      "name": "Jodie"
    },
    {
      "type": "RICH_PAL",
      "name": "Khalil"
    },
    {
      "type": "RICH_PAL",
      "name": "Renata"
    }
  ],
  "entranceEffectTypes": [
    "CLIMBER",
    "MR_POPULAR",
    "CELEBRITY",
    "MERMAID"
  ],
  "entranceIcons": {
    "CLIMBER": [
      {
        "symbol": "➕",
        "label": "Gains 1 popularity on entrance"
      }
    ],
    "MR_POPULAR": [
      {
        "symbol": "👤",
        "label": "Invites a guest on entrance"
      }
    ],
    "CELEBRITY": [
      {
        "symbol": "👤",
        "label": "Invites a guest on entrance"
      },
      {
        "symbol": "👤",
        "label": "Invites a guest on entrance"
      }
    ],
    "MERMAID": [
      {
        "symbol": "👤",
        "label": "Invites a guest on entrance"
      }
    ]
  }
} as const;
