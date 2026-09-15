# Cloudflare-inrichting

De app draait op **https://beeldbank.taalroute.nl** als Worker met Static Assets, D1 en een privé R2-bucket.

| Onderdeel | Naam |
| --- | --- |
| Worker | taalroute-beeldbank |
| D1 | taalroute-beeldbank — 1104d0e1-13cc-4ca1-b500-83128547ffc2 |
| R2 | taalroute-beeldbank-images, jurisdictie EU |
| Access-app | Taalroute Beeldbank — a5b4ac51-a1ba-48fa-8aff-824c0fada678 |
| Access-policy | Beeldbank beheerder — 919e7d08-7c5d-47dd-9d6b-6f5fb55d5185 |

De oorspronkelijke toegangsregel staat alleen het e-mailadres van de Cloudflare-eigenaar toe. Docenten worden expliciet toegevoegd aan deze app-policy; pas geen algemene beheerderspolicy aan. De aanmelding gebruikt de bestaande Lingua Academy Access-organisatie. Dit is nog geen gedeeld Taalroute-accountstelsel.

## Openbare testmodus

De Worker is gepubliceerd met `PUBLIC_PREVIEW=true`. De app, collecties en afbeeldingen kunnen dan zonder JWT worden opgehaald zodra Cloudflare Access dit verkeer doorlaat. De actieve app-policy is **Beeldbank openbare test**, actie **Bypass**, Include **Everyone**, uitsluitend gekoppeld aan **Taalroute Beeldbank** op `beeldbank.taalroute.nl`. Deze policy (`21b05bfb-6f8f-4afd-8214-eb7d367d4e86`) is op 15 september 2026 na bevestiging van de eigenaar geactiveerd.

Lesselecties worden in deze modus met de sleutel `taalroute-beeldbank-public-lesson-v1` in de eigen browser bewaard. `/api/lesson` geeft alleen aan dat browseropslag gebruikt moet worden; schrijven naar die route wordt geweigerd. De bestaande docentselecties in D1 worden niet gelezen of gewijzigd. Een andere browser heeft een eigen selectie. Bij geblokkeerde browseropslag kan de gebruiker in het huidige venster blijven oefenen.

De R2-bucket blijft privé; de openbare Worker levert de afbeeldingen. Bestaande contentpakketten blijven in D1 staan. De app heeft geen openbaar inhoudsbeheer.

Om later de afgeschermde modus te herstellen: verwijder de openbare testpolicy van deze Access-app, zet `PUBLIC_PREVIEW` op `"false"` en publiceer opnieuw. De bestaande eigenaarspolicy en JWT-controle zijn behouden. Browserselecties worden daarbij niet automatisch naar accounts overgezet.

## Beveiliging in afgeschermde modus

- Access beschermt het volledige eigen domein, inclusief afbeeldingen, gegevens en API.
- De Worker controleert daarnaast de JWT-handtekening, uitgever, app-audience, vervaldatum en identiteit. Een zelfgemaakte e-mailheader geeft geen toegang.
- `run_worker_first: true` voorkomt dat appbestanden de eigen controle overslaan.
- `workers_dev` en preview-URL's zijn uitgeschakeld.
- R2 is privé. Afbeeldingen komen alleen via de geauthenticeerde Worker; er is geen openbare R2-link.
- De productiebuild bevat alleen HTML, CSS, JavaScript en logo's. Foto's, collectie-JSON, testhulpmiddelen en originelen worden niet als statische bestanden gepubliceerd.
- Antwoorden worden uitsluitend privé gecachet. Lesselecties en collectiegegevens gebruiken `no-store`.
- PUT-verzoeken vereisen dezelfde origin, JSON, geldige lesitems en maximaal 64 KiB. Een versienummer voorkomt stil overschrijven tussen tabbladen.

## Database en inhoud

`migrations/0001_initial.sql` bevat twee tabellen:

- `content_packages`: één JSON-pakket per collectiebestand/collectieregister, geïndexeerd op bestands-ID.
- `lesson_selections`: de actuele selectie per geverifieerde Access-gebruiker, met versienummer.

Bij de eerste toegestane aanvraag vult de Worker een ontbrekend inhoudspakket vanuit de meegebouwde, versiebeheerde bron. `INSERT OR IGNORE` en opnieuw lezen voorkomen een race bij de eerste opening. Bestaande inhoud in D1 wordt nooit automatisch overschreven. Er is geen openbare import- of beheerdersroute.

Dit is een kleine eerste databasestructuur. Collecties, beelden en reeksen zijn nog geen afzonderlijke relationele tabellen; het inhoudelijke gegevensmodel blijft behouden binnen de pakketten. Voor een beheeromgeving kan dat later worden uitgesplitst. Een nieuwe codepublicatie vervangt bestaande D1-pakketten niet: inhoudswijzigingen moeten via een gerichte datamigratie worden gepubliceerd. Er is nog geen inhoudseditor.

De eerste twee tabellen zijn via de Cloudflare D1-console aangemaakt. De bestaande lokale Wrangler-aanmelding kan Workers en R2 beheren, maar heeft geen zelfstandige D1-beheerrechten. De normale D1-binding van de app werkt wel. Voor toekomstige databasebeheeropdrachten is een passend geautoriseerde beheerder nodig; er staan geen geheime sleutels in Git.

## Publiceren

Node.js 22.13 of nieuwer:

```sh
npm ci
npm test
npm run upload:images
npm run deploy
```

Upload afbeeldingen vóór een wijziging die ernaar verwijst. `upload:images` uploadt uitsluitend de kleine AVIF/WebP-bestanden, vier tegelijk. Het script meldt een fout als een upload mislukt. `deploy` test, bouwt de expliciete productie-map en publiceert via Wrangler. GitHub bevat de bron; automatische deployments vanuit GitHub zijn nog niet ingesteld.

Voor een nieuwe lege D1-database voer je eerst de migratie uit. De lokale migratie werkt met `npm run db:local`. `npm start` blijft de losse visuele preview op poort 8852 aanbieden; daar zijn lesselecties tijdelijk. De online app bewaart ze in openbare testmodus in de eigen browser en in afgeschermde modus in D1.

## Controle

De tests dekken inhoud, beeldbudgetten, toegang op alle routes, echte JWT-controle, docentisolatie, versieconflicten, ongeldige invoer, R2-responsen en de lokale Cloudflare-runtime. In afgeschermde modus moeten anonieme HTTP-verzoeken naar Cloudflare Access worden gestuurd. In openbare testmodus moeten de app, collectiegegevens en beelden zonder cookie bereikbaar zijn, terwijl D1-lesselecties niet via de API beschikbaar zijn. Verifieer na login ook: collectie openen, een beeld toevoegen, herladen en dezelfde selectie terugvinden.

Gecontroleerd op 15 september 2026: online ingelogd de huiscollectie en badkamer geopend, AVIF-beelden geladen, een beeld aan de les toegevoegd en na herladen teruggevonden. Het tijdelijke testitem is daarna verwijderd. De browser meldde geen fouten. De toenmalige deploymentversie was `fa606182-2220-4111-8d7b-2f38fed4ec48`. Alle 16 tests slagen; de afhankelijkhedenaudit meldt geen bekende kwetsbaarheden.

Op 15 september 2026 is de openbare Worker-testmodus gepubliceerd als `a9fd49cd-88aa-452a-b9c3-7f862c0aeaa7`. Alle 18 tests slagen, inclusief openbare toegang in de Worker, afscherming van D1-lesselecties en browseropslag. Zonder cookies geven de homepage, beide collectiegegevensbestanden, de lesopslagconfiguratie en een AVIF-afbeelding HTTP 200; de les-API geeft uitsluitend browseropslag terug en weigert anonieme PUT-verzoeken met HTTP 403.

De openbare browsercontrole slaagde: huis en badkamer openen, tandenborstel toevoegen, herladen en dezelfde selectie terugvinden. Het tijdelijke proefitem is verwijderd. De browser meldde geen fouten.
