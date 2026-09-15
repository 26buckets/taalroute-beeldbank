# Taalroute Beeldbank

Docentweergave met een collectieoverzicht en een complete badkamercollectie: 50 bestaande beelden, beschrijvingen, woorden en drie oefenreeksen. Zoeken, filteren, sorteren, lesselecties en het bordvoorbeeld werken volledig in de browser.

## Starten

Geen installatie of build nodig. Serveer uitsluitend de map `public`:

```sh
python3 -m http.server 8852 --bind 127.0.0.1 --directory public
```

Open daarna <http://127.0.0.1:8852>. Ook `npm start` start deze lokale server. Openen via `file://` werkt niet, omdat de app het gegevensbestand via HTTP ophaalt.

## Proberen

1. Open **Het huis** en vervolgens **Badkamer & verzorging**. Alle 50 beeldkaarten en de drie reeksen staan op één pagina, zonder paginering.
2. Open **Oefen tandenpoetsen** en kies **Nu**, **Eerst–dan**, **Je moet** of **Ik heb**.
3. Kies een niveau en kernwoorden of zinsstarters.
4. Voeg de reeks toe aan je les of kies **Toon op bord**.
5. Open een beeldkaart voor de letterlijke beschrijving, woorden, gebruikssituaties en eventuele docentnotitie.

Dezelfde reeks kan meerdere keren in een les voorkomen met eigen instellingen. De selectie leeft in het geheugen van de pagina en verdwijnt bij herladen. Het bordvoorbeeld is onderdeel van dezelfde pagina.

## Header en appkleur

De header volgt de gedeelde Spreektijd-opbouw: 60 pixels hoog, het bestaande Taalroute-woordmerk, een verticale scheidingslijn en de appnaam. Beeldbank heeft petrol (`#0F6B78`) als eigen accent voor woordmerk, driehoek, kleurstrook en bediening, met een lichtere variant in donkere modus. Het logo opent hetzelfde appmenu als Spreektijd; de knop Beeldbank brengt je terug naar alle collecties met behoud van je lesselectie. De header loopt over de volledige schermbreedte. Zie [de herkomst en CSS-afspraken](docs/vormgeving.md).

## Kleine afbeeldingen

- AVIF is de voorkeursversie; WebP is de terugval voor browsers zonder AVIF.
- Miniaturen hebben maximaal 256 pixels op de langste zijde.
- Grotere beelden hebben maximaal 768 pixels; twee overzichten maximaal 960 pixels.
- Alle 53 kaarten van de badkamercollectie staan tegelijk in het overzicht: 50 beelden en drie oefenreeksen. Zoeken en sorteren werken op de complete verzameling.
- De catalogus gebruikt miniaturen die tijdens het scrollen worden geladen. Grotere foto's worden alleen bij het overzicht, een beeldkaart of een geopende reeks geladen.
- Foto's staan als losse bestanden met een inhoudshash in hun naam. Geen base64, originele PNG's, externe fonts of runtimepakketten.
- De originele 50 PNG's zijn samen **99,28 MB**. De 50 AVIF-weergavebeelden zijn samen **583,7 kB**, met **96,7 kB** extra voor alle miniaturen. Inclusief alle WebP-terugvalbestanden staat er **2,08 MB** beeldmateriaal in de repository. Een browser laadt per beeld één formaat.

De nieuwe huiscover voegt een AVIF van 44,1 kB en een miniatuur van 5,5 kB toe; inclusief WebP-terugval zijn de vier huisbestanden samen 186,1 kB. [Afbeelding en gebruikte prompt](docs/huis-afbeelding.md).

Dit zijn gemeten bestandsgroottes in decimale kB/MB. Er is geen absolute minimumgrootte zonder kwaliteitsgrens: de instellingen houden de afgebeelde voorwerpen en handelingen herkenbaar. De originelen blijven op Drive beschikbaar voor toekomstige grotere weergaven of drukwerk. Zie [het bestandsgrootterapport](docs/image-sizes.json).

## Is een database nodig?

**Voor dit prototype niet.** De gedeelde inhoud staat in een JSON-bestand; zoeken en sorteren werken daarna lokaal. Voor de uiteindelijke schoolapp adviseren we een centrale database voor beheer, relaties, publicatiestatus en gedeelde lesselecties, gekoppeld aan de bestaande Taalroute-toegang. Foto's zelf horen in bestandsopslag, niet in databaserecords. Zie [de concrete bouwkeuzes](docs/architectuur.md).

## Bestanden

- `public/`: de complete app die een webserver kan aanbieden.
- `public/data/collections.json`: hoofdcollecties, deelcollecties, onderwerpen en publicatiestatus.
- `content/badkamer.json`: leesbare broninhoud, onafhankelijk van een methode.
- `public/data/badkamer.json`: compacte inhoud met paden naar beeldvarianten.
- `scripts/optimize_images.py`: reproduceerbare beeldcompressie.
- `docs/`: architectuur, controles en gemeten bestandsgroottes.
- `tests/`: controle van bronverwijzingen, oefenreeksen en groottebudgetten.

## Controleren en beelden opnieuw maken

```sh
npm test
```

Voor de controles is Node.js 20 of nieuwer nodig; er zijn geen npm-afhankelijkheden. Beeldcompressie is optioneel en vereist Python en Pillow met AVIF/WebP:

```sh
python3 -m pip install -r scripts/requirements-images.txt
python3 scripts/optimize_images.py --source-dir /pad/naar/originals
```

De bronmap bevat `1.png` tot en met `50.png`, of de geregistreerde bronbestandsnamen. Het script maakt weergavekopieën, past de JSON-verwijzingen aan en ruimt uitsluitend niet meer gebruikte AVIF/WebP-varianten in de gegenereerde beeldenmap op.

## Status

Het collectieoverzicht opent met **Het huis**, met **Badkamer & verzorging** als gevulde deelcollectie. De overige ruimtes en hoofdonderwerpen staan als concept in de categorie-indeling; andere Drive-collecties zijn nog niet geïmporteerd. Zie [de indeling en het uitbreidingsadvies](docs/collectie-indeling.md). Technische proefteksten en Drive-knoppen zijn verwijderd uit de docentweergave; herkomst en ontwikkelinformatie blijven in de brongegevens en documentatie beschikbaar.

Een werkend prototype, zonder productie-inlog, centrale opslag of automatische beoordeling. A2/B1 zijn oefenvoorstellen; de inhoud is nog niet als examen gevalideerd. De repository is privé. Een eventuele toekomstige website heeft afzonderlijke toegangsbeveiliging nodig; die ontstaat niet door een privérepository.

De app is nog niet gehost of openbaar gepubliceerd. Er is geen externe dienst nodig om lokaal te draaien.
