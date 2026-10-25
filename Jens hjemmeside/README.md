# Jens Korsgaard — Lyddesigner

Portfolio for film, podcast, spil og musik. Det er et statisk website uden build-trin eller eksterne JavaScript-biblioteker.

## Åbn lokalt

Åbn `dist/index.html` i en browser. YouTube-videoerne kræver internetforbindelse. Hvis browseren begrænser lyd eller afspilning fra en lokal fil, kan mappen `dist` serveres lokalt, for eksempel med:

```sh
python3 -m http.server 4173 --directory dist
```

Gå derefter til `http://127.0.0.1:4173`.

## Redigér indhold

- `dist/content.js`: bio, værktitler, YouTube-links og beskrivelser.
- `dist/index.html`: sidens struktur og kontaktformular.
- `dist/style.css`, `dist/refinements.css`, `dist/visibility.css`: udseende.
- `dist/script.js`, `dist/audio.js`: navigation, videoafspilning og lydinteraktioner.
- `dist/assets/audio/`: lydspor og interface-lyde.
- `dist/assets/images/`: bio-portræt.

Portfolioen har Forside, Bio, Kontakt og Værker på dansk og engelsk. Værkerne er Black Hole, God Killer og Husly.

## Kontaktformular

Formularen åbner brugerens mailprogram med en klargjort besked til `jensbkorsgaard@gmail.com`. Brugeren skal selv sende mailen derfra.

## GitHub og videre arbejde

Klon repoet og åbn `dist/index.html`, eller kør den lokale server ovenfor. Repoet indeholder både kildefilerne og de nødvendige billeder og lydfiler.

Et privat GitHub-repo er kun tilgængeligt for ejeren og inviterede samarbejdspartnere. Inviter din ven via repoets **Settings → Collaborators**.

## Publicér med GitHub Pages

Siden er statisk og kræver hverken Node.js, build-trin eller eksterne pakker. Workflowet i `.github/workflows/deploy-pages.yml` er manuelt: det publicerer kun, når en repo-administrator starter det under **Actions → Publish portfolio to GitHub Pages → Run workflow**.

Før første publicering:

1. Gå til repoets **Settings → Pages**, og vælg **GitHub Actions** som deployment source.
2. Gå til **Settings → Actions → General**. Under workflow permissions skal Actions have lov til at oprette deploymenten, hvis GitHub beder om det.
3. Åbn **Actions**, vælg **Publish portfolio to GitHub Pages**, og tryk **Run workflow**.
4. Når workflowet er gennemført, findes sidens adresse under **Settings → Pages**.

Publicering gør selve hjemmesiden offentlig — også hvis kilderepoet er privat. GitHub Pages på GitHub Free kræver et offentligt repo; private repos kræver en plan, der inkluderer Pages. Repoets synlighed skal derfor ikke ændres uden først at beslutte, om alle filer, herunder lydspor og billeder, må være offentlige. Se [GitHubs dokumentation om Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).
