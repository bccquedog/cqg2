# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - navigation [ref=e2]:
    - link "Home" [ref=e3] [cursor=pointer]:
      - /url: /
    - text: "|"
    - link "Tournaments" [ref=e4] [cursor=pointer]:
      - /url: /tournaments
    - text: "|"
    - link "Players" [ref=e5] [cursor=pointer]:
      - /url: /players
    - text: "|"
    - link "Profile" [ref=e6] [cursor=pointer]:
      - /url: /profile
  - generic [ref=e7]:
    - heading "Players (4)" [level=1] [ref=e8]
    - generic [ref=e9]:
      - 'link "Alpha Seed #1" [ref=e10] [cursor=pointer]':
        - /url: /profile/player1
        - heading "Alpha" [level=2] [ref=e11] [cursor=pointer]
        - paragraph [ref=e12] [cursor=pointer]: "Seed #1"
      - 'link "Bravo Seed #2" [ref=e13] [cursor=pointer]':
        - /url: /profile/player2
        - heading "Bravo" [level=2] [ref=e14] [cursor=pointer]
        - paragraph [ref=e15] [cursor=pointer]: "Seed #2"
      - 'link "Charlie Seed #3" [ref=e16] [cursor=pointer]':
        - /url: /profile/player3
        - heading "Charlie" [level=2] [ref=e17] [cursor=pointer]
        - paragraph [ref=e18] [cursor=pointer]: "Seed #3"
      - 'link "Delta Seed #4" [ref=e19] [cursor=pointer]':
        - /url: /profile/player4
        - heading "Delta" [level=2] [ref=e20] [cursor=pointer]
        - paragraph [ref=e21] [cursor=pointer]: "Seed #4"
  - button "Open Next.js Dev Tools" [ref=e27] [cursor=pointer]:
    - img [ref=e28] [cursor=pointer]
  - alert [ref=e31]
```