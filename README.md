# Wealthsimple CSV Exporter Chrome Extension

I built this while looking for a way to export my transactions from [Wealthsimple](https://wealthsimple.com) to use in other money management tools.

It's very user-unfriendly, and may stop working when Wealthsimple changes their page structure.

There are TODOs scattered around, but I don't plan on working on this more. It really became an exercise in parsing data from unknown web pages, and could be generalized into a broader tool.

## Usage

Run `yarn build` and load it into Chrome as an Unpacked Extension. Go to your Wealthsimple account transactions page and click the extension button.

You're now in "matching mode" where the extension is asking you to identify elements that denote dates. Click a date heading, and a query selector will be shown at the top of the page. Toggle selector elements on and off until all the dates on the page are highlighted in green (usually requires turning off a few selectors from the end of the list). Click OK at the bottom of the page.

Next, choose elements that represent transaction names and adjust the selector. Finally, choose elements that represent transaction amounts and adjust the selector.

If all goes well, a CSV will automatically be downloaded.
