# Kit 42

Kit 42 is a product with features for Telegram

https://gromadchuk.github.io/kit-42 (recommended to run locally)

#### Available features:
1. [Get account or channel ID](METHODS.md#get-account-or-channel-id)
2. [Contact analysis](METHODS.md#contact-analysis)
3. [Messages stat](METHODS.md#messages-stat)
4. [Animated messages](METHODS.md#animated-messages)
5. [Inactive channels and supergroups](METHODS.md#inactive-channels-and-supergroups)

## 🛠️ Run locally
#### Requirement: [Node.js](https://nodejs.org/en/) >= 18
1. `git clone https://github.com/gromadchuk/kit-42.git`
2. `cd kit-42`
3. `npm install`
4. `npm run dev`
5. Open http://localhost:4242/ in your browser
## ⚠️ Deleting a session
We recommend to remove active session after using Kit 42 to make sure that the service doesn't do something without your knowledge.

1. Open the settings tab
2. Open «Devices» or «Active Sessions» (dependent by device)
3. Find a session with «kit42»
4. Click on session row
5. Click on «Terminate session»
6. Confirm your action

## 🌏 Translations
We use [Crowdin](https://crowdin.com/project/kit-42) as a translation platform.

![English](https://img.shields.io/badge/dynamic/json?color=green&label=English&style=flat&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAOSSURBVHgB7Zc7aBRRFIb/0SEiuxFMortaaMhGwVfW0mTFFyYDaqEGG7FWiV3ELDaJxsqAgoXBBwiK2oiPQguNjYKPSvKyUBKNFsluwIBkIpig4/3P3TvkUZpZGZyvmb0zZ4bz3/ufc+8CERERERH/M9auhuttnoUdmGdu2K9RCRfBYnXbKvkzCIAP3hJUWkEL8HbYvCQTcWRqK/G06yPciUl51Lh/I3r6RjAw+E3G1akypDetnBPz6s0Qcnmd6OaaFUgkSiUGy5epDy9F0BQElMqAiTHRgcExJJNxJUCLc91JxGKLEI+XSAzvMWnGUmRSvcsxY/hMOHwIqF+LoLF2Otc9M2CC1y4fxNGmB/4snzi+Bbmci/uP+qHFxnGxY9+MmIsde/Dq9Vc/hmRPboNTLAGba5KoUxa6deedrEYuP46mY1vwQCXE2TeJ02Y3Z8Xcuv1OhMRjJRKTSlXg/sN+ZJd8hlP6HUEjFnInpjD4aUwnm/Dk6o/5XF3d+BQGZsXkC96nINYK/Z/PjesvT0wAP0YRNL6FOINioU5tIVOYtBC5fOWtXKurytDe1oDmlsd+zLnW3SLuploNQzazGE6qBEEjAqpT5aqjbMD5Cy/lJoU0HatVFuqTgiZba1cjU7d6RkxL83Z0Xn3jC2FXYvFTbLFqwDY/mChXgWJoh57eEbEJxyQ36qpC/SIx6ZqV0j7ZgUhatc+8qgmOe/o8FJM5Fmpvq0fzqSfykMVJC1GIsQd7PVeHFjIxtFB3b066EL/De9mF/XCsYQSNCOAMcvlb27tgxLSc3C5dyWxkmYKFOoyFYlps59W3foxTv0Z1oXJ00kLFFCDtr6pC2WYYTsNaZZUhfyYzdZUFO/3UG5mr7z199tG3G72u7aTtQztmGyrg1BRpJ2YRSnu09EwzOWmdhY0qsVy3yST0LpuqKpdnvGdiuAtzAihc2LQe2F2kjYwbVOOBDWg92+UnxB2ZmxZXg3CWM7WrxELTY9iFunt1MTce2KjElUlM9sg6OOngV0AE0BpcfZMYMWcgc88UuWmZhGchHjNMDN9hjFioSDVgi9fdyTkPpidKmOR0gcTsETPeyevfMfxCMbBGcuMezzXzSRxTqA78v4DG8hQIMTaev0CYsby9h0K9AgsQckJfA6FfARt37yHMhL6IbXVSQ5iJivhfY+P0WYQZG33vEWZsWL8vKSelEUq8cB/kIiIiIiL+mj8QdODxzMXLJAAAAABJRU5ErkJggg==&query=%24.progress[?(@.data.languageId==%27en%27)].data.approvalProgress&url=https%3A%2F%2Fbadges.awesome-crowdin.com%2Fstats-12852845-602715.json)
![Ukrainian](https://img.shields.io/badge/dynamic/json?color=green&label=Ukrainian&style=flat&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAB0SURBVHgB7dhBDYBQDATRluAHCwQZyMAAWEASCsACQmDBxab585IKmKSnjQAAtCyn5VyVGqOgzLx65btFUZLGLoojwI0ANwLcCHAjwI0At/IBqXtWFMYLuRHgRoAbAW4EuBHgRoBb/9/+79RDVPToCABA0z5kmhHKdOI6YgAAAABJRU5ErkJggg==&query=%24.progress[?(@.data.languageId==%27uk%27)].data.approvalProgress&url=https%3A%2F%2Fbadges.awesome-crowdin.com%2Fstats-12852845-602715.json)
![Russian](https://img.shields.io/badge/dynamic/json?color=green&label=Russian&style=flat&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAB8SURBVHgB7dWxDYNAEETROfv6sUuAiLLoAImYasgJEE2QUQILVDFa8V+y8Q9WIwEA3qxERH/fRjmtT0AosY+SI8CNADcC3NIH1HXblVlpu4kldiLAjQA3AtwIcKvDd1Fm9V8OZcYPuBHgRoAbAW5V5Rzvjp9SilkAgFe7AKTnE3byYr2NAAAAAElFTkSuQmCC&query=%24.progress[?(@.data.languageId==%27ru%27)].data.approvalProgress&url=https%3A%2F%2Fbadges.awesome-crowdin.com%2Fstats-12852845-602715.json)

## 🧩 Packages
* [Mantine](https://mantine.dev/) — UI components library
* [Tabler icons](https://tabler-icons.io/) — free and open-source icons
* [GramJS](https://github.com/gram-js/gramjs) — Telegram client library
