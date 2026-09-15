# Keukenimport

Bron: [02_Keuken_en_eten](https://drive.google.com/drive/folders/1XzzfCRMAVCDhowPeSxJrkXA3GnRSKceg). Op 15 september 2026 zijn 51 unieke beelden opgehaald: 20 voorwerpen, 14 handelingen, 13 plaatsrelaties, 3 overzichten en 1 reeksbeeld. Van pasta afgieten is v02 geselecteerd; v01 blijft op Drive staan. De import omvat bronnummer 001–050 en 054. Andere reeksbeelden waren bij deze import niet beschikbaar in de map. De collectie wordt niet automatisch met Drive gesynchroniseerd.

De beschrijvingen, woorden en gebruikssituaties zijn gebaseerd op visuele inspectie van alle opgehaalde beelden. De bronbestandsnaam, Drive-verwijzing en versie staan per beeld in `content/keuken.json`. Beeldnummers 1001–1054 voorkomen conflicten met bestaande badkamerselecties; `sourceNumber` behoudt de oorspronkelijke nummering.

Groente bereiden is samengesteld uit 032 (wassen), 021 (snijden), 034 (bakken) en 054 (opscheppen). De kleding is niet op alle beelden identiek; de docentnotitie maakt dit duidelijk. Er zijn geen ontbrekende beelden bijgemaakt. De reeks heeft vier oefenstanden met voorbeelden en kernwoorden.

Compressie is reproduceerbaar met:

```sh
python3 scripts/optimize_images.py --collection keuken --source-dir /pad/naar/keuken
node scripts/upload-images.mjs keuken
npm run deploy
```

Alle 204 kleine AVIF/WebP-bestanden zijn naar de bestaande privé-R2-bucket geüpload en zonder login via de Worker gecontroleerd. De volledige AVIF-set is 758.799 bytes (waarvan 656.649 bytes grote weergaven). Alle formaten samen zijn 2.399.051 bytes; de bronbestanden zijn 98.749.779 bytes. Zie `image-sizes-keuken.json`.

De frontend laadt de gepubliceerde collecties uit het register, houdt één index met unieke beeld- en reeksverwijzingen bij, en zoekt en sorteert lokaal. Het huis toont beide collecties, en Alle beelden uit het huis combineert ze. Bestaande browserselecties behouden hun beeldnummers. De link met `#keuken-koken` opent de keuken direct.

Het bijgewerkte register wordt onder de nieuwe D1-pakketsleutel `collections-20260915-keuken-v1.json` gevuld, terwijl de publieke URL `data/collections.json` gelijk blijft. Het oude register, badkamerinhoud en docentselecties worden niet overschreven. `keuken.json` wordt als nieuw inhoudspakket gevuld. Latere wijzigingen van bestaande D1-pakketten vereisen een gerichte migratie of een nieuwe versie van de pakketsleutel.

Validatie: 21 tests slagen, inclusief unieke verwijzingen, kleine bestanden, gemengde lesselecties en behoud van bestaande D1-inhoud. Online gecontroleerd: beide collecties onder Het huis, 105 resultaten in het gecombineerde overzicht, zoeken en alfabetisch sorteren, vier oefenstanden, B1-bordweergave, en een keukenreeks plus badkamerbeeld die samen na herladen bewaard blijven. Tijdelijke proefitems zijn verwijderd.

Definitieve Cloudflare-versie: `c9a50298-cc41-4d67-8f60-269b92a378d6`.
