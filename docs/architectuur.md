> Stand 15 september 2026: de eerste Cloudflare-inrichting is uitgevoerd. Zie [cloudflare.md](cloudflare.md) voor de daadwerkelijke implementatie en de nog open uitbreidingen. Onderstaande architectuurschets bevat ook toekomstplannen.

# Bouwkeuzes: gegevens, beelden en snelheid

## Eerste versie

De browser haalt één compact gegevensbestand op met de badkamercollectie. Eenmalig worden de woordzoekindex en verwijzingen per beeldnummer gemaakt. Filteren en sorteren gebruiken die gegevens in geheugen; er gaat geen aanvraag per toetsaanslag naar een server. Er worden maximaal acht catalogusmaterialen tegelijk getoond. Een reeks bundelt vier afzonderlijke foto's en houdt de eigen beeldkaarten beschikbaar.

De afbeeldingen staan los van de code. AVIF wordt aangeboden via `picture`, met WebP als terugval. `loading="lazy"` geldt voor miniaturen; het overzicht en een geopende foto of reeks laden direct. Breedte en hoogte liggen vooraf vast. Bestandsnamen bevatten een inhoudshash: een toekomstige host kan de beeldbestanden lang cachen. De JSON, HTML en code moeten kort cachen of opnieuw worden gevalideerd. Compressie door de webserver kan de overdracht van tekstbestanden verder verminderen.

## Wanneer wel een database?

De huidige, alleen-lezen proef kan prima zonder. Een centrale database is aan te raden zodra redacteuren online inhoud wijzigen of docenten selecties op meerdere apparaten willen bewaren of delen. Toegangsbeveiliging is een aparte functie en kan op de bestaande Taalroute-login aansluiten.

Voor de productieversie is PostgreSQL een passende optie. Voorgestelde tabellen:

| Onderdeel | Bewaart |
| --- | --- |
| Beeld | Stabiel ID, beschrijving, versie, publicatiestatus en bestandsverwijzingen |
| Begrip en beeld-begrip | Betekenis, woorden, synoniemen en de koppeling aan meerdere beelden |
| Collectie en collectie-beeld | Themaverzameling en lidmaatschap zonder beeldkopieën |
| Reeks en reeksstap | Twee tot vier beelden, bronvolgorde en uitleg over mogelijke alternatieven |
| Oefenprofiel | Opdrachttekst, perspectief, tijd, steun, niveauvoorstel en docentvoorbeeld |
| Les en lesitem | Docentselectie met eigen instellingen per toevoeging |
| Methodekoppeling | Optionele verwijzing naar een methode of hoofdstuk; nooit de hoofdindeling |

School- en gebruikersrechten worden gekoppeld aan deze gegevens. Iedere toevoeging aan een les krijgt een eigen ID, ook als het om dezelfde reeks gaat. Daardoor kan dezelfde reeks als oefening in tegenwoordige én verleden tijd naast elkaar blijven bestaan.

Foto's blijven in afgeschermde bestandsopslag. De database bewaart alleen verwijzingen en kenmerken. Geef een browser uitsluitend toegang tot beeldbestanden waar de gebruiker recht op heeft; bescherm ook directe bestandsaanvragen.

## Snel blijven bij uitbreiding

Behoud de zelfstandige gegevenslaag en stabiele ID's. Voeg bij veel collecties een compacte zoekindex en laden per collectie toe, voordat alle teksten en beelden wereldwijd tegelijk worden ingeladen. Sorteer op geïndexeerde gegevens; laat zware beeldbewerking nooit tijdens zoeken of presenteren plaatsvinden. Met een centrale database kan de leeslaag nog steeds uit gecachte gegevensbestanden of een compacte API komen.

De proef bewijst de interactie met 50 beelden. Een productieclaim over duizenden beelden, p95-responstijden of een digibordverbinding moet later met representatieve gegevens, netwerkcondities en docentapparatuur worden gemeten.

## Bronnen bij deze keuzes

- [MDN: beeldformaten en terugvalformaten](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types)
- [MDN: laden en afmetingen van afbeeldingen](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img)
- [PostgreSQL: relaties, integriteit, indexen en JSON](https://www.postgresql.org/about/)
