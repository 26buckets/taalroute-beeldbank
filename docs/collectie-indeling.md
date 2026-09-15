# Indeling van de beeldbank

De eerste uitgewerkte route is **Collecties → Het huis → Badkamer & verzorging**. Het huis is een bovenliggende collectie met een eigen cover. De badkamer houdt dezelfde 50 beeldrecords en drie reeksen. De bovenliggende collectie verwijst naar deze inhoud; er worden geen beelden gekopieerd.

## Het huis

| Onderdeel              | Inhoud en mogelijke reeksen                                   |
| ---------------------- | ------------------------------------------------------------- |
| Badkamer & verzorging  | Tandenpoetsen, handen wassen, scheren; nu beschikbaar         |
| Keuken & koken         | Keukengerei, bewaren, bereiden, koken, afwassen               |
| Woonkamer              | Meubels, zitten, bezoek ontvangen, spullen neerzetten         |
| Slaapkamer             | Bed, kleding, opstaan, aankleden, bed opmaken                 |
| Hal & trap             | Voordeur, sleutels, jas ophangen, vertrekken, traplopen       |
| Tuin & balkon          | Planten, tuingereedschap, water geven, buiten zitten          |
| Energie & installaties | Verwarming, thermostaat, warmtepomp, zonnepanelen, ventilatie |

De zes nog niet gevulde onderdelen zijn als concept vastgelegd. Ze verschijnen pas in de docentnavigatie wanneer het bijbehorende materiaal is ingevoerd en gecontroleerd. Geen lege tegels of beloofde oefenreeksen in het lesgebruik.

## Ruimtes en activiteiten apart houden

Gebruik één vaste plaats in de boom voor de navigatie en daarnaast meerdere onderwerpverwijzingen. Een badkamerbeeld kan de labels persoonlijke verzorging, schoonmaken en dagelijkse routines krijgen. Een keukenbeeld kan ook schoonmaken krijgen. Zo kan later één thematische zoekopdracht beelden uit verschillende ruimtes vinden.

De labels staan als stabiele ID's in de gegevens. Ze zijn in deze versie voorbereid; er is nog geen aparte zoekpagina over alle onderwerpverwijzingen. Een methode of hoofdstuk wordt later eveneens een verwijzing, geen eigenaar van de beelden. Het niveau hoort bij de oefenopdracht, niet verplicht bij de foto.

Een les zoals Mijn ochtend combineert vervolgens bestaande beelden of reeksen uit slaapkamer, badkamer en keuken. De foto blijft één bestand met één beschrijving; de docent kiest de opdrachtvorm Nu, Eerst–dan, Je moet of Ik heb.

## Voorstel voor volgende hoofdcollecties

Naast Het huis zijn de volgende hoofdcategorieën als concept voorbereid:

- De buurt
- Onderweg
- Winkels & diensten
- Werk & beroep
- Gezondheid & zorg
- School & leren
- Vrije tijd

Vul eerst de keuken en slaapkamer. Daarmee wordt Mijn ochtend meteen een bruikbare les over meerdere ruimtes. Breid daarna uit met woonkamer, hal en tuin; energie en installaties kunnen een eigen verdiepingscollectie worden. Maak per nieuwe collectie eerst een overzichtsbeeld, daarna de belangrijkste voorwerpen en handelingen en vervolgens enkele reeksen van maximaal vier stappen.

## Bouwafspraken

`public/data/collections.json` bevat de categorieën, ouderverwijzingen, onderwerpen en publicatiestatus. `collection-tree.js` verzorgt de paden en zoekt gepubliceerde onderliggende collecties. Controles weigeren dubbele ID's, ontbrekende ouders en kringverwijzingen.

Alle beelden uit het huis toont nu dezelfde 50 badkamerbeelden en drie reeksen, omdat de badkamer de enige gevulde deelcollectie is. De huisafbeelding is een navigatiecover en telt niet als extra oefenbeeld. De browser houdt de zoekindex in het geheugen, gebruikt kleine AVIF/WebP-miniaturen en haalt geen foto's van Drive op.

De huidige inhoudsrenderer laadt nog één inhoudspakket, `badkamer.json`. Bij import van een volgende gevulde collectie moet ook de inhoudsloader worden uitgebreid, inclusief collectie-ID's in lesitems en zoeken over meerdere pakketten. Alleen een concept op gepubliceerd zetten importeert nog geen inhoud. De categorieboom en het bestaande badkamerpakket zijn daar bewust afzonderlijk voor vastgelegd.
