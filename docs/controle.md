# Controle van de zelfstandige proef

15 september 2026 — versie 0.1.0

## Geautomatiseerd

`npm test`: vier controles geslaagd.

- Vijftig unieke beelden en drie volledige reeksen van vier stappen; iedere verwijzing bestaat en iedere oefenstand heeft vier voorbeeldteksten.
- Alle 200 beeldvarianten bestaan. Miniaturen blijven binnen 256 pixels, grote weergaven binnen 960 pixels. AVIF samen blijft onder 750 kB en alle varianten samen onder 2,5 MB.
- Geen ingebedde foto's, tijdelijke downloadlinks of Codex-runtime vereist.
- Betekenissen en oefenreeksen zijn ongewijzigd overgenomen uit de leesbare broninhoud.

## Browsercontrole

De app is vanuit `public/` op een lokale HTTP-server geopend in Chrome.

- Alle achttien beeldplaatsen op de eerste cataloguspagina laden. De browser kiest AVIF. Alleen het grote collectieoverzicht en de benodigde miniaturen zijn voor deze pagina geladen.
- De drie miniatuurreeksen tonen elk een raster van twee bij twee foto's. De fotoverhoudingen blijven behouden.
- Zoekterm `haren` met filter Handelingen en sortering A–Z geeft: Haren afdrogen, Haren kammen, Haren wassen. De filter blijft geselecteerd.
- Tandenpoetsen tweemaal toegevoegd: Nu / A2 / kernwoorden en Ik heb / B1 / zinsstarters. Beide instellingen blijven onafhankelijk in de lesselectie.
- Op het bord alles afgedekt, vervolgens één paneel onthuld; precies één beeld wordt getoond. Navigatie naar het tweede lesitem toont de eigen verleden-tijdopdracht en zinsstarters.
- Geen browserconsolefouten tijdens deze controle.
- Desktopweergave bekeken op 1024 pixels. Bord, collectie en beeldkaart gecontroleerd op 320 pixels: geen horizontale overloop.

De eerdere inline proef is ook inhoudelijk gecontroleerd op de context van het bekertje, de ontbrekende afronding van de handenwasreeks en de uitwisselbare middenstappen bij scheren. Die docentnotities en oorspronkelijke Drive-verwijzingen zijn behouden.

Geen claim over productiesnelheid bij duizenden beelden, volledige toegankelijkheid, beveiligde hosting of examengeschiktheid. De WebP-bestanden en verwijzingen zijn gecontroleerd; een afzonderlijke oude-browsercompatibiliteitstest is niet uitgevoerd.

## Header en appmenu — 15 september 2026

- Spreektijd-header en logo als bron gebruikt; alle tien logo-paden zijn exact gelijk aan de bron. Alleen kleur, beschrijving en donkere variant zijn aangepast.
- Headerhoogte 60 px en scheidingslijn 32 px gemeten. Op een scherm van 1920 px is de header ook 1920 px breed; de collectie-inhoud blijft maximaal 1280 px.
- Op 320 px passen header, knop voor lesselectie en alle vier menuregels zonder horizontale overloop. Menu en header ook op desktop en in donkere modus visueel gecontroleerd.
- De vier menulinks komen overeen met de Spreektijd-appregistratie. De gedeelde SVG-logo's laden en tonen de eigen kleuren van Missies, Klankstudio, Digibord en Spreektijd.
- Escape sluit het menu en herstelt de focus op de menuknop. Pijl-omlaag opent het menu en focust Missies. Een klik buiten het menu sluit het menu.
- Eén oefenreeks toegevoegd; terugkeer via Beeldbank behoudt de lesselectie en de teller toont één lesitem. Op het bord blijft de lesselectieknop verborgen en is de header 60 px hoog.
- Petrol op de lichte header heeft contrast 6,09:1; de lichte petrolvariant op de donkere header 6,81:1. Dit is een controle van de toegepaste kleurcombinaties, geen volledige toegankelijkheidsaudit.
