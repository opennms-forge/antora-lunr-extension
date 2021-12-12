# Antora Lunr Extension

[Lunr](https://lunrjs.com) provides a great search experience without the need for external, server-side, search services.
With this extension, you can add an *offline* search engine to your Antora documentation site.

**NOTE:** The Antora Lunr Extension is designed for and compatible with [Antora 3.0 and newer](https://docs.antora.org/antora/3.0/whats-new/).
To integrate Lunr with an earlier version of Antora, you must use [antora-lunr](https://github.com/Mogztter/antora-lunr) instead.

To add Lunr search to your Antora documentation site, you need to install the extension package, register the extension in your Antora playbook file, and add the search interface to the pages of your site.
Let's get started.

## Install

Begin by installing the extension package into your playbook project:

```console
$ npm install https://gitlab.com/antora/antora-lunr-extension
```

**TIP**: While we recommend using local dependencies rather than global, you *can* install the extension globally if you add the `-g` flag.

```console
$ npm install -g https://gitlab.com/antora/antora-lunr-extension
```

## Usage

### Register the extension

Now that you have the Lunr extension installed, you need to [register the extension](https://docs.antora.org/antora/3.0/extend/register-extension/) with Antora.
To register the extension, add an entry to the `antora.extensions` key in your [Antora playbook file](https://docs.antora.org/antora/3.0/playbook/) (e.g., _antora-playbook.yml_).

Open the Antora playbook file and add the extension as follows:

**antora-playbook.yml**

```yaml
antora:
  extensions:
  - require: '@antora/lunr-extension'
```

Alternately, you can register the extension directly from the `antora` CLI using the `--extension` option.

### Generate an index file

When you generate your documentation site the next time, the extension will automatically generate an index file at the root of your output directory.
The location of this file depends on the value of `output.dir` key in your playbook.
When you the [default output dir](https://docs.antora.org/antora/3.0/playbook/configure-output/#default-output-dir), that location is *build/site/search-index.js*.

### Enable the search interface

Now that we have a search index (i.e., *search-index.js*), we need to enable the search component in the UI.

Copy the *supplemental_ui* directory from the npm package at *node_modules/@antora/lunr-extension/supplemental_ui* in your Antora playbook repository and configure the `ui.supplemental_files` key as follows:

**antora-playbook.yml**

```yaml
ui:
  bundle:
    url: https://gitlab.com/antora/antora-ui-default/-/jobs/artifacts/HEAD/raw/build/ui-bundle.zip?job=bundle-stable
    snapshot: true
  supplemental_files: ./supplemental_ui
```

**NOTE**: For this to function correctly you must provide the `site.url` key in your playbook file.
See the Antora docs on the [playbook UI keys](https://docs.antora.org/antora/3.0/playbook/configure-ui/).
If using the site locally (not serving from a web server), then you can set your `site.url` key to a file URI (e.g., `file:///home/documents/antora/website/public/`).

**TIP:** If you're using the [http-server](https://www.npmjs.com/package/http-server) to provide an HTTP server to view your site locally, set the `site.url` key to `http://localhost:8080`.

### Generate the site

Generate your documentation site using Antora.
For instance, via the command line:

```console
$ antora antora-playbook.yml
```

## Configuration

**IMPORTANT**: In [antora-lunr](https://github.com/Mogztter/antora-lunr) (the predecessor of this extension), configuration was performed using environment variables.
In this extension, configuration is now done using configuration keys in the playbook.

### Index only the latest version

To index only the latest (i.e., released) version, set the `index_latest_only` configuration key:

**antora-playbook.yml**

```yaml
antora:
  extensions:
  - require: '@antora/lunr-extension'
    index_latest_only: true
```

By default the extension indexes all the versions of your documentation components.

### Support for other languages

By default, Lunr only supports English as an indexing language.
You can add support for the following other languages:

- ![ar](https://cdn.jsdelivr.net/gh/madebybowtie/FlagKit/Assets/PNG/IQ.png) Arabic (ar)
- ![zh](https://cdn.jsdelivr.net/gh/madebybowtie/FlagKit/Assets/PNG/CN.png) Chinese (zh)
- ![da](https://cdn.jsdelivr.net/gh/madebybowtie/FlagKit/Assets/PNG/DK.png) Danish (da)
- ![nl](https://cdn.jsdelivr.net/gh/madebybowtie/FlagKit/Assets/PNG/NL.png) Dutch (nl)
- ![fi](https://cdn.jsdelivr.net/gh/madebybowtie/FlagKit/Assets/PNG/FI.png) Finnish (fi)
- ![fr](https://cdn.jsdelivr.net/gh/madebybowtie/FlagKit/Assets/PNG/FR.png) French (fr)
- ![de](https://cdn.jsdelivr.net/gh/madebybowtie/FlagKit/Assets/PNG/DE.png) German (de)
- ![hi](https://cdn.jsdelivr.net/gh/madebybowtie/FlagKit/Assets/PNG/IN.png) Hindi (hi)
- ![hu](https://cdn.jsdelivr.net/gh/madebybowtie/FlagKit/Assets/PNG/HU.png) Hungarian (hu)
- ![it](https://cdn.jsdelivr.net/gh/madebybowtie/FlagKit/Assets/PNG/IT.png) Italian (it)
- ![ja](https://cdn.jsdelivr.net/gh/madebybowtie/FlagKit/Assets/PNG/JP.png) Japanese (ja)
- ![no](https://cdn.jsdelivr.net/gh/madebybowtie/FlagKit/Assets/PNG/NO.png) Norwegian (no)
- ![pt](https://cdn.jsdelivr.net/gh/madebybowtie/FlagKit/Assets/PNG/PT.png) Portuguese (pt)
- ![ro](https://cdn.jsdelivr.net/gh/madebybowtie/FlagKit/Assets/PNG/RO.png) Romanian (ro)
- ![ru](https://cdn.jsdelivr.net/gh/madebybowtie/FlagKit/Assets/PNG/RU.png) Russian (ru)
- ![es](https://cdn.jsdelivr.net/gh/madebybowtie/FlagKit/Assets/PNG/ES.png) Spanish (es)
- ![sv](https://cdn.jsdelivr.net/gh/madebybowtie/FlagKit/Assets/PNG/SE.png) Swedish (sv)
- ![th](https://cdn.jsdelivr.net/gh/madebybowtie/FlagKit/Assets/PNG/TH.png) Thai (th)
- ![tr](https://cdn.jsdelivr.net/gh/madebybowtie/FlagKit/Assets/PNG/TR.png) Turkish (tr)
- ![vi](https://cdn.jsdelivr.net/gh/madebybowtie/FlagKit/Assets/PNG/VN.png) Vietnamese (vi)

**IMPORTANT**: To use Chinese as your language, you need to install the `nodejieba` dependency:

```console
$ npm install nodejieba
```

To use one or more languages, set the `languages` configuration key with all the desired language codes as a list:

**antora-playbook.yml**

```yaml
antora:
  extensions:
  - require: '@antora/lunr-extension'
    languages: [en, fr]
```

## Run tests

This project is built using Node.js.
In order to run the tests, you need Node.js and the development dependencies for the project.

First, make sure you have at least Node.js installed.

```console
$ node -v
```

If you don't have Node.js, you can use [nvm](https://github.com/nvm-sh/nvm) to install and manage it.

Once you have Node.js installed, run the following command to install the development dependencies:

```console
$ npm i
```

Now that you have the necessary prerequisites, you can run the tests using the following command:

```console
$ npm test
```

This command will use Mocha to run all the tests in the *tests/* folder.

## Who's using it?

Here's a list of projects using the Antora Lunr extension.

- [SUSE Manager Documentation](https://documentation.suse.com/external-tree/en-us/suma/4.0/suse-manager/)
- [Uyuni Documentation](https://www.uyuni-project.org/uyuni-docs/)
- [NTT Application Security](https://source.whitehatsec.com/help/sentinel/)
- [Commodore Components Hub (VSHN)](https://hub.syn.tools/hub/)

To add your project to this list, please [edit this file](https://gitlab.com/antora/antora-lunr-extension/-/edit/main/README.md)!
