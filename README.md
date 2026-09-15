# Taalroute Beeldbank

Zelfstandig werkend badkamerprototype met 50 bestaande beelden, beschrijvingen, woorden en drie oefenreeksen. Zoeken, filteren, sorteren, lesselecties en het bordvoorbeeld werken volledig in de browser.

## Starten

Geen installatie of build nodig. Serveer uitsluitend de map `public`:

```sh
python3 -m http.server 8852 --bind 127.0.0.1 --directory public
```

Open daarna <http://127.0.0.1:8852>. Ook `npm start` start deze lokale server. Openen via `file://` werkt niet, omdat de app het gegevensbestand via HTTP ophaalt.

## Proberen

1. Open **Oefen tandenpoetsen**.
2. Kies **Nu**, **Eerst–dan**, **Je moet** of **Ik heb**.
3. Kies een oefenvoorstel en kernwoorden of zinsstarters.
4. Voeg de reeks toe aan je les of kies **Toon op bord**.
5. Open een beeldkaart voor de letterlijke beschrijving, woorden, gebruikssituaties en eventuele docentnotitie.

Dezelfde reeks kan meerdere keren in een les voorkomen met eigen instellingen. De selectie leeft in het geheugen van de pagina en verdwijnt bij herladen. Het bordvoorbeeld is onderdeel van dezelfde pagina.

## Kleine afbeeldingen

- AVIF is de voorkeursversie; WebP is de terugval voor browsers zonder AVIF.
- Miniaturen hebben maximaal 256 pixels op de langste zijde.
- Grotere beelden hebben maximaal 768 pixels; twee overzichten maximaal 960 pixels.
- De catalogus gebruikt miniaturen. Grotere foto's worden alleen bij het overzicht, een beeldkaart of een geopende reeks geladen.
- Foto's staan als losse bestanden met een inhoudshash in hun naam. Geen base64, originele PNG's, externe fonts of runtimepakketten.
- De originele 50 PNG's zijn samen **99,28 MB**. De 50 AVIF-weergavebeelden zijn samen **583,7 kB**, met **96,7 kB** extra voor alle miniaturen. Inclusief alle WebP-terugvalbestanden staat er **2,08 MB** beeldmateriaal in de repository. Een browser laadt per beeld één formaat.

Dit zijn gemeten bestandsgroottes in decimale kB/MB. Er is geen absolute minimumgrootte zonder kwaliteitsgrens: de instellingen houden de afgebeelde voorwerpen en handelingen herkenbaar. De originelen blijven op Drive beschikbaar voor toekomstige grotere weergaven of drukwerk. Zie [het bestandsgrootterapport](docs/image-sizes.json).

## Is een database nodig?

**Voor dit prototype niet.** De gedeelde inhoud staat in een JSON-bestand; zoeken en sorteren werken daarna lokaal. Voor de uiteindelijke schoolapp adviseren we een centrale database voor beheer, relaties, publicatiestatus en gedeelde lesselecties, gekoppeld aan de bestaande Taalroute-toegang. Foto's zelf horen in bestandsopslag, niet in databaserecords. Zie [de concrete bouwkeuzes](docs/architectuur.md).

## Bestanden

- `public/`: de complete app die een webserver kan aanbieden.
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

Een werkend prototype, zonder productie-inlog, centrale opslag of automatische beoordeling. A2/B1 zijn oefenvoorstellen; de inhoud is nog niet als examen gevalideerd. De repository is privé. Een eventuele toekomstige website heeft afzonderlijke toegangsbeveiliging nodig; die ontstaat niet door een privérepository.

De app is nog niet gehost of openbaar gepubliceerd. Er is geen externe dienst nodig om lokaal te draaien.
