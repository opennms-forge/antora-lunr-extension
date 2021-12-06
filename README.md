# Antora Lunr Extension

[Lunr](https://lunrjs.com/) provides a great search experience without the need for external, server-side, search services.
It makes it possible to add an *offline* search engine to your Antora documentation site.

:information_source: **NOTE:** The Antora Extension for Lunr is compatible with [Antora 3.0 and newer](https://docs.antora.org/antora/3.0/whats-new/).

# Usage

## Install the Antora extension

The first step towards integrating Lunr with your Antora playbook is to install the package and [register it as an Antora extension](https://docs.antora.org/antora/3.0/extend/register-extension/).

Install the extension:

```console
$ npm install https://gitlab.com/antora/antora-lunr-extension
```

:bulb: **TIP**: While we recommend using local dependencies rather than global, you *can* install the extension globally if you add the `-g` flag.

```console
$ npm install -g https://gitlab.com/antora/antora-lunr-extension
```

## Generate an index file

To integrate Lunr in Antora as an extension, we register the package in the `antora-playbook.yml`.

We assume the name of your playbook is `antora-playbook.yml`.
Open the [Antora playbook](https://docs.antora.org/antora/3.0/playbook/), and add the extension.

```yaml
# antora-playbook.yml
antora:
  extensions:
    - require: '@antora/antora-lunr-extension'
```

When generating your documentation site again, an index file will be created at the root of your output directory, which depends on the value of `output.dir` in your playbook.
For the [default output dir](https://docs.antora.org/antora/3.0/playbook/configure-output/#default-output-dir), that will be `build/site/search-index.js`.

## Enable the search component in the UI

Now that we have a `search-index.js`, we need to enable the search component in the UI.

Copy the `supplemental_ui` directory from the npm package `node_modules/@antora/antora-lunr-extension/supplemental_ui` in your Antora playbook repository and configure a `ui.supplemental_files`:

```yaml
# antora-playbook.yml
ui:
  bundle:
    url: https://gitlab.com/antora/antora-ui-default/-/jobs/artifacts/master/raw/build/ui-bundle.zip?job=bundle-stable
    snapshot: true
  supplemental_files: ./supplemental_ui
```


:information_source: **NOTE**: For this to function correctly you must provide the `site.url` key in your playbook file.
See the Antora docs on the [playbook UI keys](https://docs.antora.org/antora/3.0/playbook/configure-ui/).
If using the site locally (not serving from a web server) then you can set your `site.url` to a `file://` reference, e.g. `file:///home/documents/antora/website/public/`.

:bulb: **TIP**: If you are using [`serve`](https://www.npmjs.com/package/serve) HTTP server to view your site locally, set the `site.url` to `http://localhost:5000`.

## Generate the site

Generate your documentation site using Antora.
For instance, via the command line:

```console
$ antora generate antora-playbook.yml
```

# Configuration

:rotating_light: **IMPORTANT**: In earlier versions configuration was performed with environment variables.
This has been replaced with configuring the extension via the playbook.

## Index only the latest version

To index only the latest (released) version, set the `indexLatestOnly` configuration key:

```yaml
# antora-playbook.yml
antora:
  extensions:
    - require: '@antora/antora-lunr-extension'
      indexLatestOnly: true
```

By default the extension indexes all the versions of your documentation components.

## Support for other languages

By default, Lunr only supports English as an indexing language.
You can add support for the following other languages:

- ![ar](https://raw.githubusercontent.com/madebybowtie/FlagKit/master/Assets/PNG/IQ.png) Arabic (ar)
- ![zh](https://raw.githubusercontent.com/madebybowtie/FlagKit/master/Assets/PNG/CN.png) Chinese (zh)
- ![da](https://raw.githubusercontent.com/madebybowtie/FlagKit/master/Assets/PNG/DK.png) Danish (da)
- ![nl](https://raw.githubusercontent.com/madebybowtie/FlagKit/master/Assets/PNG/NL.png) Dutch (nl)
- ![fi](https://raw.githubusercontent.com/madebybowtie/FlagKit/master/Assets/PNG/FI.png) Finnish (fi)
- ![fr](https://raw.githubusercontent.com/madebybowtie/FlagKit/master/Assets/PNG/FR.png) French (fr)
- ![de](https://raw.githubusercontent.com/madebybowtie/FlagKit/master/Assets/PNG/DE.png) German (de)
- ![hi](https://raw.githubusercontent.com/madebybowtie/FlagKit/master/Assets/PNG/IN.png) Hindi (hi)
- ![hu](https://raw.githubusercontent.com/madebybowtie/FlagKit/master/Assets/PNG/HU.png) Hungarian (hu)
- ![it](https://raw.githubusercontent.com/madebybowtie/FlagKit/master/Assets/PNG/IT.png) Italian (it)
- ![ja](https://raw.githubusercontent.com/madebybowtie/FlagKit/master/Assets/PNG/JP.png) Japanese (ja)
- ![no](https://raw.githubusercontent.com/madebybowtie/FlagKit/master/Assets/PNG/NO.png) Norwegian (no)
- ![pt](https://raw.githubusercontent.com/madebybowtie/FlagKit/master/Assets/PNG/PT.png) Portuguese (pt)
- ![ro](https://raw.githubusercontent.com/madebybowtie/FlagKit/master/Assets/PNG/RO.png) Romanian (ro)
- ![ru](https://raw.githubusercontent.com/madebybowtie/FlagKit/master/Assets/PNG/RU.png) Russian (ru)
- ![es](https://raw.githubusercontent.com/madebybowtie/FlagKit/master/Assets/PNG/ES.png) Spanish (es)
- ![sv](https://raw.githubusercontent.com/madebybowtie/FlagKit/master/Assets/PNG/SE.png) Swedish (sv)
- ![th](https://raw.githubusercontent.com/madebybowtie/FlagKit/master/Assets/PNG/TH.png) Thai (th)
- ![tr](https://raw.githubusercontent.com/madebybowtie/FlagKit/master/Assets/PNG/TR.png) Turkish (tr)
- ![vi](https://raw.githubusercontent.com/madebybowtie/FlagKit/master/Assets/PNG/VN.png) Vietnamese (vi)


:rotating_light: **IMPORTANT**: To use Chinese language, you need to install `nodejieba` dependency:

```console
$ npm install nodejieba
```

To use one or more languages, set the `languages` configuration key with all the desired language codes as a list:

```yaml
# antora-playbook.yml
antora:
  extensions:
    - require: '@antora/antora-lunr-extension'
      languages: [en, fr]
```

## Testing this module

In the root of the repository, run `npm test`.

# Who’s using it

Here’s a list of projects who are using Antora Lunr.
To add your project to this list, please [edit this page](https://gitlab.com/antora/antora-lunr-extension/-/edit/main/README.adoc)!

-   [Uyuni Documentation](https://www.uyuni-project.org/uyuni-docs/)

-   [SUSE Manager Documentation](https://documentation.suse.com/external-tree/en-us/suma/4.0/suse-manager/index.html)

-   [Commodore Components Hub (VSHN)](https://hub.syn.tools/hub/index.html)

