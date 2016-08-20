# EDSalesmanSolver

##What is

This is a simple script for the game Elite Dangerous that tries to solve the "Travelling Salesman" problem.

##How install
Download the `index.html` file. Run it in your ~~favourite~~ modern browser.

##How use

1. You give it an up to date systems data list available from [here](https://eddb.io/api).
   * Note that `systems.json` may crash your browser, and you'll be better off with `systems_populated.json`. I have plans to add some sort of batch based processing for the larger file but I haven't got around to it yet.
      * Note note: It seems that Microsoft Edge can handle the larger file, where Chrome can't. Make of that what you will.
2. You give it your starting system (eg. `lave`) and a list of systems you wish to go to (eg. `witchhaul,fujin,39 tauri`).
3. Press submit
4. The script will calculate and output the fastest (in terms of lightyears) route between all given systems from your starting point.
