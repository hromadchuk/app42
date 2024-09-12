# Development

Some information for developers for an easy start. For any additional questions you can [message me on Telegram](https://t.me/iamhro).

***Write all commits and comments in English.***

## Language keys

All language keys are written in the [dev.json](src%2Flanguages%2Fdev.json) file, which is used as a base file for translation. If you have difficulties with English, please use the [DeepL](https://deepl.com/) translate service.

**Do not make** changes in other language files! We will do the translation and update the PR.

What is the difference between dev and eng? In general, these files are the same. But en may contain corrections from knowledgeable people.

## Local run

1. `git clone git@github.com:hromadchuk/app42.git` to clone the repository
2. `cd app42` to move to the project directory
3. `npm run install` to install all dependencies
4. `npm run dev` to start the development server
5. Open [http://127.0.0.1:4242](http://127.0.0.1:4242) in your browser
6. `npm run lint` to check your code for errors

## Server requests

The repository provides client-side code, but in some situations the application communicates with the server. In development mode you will see [mock data](src/lib/mock.ts) instead of the actual response, which is enough to write code. 

## GramJS

This library has 2 code variants, for node.js and browser. To update the package version, you need to call the `npm i telegram@browser --save` command. Otherwise, the package may not run.
