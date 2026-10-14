# Portaaljacht

Een blokkenavontuur in de stijl van Minecraft, gespeeld vanuit je eigen ogen (first person).
Werkt in de browser op de computer én op je telefoon.

## Het avontuur

1. **Vind het portaal.** Volg het kompas rechtsboven.
2. **Versla de schurk.** Achter elk portaal ligt een andere wereld met een eigen schurk, steeds sterker en enger.
   Er zijn **14 schurken**:
   1. **De Nether – De Lavareus:** mokerslagen, vuurballen (sla ze terug!) en enorme sprongen
   2. **Het IJsrijk – De Vorstreus:** ijspegels uit de grond, ijsscherven die je vertragen, sneeuwstorm en glad ijs
   3. **De Schaduwwereld – De Schaduwkoning:** teleporteert, schaduwballen die je volgen, duisternis
   4. **Het Hemelrijk – De Stormdraak:** vliegt, duikt op je af en laat bliksem inslaan
   5. **De Zandpiramide – De Zandfarao:** drijfzand, zandhozen, scarabeeën en een gouden staflaser
   6. **Het Oerwoud – De Oerwoudreus:** gooit rotsblokken, brult een groene schokgolf en roept apen
   7. **De Diepe Zee – De Kraak:** tentakelklappen, waterstralen en inktwolken
   8. **De Spinnengrot – De Spinnenkoningin:** webben, spinnetjes en een sprong vanaf het plafond
   9. **De Fabriek – De IJzeren Titan:** laserzwaai, zoekende raketten, een magneet en een schild met generatoren
   10. **Het Paddenstoeleiland – De Sporenreus:** sporenwolken, stuiterringen en paddenstoelmannetjes
   11. **Het Spookkasteel – De Spookridder:** spookklonen, een onzichtbare uitval en zwaardgolven (sla ze terug!)
   12. **De Vulkaan – De Magmaslang:** duikt in de lavapoelen, bijt, laat geisers spuiten en meteoren vallen
   13. **De Kristalgrot – De Kristalgolem:** een kristalschild, kristalbollen, regenbooglasers en kristalpieken
   14. **De Leegte – De Leegtekoning:** de eindbaas, met zwarte gaten, lasers, paarse bollen en kleine schurken uit eerdere werelden
3. **Zoek de schat.** Na de overwinning wijst het kompas naar een verborgen schatkist. Los de puzzel op
   (kleurenreeks, lampjes, patroon onthouden, schuifpuzzel of paren zoeken) en je krijgt munten en diamanten.
4. **Ga naar huis.** Thuis is ergens een nieuw portaal verschenen, naar de volgende schurk.
5. **Koop betere spullen** bij **Handelaar Henk** (zijn kraampje staat bij de start): zwaarden, een boog,
   harnassen en gouden appels. Ook erts (steenkool, ijzer, diamant) en goud leveren wat op.

## De wereld

De bovenwereld is groot (224 × 224 blokken) en elke nieuwe wereld is anders:

- **Biomen:** vlaktes met bloemen en pompoenen, bossen met eiken en berken, een woestijn met cactussen,
  sneeuwland met sparren en bevroren meren, en bergen met sneeuwtoppen
- **Rivieren en grotten:** zwem door slingerende rivieren of graaf naar beneden: in de grotten zit erts,
  en diep onder de grond borrelt lava
- **Het dorp:** rond het kraampje van Handelaar Henk staan huisjes, een waterput, lantaarns en een tarweakker.
  Tik een dorpeling aan en je krijgt een tip (bijvoorbeeld waar het portaal staat)
- **Verborgen schatten:** ergens staat een piramide in de woestijn en een ingestorte toren met een kelder.
  In allebei staat een kist met munten en diamanten
- Het **kompas** laat zien hoe ver het portaal of de schat nog is

Je voortgang wordt bewaard; kies in het menu **Verder spelen**. Na alle 14 schurken kun je een nieuwe,
moeilijkere ronde spelen.

## Spelen

Open `index.html` in een browser (je hebt internet nodig voor de 3D-motor three.js),
of zet de map op GitHub Pages / een webserver en open de link op je telefoon.

### Computer
- **WASD** of pijltjes: lopen · **Spatie**: springen/zwemmen · **Shift**: rennen
- **Muis**: rondkijken (klik eerst in het spel)
- **Linkerklik**: slaan, ingedrukt houden = blok breken · **Rechterklik**: blok bouwen / appel eten
- **Boog**: linkerknop ingedrukt houden en loslaten
- **1–9** of scrollwiel: item kiezen · **Esc**: pauze

### Telefoon (liefst liggend)
- **Linkerduim**: lopen (helemaal naar voren = rennen)
- **Rechterduim slepen**: rondkijken · **tikken**: slaan · **vasthouden**: blok breken
- Knoppen **SLA**, **BOUW** en **▲** (springen); tik op de balk onderin om een item te kiezen
- Tik op Handelaar Henk om zijn winkel te openen, en op een schatkist om de puzzel te starten

## Techniek

- [three.js](https://threejs.org/) r128 (via CDN), verder geen afhankelijkheden
- Alle textures, schurken, dieren en geluiden worden met code gemaakt (16×16 pixel art, WebAudio)
- `js/`: wereld + mesher (`world.js`), generatie (`gen.js`), speler (`player.js`), schurk-basis en
  projectielen (`boss.js`), één bestand per wereld (`realm_*.js`), voortgang en opslaan (`progress.js`),
  voorwerpen (`items.js`), winkel (`shop.js`), puzzels (`puzzles.js`), HUD, geluid en besturing
