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

## Herstel originele groentereeks — 16 september 2026

De gebruiker leverde de originele vier PNG’s aan. Ontbrekende stappen 051, 052 en 053 zijn toegevoegd aan [05_Reeksen](https://drive.google.com/drive/folders/1UllEAFjk_oo5PTUo3ZAP-WoJ35YOgCFY). De aangeleverde derde stap had per ongeluk bronnummer 052; de opgeslagen kopie heet 053. Downloads blijven ongewijzigd. De vierde stap 054 stond al op Drive: compressie van het aangeleverde origineel levert exact dezelfde vier weergavebestanden op, dus er is geen dubbele kaart aangemaakt.

De reeks verwijst nu naar 1051, 1052, 1053 en 1054. Losse acties 1021 (snijden), 1032 (wassen) en 1034 (bakken) blijven behouden. Actie 1025 toont rijst opscheppen uit een pan en is visueel verschillend van de paprika in reeksstap 1054; beide blijven beschikbaar. De keuken telt 54 unieke beelden, waaronder vier reeksstappen. De voorbeeldzin bij wassen benoemt nu de paprika’s in het meervoud. Alle instructievormen blijven beschikbaar.

De nieuwe beelden zijn met dezelfde bestaande optimizerinstellingen verwerkt. De complete keuken-AVIF-set is nu 802.680 bytes. Het nieuwe D1-pakket heet `keuken-20260916-originele-reeks-v1.json`; andere pakketten en bestaande lesitems blijven behouden.

Drive bevestigt drie voltooide originele uploads en alle vier oorspronkelijke bestandsnamen in 05_Reeksen. De 16 kleine versies staan in de aparte map [Verkleind](https://drive.google.com/drive/folders/1SFlNOp7wnzQH0io1XkOChl0I6EfaaX5C); alle uploads zijn voltooid. Lokale originelen en het naam-/hashregister staan buiten Git in `outputs/keuken-groente-reeks` van de bovenliggende taakmap.

Publicatie `9776b518-40dd-4280-beb7-d2c95b174cb5`: 24 tests slagen. Live inhoud en alle 16 reeksvarianten zijn byte voor byte gecontroleerd. De vier oorspronkelijke afbeeldingen zijn samen in de browser visueel gecontroleerd.
