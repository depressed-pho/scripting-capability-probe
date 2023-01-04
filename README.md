# Scripting Capability Probe

This is an addon for inspecting the capability of the JavaScript engine
that is accessible through the Scripting API of Minecraft Bedrock
Edition. It is only for addon developers. It adds absolutely nothing for
general game play.

## Usage

1. Create a world with `Holiday Creator Features` and `Beta APIs` enabled.
2. Activate the addon just for the world. **Do not activate it globally.**
3. Open the world. You will spawn with an item called "Wand of Probing".
4. Open `Settings` - `Creator`. Enable `Content Log GUI`.
5. Swing the wand in the air to inspect the engine. Swinging it again while
   the inspection is going on will cancel it.
6. Sneak-use it to open a preferences UI.

It runs mostly the same tests that are listed in https://node.green/ except
for a few things that aren't relevant in the context of Minecraft
scripting.

## Current findings

At the time of writing of this (1.19.51), the engine is known to be
[QuickJS](https://bellard.org/quickjs/) while the exact version is not
known.

* It supports the ECMAScript ES2020 standard.
* It doesn't support
  [BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt). It
  is an optional feature provided by QuickJS which isn't enabled at the moment.
* Its non-standard modules
  [std](https://bellard.org/quickjs/quickjs.html#std-module) and
  [os](https://bellard.org/quickjs/quickjs.html#os-module) are understandably not available.
* It has a limited support of
  [console](https://developer.mozilla.org/en-US/docs/Web/API/console) API
  but other than that it doesn't support any of Web APIs.
* It doesn't have [Web
  Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
  or [os.Worker](https://bellard.org/quickjs/quickjs.html#os-module)
  although it has
  [Atomics](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics). Having
  no native thread supports renders Atomics completely useless.

## Download

See [releases](https://github.com/depressed-pho/scripting-capability-probe/releases).

## Release notes

See [NEWS](NEWS.md).

## Tested on

* Minecraft Bedrock 1.19.51, M1 iPad Pro (11-inch, 3rd generation, model MHQU3J/A)

## Author

PHO

## License

[CC0](https://creativecommons.org/share-your-work/public-domain/cc0/)
“No Rights Reserved”
