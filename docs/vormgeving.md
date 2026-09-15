# Beeldbank in de Taalroute-appfamilie

De header is gebaseerd op de bestaande Spreektijd-productheader, broncommit `e59bff39335b5fd520fa7ca638b83569110ed19f`:

- `26buckets/taalroute-spreektijd/digibord/source/02_digitaal/shared/app-header.css`
- `26buckets/taalroute-spreektijd/digibord/source/shared/app-header.html`
- `26buckets/taalroute-spreektijd/public/taalroute-logo-spreektijd.svg`

De maatvoering is gelijk: een vaste header van 60 px inclusief een kleurstrook van 2 px, 24 px zijruimte op desktop, een logo van 193 px, een scheidingslijn van 32 px en knoppen van minimaal 44 px. De appnaam gebruikt dezelfde Interface/Arial-lettertypestapel; er wordt geen extra lettertype opgehaald. De header loopt zonder maximale breedte van de linkerrand tot de rechterrand van het scherm. De inhoud houdt een eigen maximale leesbreedte van 1280 px.

## Eigen appkleur

Op expliciet verzoek van de eigenaar krijgen zowel het volledige woordmerk als de driehoek dezelfde appkleur. Dat wijkt bewust af van het algemene verbod op handmatig omkleuren in de oudere centrale logogids. De padgeometrie en onderlinge verhoudingen van het bestaande Spreektijd-logo zijn exact behouden; er is geen nieuw lettertype of opnieuw getekend woordmerk gebruikt. Deze appvariant is lokaal in deze repository vastgelegd, niet toegevoegd aan het centrale merkregister.

| Toepassing                                      | Lichte modus | Donkere modus |
| ----------------------------------------------- | ------------ | ------------- |
| Logo, driehoek, kleurstrook, primaire bediening | `#0F6B78`    | `#70CAD4`     |
| Header en kaarten                               | `#FFFDF8`    | `#24343A`     |
| Pagina                                          | `#F2EFE8`    | `#19262A`     |
| Tekst                                           | `#22313D`    | `#EDF1F3`     |

De app gebruikt `--bath-accent` als gedeelde CSS-variabele. De twee externe SVG-bestanden bevatten dezelfde kleurwaarden en volgen de systeemvoorkeur voor lichte/donkere modus. Bij een toekomstige kleurwijziging moeten CSS en beide SVG's samen worden aangepast.

Het headerlogo is 5261 bytes en de driehoek als favicon 214 bytes. Eén extra SVG van 4841 bytes deelt de logo-geometrie tussen alle vier menuregels, met hun eigen merkkleuren. De fotoformaten, afbeeldingsbestanden en laadstrategie zijn gelijk gebleven.

## Bediening en kleine schermen

De appnaam Beeldbank is een knop terug naar de collectie, zonder pagina-herlaadactie. Lesitems, zoekterm en sorteerkeuze blijven in het geheugen. Toetsenbordfocus komt na de terugkeer op de collectietitel.

Op schermen tot 600 px gebruikt de header 8 px zijruimte en een woordmerk van 146 px, zoals de compacte Spreektijd-header. De lesselectie krijgt een compacte knop met pictogram en teller. De toegankelijke knopnaam noemt het aantal lesitems ook als het tekstlabel verborgen is. De header blijft 60 px hoog. Op het bord is de lesselectieknop verborgen, zoals in het bestaande prototype.

## Gedeeld appmenu

Het logo en de pijl openen het appmenu. De vier links en merkkleuren zijn rechtstreeks overgenomen uit `digibord/source/shared/taalroute-apps.json` in dezelfde Spreektijd-broncommit:

- Missies: `https://missie.taalroute.nl/#docent`
- Klankstudio: `https://klankstudio.taalroute.nl/`
- Digibord: `https://digibord.taalroute.nl/`
- Spreektijd: `https://spreektijd.taalroute.nl/02_digitaal/`

De links openen in een nieuw tabblad, zodat de tijdelijke lesselectie behouden blijft. Dit wordt ook in de toegankelijke linknamen vermeld. Het menu werkt met muis, aanraking en toetsenbord: Enter/Spatie schakelt het menu, pijl-omlaag opent de eerste link, Tab doorloopt de links, Escape sluit en geeft de focus terug. Buiten klikken of de focus buiten het menu verplaatsen sluit het menu ook. De menubediening staat los van het ophalen van de badkamercollectie.
